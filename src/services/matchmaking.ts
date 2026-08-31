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
  serverTimestamp,
} from 'firebase/firestore';
import { firestore } from './firebase';
import { Room, RoomSettings } from '../types';
import { generateUniqueRoomName } from '../utils/roomNameGenerator';
import { getCurrentSeason } from './seasons';
import { avatarService } from './avatarService';

const ELO_RANGE = 200; // ±200 ELO for matchmaking
const DEFAULT_RATING = 1200; // Matches the rating new profiles are created with (auth.ts)
const STALE_WAITING_ROOM_MS = 30 * 60 * 1000; // Waiting rooms older than 30 min are considered abandoned

/**
 * Average rating of the players in a room, based on the ratings actually
 * stored on the player objects. Returns null when no player carries a
 * rating (older rooms / players joined through paths that don't stamp it),
 * so callers can skip ELO filtering instead of comparing against a
 * made-up number.
 */
const getRoomAvgElo = (room: Room): number | null => {
  const ratings = (room.players || [])
    .map(p => (p as { rating?: number }).rating)
    .filter((r): r is number => typeof r === 'number' && !Number.isNaN(r));
  if (ratings.length === 0) return null;
  return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
};

/**
 * createdAt can be a Firestore Timestamp (new rooms) or an ISO string
 * (legacy). Returns epoch millis, or null when unknown.
 */
const getCreatedAtMillis = (createdAt: unknown): number | null => {
  if (!createdAt) return null;
  if (typeof (createdAt as { toMillis?: () => number }).toMillis === 'function') {
    return (createdAt as { toMillis: () => number }).toMillis();
  }
  const ms = new Date(createdAt as string).getTime();
  return Number.isNaN(ms) ? null : ms;
};

const isStaleWaitingRoom = (room: Room): boolean => {
  const createdMs = getCreatedAtMillis((room as { createdAt?: unknown }).createdAt);
  if (createdMs === null) return false; // unknown age — don't over-filter
  return Date.now() - createdMs > STALE_WAITING_ROOM_MS;
};

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

    if (snapshot.empty) {
      return null;
    }

    // Filter by available space, countdown status, and staleness
    // (abandoned lobbies whose players force-quit stay 'waiting' forever —
    // don't funnel new players into them)
    const availableRooms = snapshot.docs
      .map(doc => ({ roomId: doc.id, ...doc.data() } as Room))
      .filter(room => {
        const hasSpace = room.players.length < room.settings.maxPlayers;
        const countdownNotFinished = !room.countdownStartedAt ||
          (Date.now() - new Date(room.countdownStartedAt).getTime()) < (room.countdownDuration || 30) * 1000;
        return hasSpace && countdownNotFinished && !isStaleWaitingRoom(room);
      });

    if (availableRooms.length === 0) {
      return null;
    }

    // Sort by ELO proximity (closest match first). Rooms with no rating
    // data sort behind rooms known to be in range, ahead of far ones.
    const eloDistance = (room: Room): number => {
      const avg = getRoomAvgElo(room);
      return avg === null ? ELO_RANGE / 2 : Math.abs(avg - userElo);
    };
    availableRooms.sort((a, b) => eloDistance(a) - eloDistance(b));

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
  username: string,
  hostRating?: number
): Promise<string> => {
  try {
    // Get current active season
    const currentSeason = await getCurrentSeason();
    if (!currentSeason) {
      console.warn('No active season found, creating ranked room without season link');
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

    // Load host's avatar config
    const hostAvatar = await avatarService.getUserAvatar(userId);

    const roomData = {
      name: roomName,
      hostId: userId,
      players: [{
        userId,
        username,
        isReady: false,
        isConnected: true,
        joinedAt: new Date().toISOString(),
        avatar: null,
        avatarConfig: hostAvatar?.config || undefined,
        // Stamp the host's rating so ELO matchmaking/browse filtering has real data
        rating: typeof hostRating === 'number' ? hostRating : DEFAULT_RATING,
      }],
      spectators: [],
      status: 'waiting' as const,
      isRanked: true,
      seasonId: currentSeason?.id || null,
      seasonNumber: currentSeason?.number || null,
      seasonName: currentSeason?.name || null,
      currentRound: 0,
      currentPrompt: null,
      scores: { [userId]: { totalVotes: 0, roundWins: 0, stars: 0, phrases: [] } },
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
    return docRef.id;
  } catch (error) {
    console.error('Error creating ranked room:', error);
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
    const q = query(
      collection(firestore, 'rooms'),
      where('isRanked', '==', true),
      where('status', '==', 'waiting')
    );

    const snapshot = await getDocs(q);

    const rooms = snapshot.docs
      .map(doc => ({ roomId: doc.id, ...doc.data() } as Room))
      .filter(room => {
        const hasSpace = room.players.length < room.settings.maxPlayers;
        const countdownNotFinished = !room.countdownStartedAt ||
          (Date.now() - new Date(room.countdownStartedAt).getTime()) < (room.countdownDuration || 30) * 1000;

        // Only apply the ±200 ELO filter when the room actually has rating
        // data; rooms without it must not be hidden from everyone.
        const avgRoomElo = getRoomAvgElo(room);
        const withinEloRange = avgRoomElo === null || Math.abs(avgRoomElo - userElo) <= ELO_RANGE;

        return hasSpace && countdownNotFinished && withinEloRange && !isStaleWaitingRoom(room);
      })
      .sort((a, b) => {
        // Sort by player count (more players = more attractive)
        return b.players.length - a.players.length;
      });

    return rooms;
  } catch (error) {
    console.error('Error getting browsable ranked rooms:', error);
    return [];
  }
};
