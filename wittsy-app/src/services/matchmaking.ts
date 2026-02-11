/**
 * Matchmaking Service
 * Handles Quick Play matchmaking, room finding, and auto-start logic
 */

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { firestore } from './firebase';
import { Room, RoomSettings } from '../types';
import { generateUniqueRoomName } from '../utils/roomNameGenerator';
import { getCurrentSeason } from './seasons';

const ELO_RANGE = 200; // ±200 ELO for matchmaking

/**
 * Find available ranked room for Quick Play
 * Prioritizes rooms with similar ELO and available space
 */
export const findAvailableRankedRoom = async (
  userElo: number
): Promise<Room | null> => {
  try {
    console.log(`🔍 Searching for ranked rooms (User ELO: ${userElo})`);
    
    const q = query(
      collection(firestore, 'rooms'),
      where('isRanked', '==', true),
      where('status', '==', 'waiting')
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('❌ No ranked rooms found in waiting state');
      return null;
    }

    console.log(`📋 Found ${snapshot.docs.length} waiting ranked rooms`);

    // Filter by available space and countdown status
    const availableRooms = snapshot.docs
      .map(doc => ({ roomId: doc.id, ...doc.data() } as Room))
      .filter(room => {
        const hasSpace = room.players.length < room.settings.maxPlayers;
        const countdownNotFinished = !room.countdownStartedAt || 
          (Date.now() - new Date(room.countdownStartedAt).getTime()) < (room.countdownDuration || 30) * 1000;
        const isJoinable = hasSpace && countdownNotFinished;
        
        if (!isJoinable) {
          console.log(`⏭️ Skipping room ${room.roomId}: hasSpace=${hasSpace}, countdownOk=${countdownNotFinished}`);
        }
        
        return isJoinable;
      });

    if (availableRooms.length === 0) {
      console.log('❌ No joinable rooms after filtering');
      return null;
    }

    console.log(`✅ Found ${availableRooms.length} joinable rooms`);

    // Sort by ELO proximity (closest match first)
    availableRooms.sort((a, b) => {
      const avgEloA = a.players.length > 0 
        ? a.players.reduce((sum, p) => sum + (p.rating || 1000), 0) / a.players.length
        : 1000;
      const avgEloB = b.players.length > 0
        ? b.players.reduce((sum, p) => sum + (p.rating || 1000), 0) / b.players.length
        : 1000;
      
      const diffA = Math.abs(avgEloA - userElo);
      const diffB = Math.abs(avgEloB - userElo);
      
      return diffA - diffB;
    });

    const selectedRoom = availableRooms[0];
    const avgElo = selectedRoom.players.length > 0
      ? selectedRoom.players.reduce((sum, p) => sum + (p.rating || 1000), 0) / selectedRoom.players.length
      : 1000;
    
    console.log(`🎯 Selected room ${selectedRoom.roomId} (Avg ELO: ${avgElo.toFixed(0)}, Players: ${selectedRoom.players.length}/${selectedRoom.settings.maxPlayers})`);
    
    return selectedRoom;
  } catch (error) {
    console.error('❌ Error finding ranked room:', error);
    return null;
  }
};

/**
 * Create a new ranked room with a unique, pretty name
 */
export const createRankedRoom = async (
  userId: string,
  username: string
): Promise<string> => {
  try {
    console.log(`🎮 Creating new ranked room for ${username} (${userId})`);
    
    // Get current active season
    const currentSeason = await getCurrentSeason();
    if (!currentSeason) {
      console.warn('⚠️ No active season found, creating ranked room without season link');
    } else {
      console.log(`📅 Linking to season: ${currentSeason.name} (${currentSeason.id})`);
    }
    
    // Get all active room names to ensure uniqueness
    const activeRoomsQuery = query(
      collection(firestore, 'rooms'),
      where('status', 'in', ['waiting', 'active'])
    );
    const activeRoomsSnapshot = await getDocs(activeRoomsQuery);
    const existingNames = activeRoomsSnapshot.docs.map(doc => doc.data().name);
    
    // Generate a unique room name
    const roomName = generateUniqueRoomName(existingNames);
    console.log(`📝 Generated room name: "${roomName}"`);
    
    const roomData = {
      name: roomName,
      hostId: userId,
      players: [],
      spectators: [],
      status: 'waiting' as const,
      isRanked: true,
      seasonId: currentSeason?.id || null,
      seasonNumber: currentSeason?.number || null,
      seasonName: currentSeason?.name || null,
      currentRound: 0,
      currentPrompt: null,
      scores: {},
      gameState: 'lobby' as const,
      settings: {
        maxPlayers: 12,
        minPlayers: 3,
        submissionTime: 20,
        votingTime: 15,
        winningVotes: 20,
        joinLockVoteThreshold: 8,
        promptPacks: ['default'],
        isPrivate: false,
        profanityFilter: 'medium' as const,
        spectatorChatEnabled: true,
        allowJoinMidGame: false,
        autoStart: true,
        countdownTriggerPlayers: 6,
      } as RoomSettings,
      createdAt: serverTimestamp(),
      startedAt: null,
      countdownStartedAt: null,
      countdownDuration: 30,
    };

    const docRef = await addDoc(collection(firestore, 'rooms'), roomData);
    console.log(`✅ Successfully created ranked room: "${roomName}" (${docRef.id})`);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating ranked room:', error);
    throw new Error(`Failed to create ranked room: ${error}`);
  }
};

/**
 * Get browsable ranked rooms with ELO filtering
 */
export const getBrowsableRankedRooms = async (
  userElo: number
): Promise<Room[]> => {
  try {
    console.log(`📋 Fetching browsable ranked rooms (User ELO: ${userElo})`);
    
    const q = query(
      collection(firestore, 'rooms'),
      where('isRanked', '==', true),
      where('status', 'in', ['waiting', 'active'])
    );

    const snapshot = await getDocs(q);
    
    const rooms = snapshot.docs
      .map(doc => ({ roomId: doc.id, ...doc.data() } as Room))
      .filter(room => {
        // Active (in-progress) games are always shown so players can rejoin
        if (room.status === 'active') {
          return true;
        }
        
        // For waiting rooms, apply space/countdown/ELO filters
        const hasSpace = room.players.length < room.settings.maxPlayers;
        const countdownNotFinished = !room.countdownStartedAt || 
          (Date.now() - new Date(room.countdownStartedAt).getTime()) < (room.countdownDuration || 30) * 1000;
        
        // Calculate average ELO of players in room
        const avgRoomElo = room.players.length > 0
          ? room.players.reduce((sum, p) => sum + (p.rating || 1000), 0) / room.players.length
          : 1000;
        
        // Only show rooms within ±200 ELO range
        const eloDiff = Math.abs(avgRoomElo - userElo);
        const withinEloRange = eloDiff <= ELO_RANGE;
        
        if (!withinEloRange) {
          console.log(`⏭️ Filtering out room ${room.roomId}: ELO diff ${eloDiff.toFixed(0)} (Room: ${avgRoomElo.toFixed(0)}, User: ${userElo})`);
        }
        
        return hasSpace && countdownNotFinished && withinEloRange;
      })
      .sort((a, b) => {
        // Sort by player count (more players = more attractive)
        return b.players.length - a.players.length;
    });
  
  console.log(`✅ Returning ${rooms.length} ELO-filtered ranked rooms`);
  return rooms;
  } catch (error) {
    console.error('❌ Error getting browsable ranked rooms:', error);
    return [];
  }
};
