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

const ELO_RANGE = 200; // ±200 ELO for matchmaking

/**
 * Find available ranked room for Quick Play
 * Prioritizes rooms with similar ELO and available space
 */
export const findAvailableRankedRoom = async (
  userElo: number
): Promise<Room | null> => {
  try {
    const q = query(
      collection(firestore, 'rooms'),
      where('isRanked', '==', true),
      where('status', '==', 'waiting')
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;

    // Filter by ELO range and available space
    const availableRooms = snapshot.docs
      .map(doc => ({ roomId: doc.id, ...doc.data() } as Room))
      .filter(room => {
        const hasSpace = room.players.length < room.settings.maxPlayers;
        const countdownNotFinished = !room.countdownStartedAt || 
          (Date.now() - new Date(room.countdownStartedAt).getTime()) < (room.countdownDuration || 30) * 1000;
        return hasSpace && countdownNotFinished;
      });

    if (availableRooms.length === 0) return null;

    // Return first available room
    return availableRooms[0];
  } catch (error) {
    console.error('Error finding ranked room:', error);
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
    // Get all active room names to ensure uniqueness
    const activeRoomsQuery = query(
      collection(firestore, 'rooms'),
      where('status', 'in', ['waiting', 'active'])
    );
    const activeRoomsSnapshot = await getDocs(activeRoomsQuery);
    const existingNames = activeRoomsSnapshot.docs.map(doc => doc.data().name);
    
    // Generate a unique room name
    const roomName = generateUniqueRoomName(existingNames);
    
    const roomData = {
      name: roomName,
      hostId: userId,
      players: [],
      status: 'waiting',
      isRanked: true,
      settings: {
        maxPlayers: 12,
        submissionTime: 25,
        votingTime: 10,
        winningScore: 20,
        isPrivate: false,
        minPlayers: 3,
        autoStart: true,
        countdownTriggerPlayers: 6,
      } as RoomSettings,
      createdAt: serverTimestamp(),
      countdownStartedAt: null,
      countdownDuration: 30,
    };

    const docRef = await addDoc(collection(firestore, 'rooms'), roomData);
    console.log(`✨ Created ranked room: "${roomName}" (${docRef.id})`);
    return docRef.id;
  } catch (error) {
    console.error('Error creating ranked room:', error);
    throw error;
  }
};

/**
 * Get browsable ranked rooms with ELO filtering
 */
export const getBrowsableRankedRooms = async (
  userElo: number
): Promise<Room[]> => {
  try {
    const q = query(
      collection(firestore, 'rooms'),
      where('isRanked', '==', true),
      where('status', '==', 'waiting')
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs
      .map(doc => ({ roomId: doc.id, ...doc.data() } as Room))
      .filter(room => {
        const hasSpace = room.players.length < room.settings.maxPlayers;
        const countdownNotFinished = !room.countdownStartedAt || 
          (Date.now() - new Date(room.countdownStartedAt).getTime()) < (room.countdownDuration || 30) * 1000;
        return hasSpace && countdownNotFinished;
      });
  } catch (error) {
    console.error('Error getting browsable ranked rooms:', error);
    return [];
  }
};
