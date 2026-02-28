/**
 * Room Persistence Service
 * Tracks user's current room and handles auto-leave/rejoin
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { leaveRoom } from './database';

const CURRENT_ROOM_KEY = '@wittsy:currentRoom';
const LAST_ROOM_KEY = '@wittsy:lastRoom';

interface RoomSession {
  roomId: string;
  userId: string;
  joinedAt: string;
  roomName?: string;
}

/**
 * Save current room session
 */
export const saveCurrentRoom = async (roomId: string, userId: string, roomName?: string): Promise<void> => {
  try {
    const session: RoomSession = {
      roomId,
      userId,
      joinedAt: new Date().toISOString(),
      roomName,
    };
    await AsyncStorage.setItem(CURRENT_ROOM_KEY, JSON.stringify(session));
    console.log('💾 Saved current room:', roomId);
  } catch (error) {
    console.error('Failed to save current room:', error);
  }
};

/**
 * Get current room session
 */
export const getCurrentRoom = async (): Promise<RoomSession | null> => {
  try {
    const data = await AsyncStorage.getItem(CURRENT_ROOM_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('Failed to get current room:', error);
    return null;
  }
};

/**
 * Clear current room (user left normally)
 */
export const clearCurrentRoom = async (): Promise<void> => {
  try {
    // Save to last room before clearing
    const current = await getCurrentRoom();
    if (current) {
      await AsyncStorage.setItem(LAST_ROOM_KEY, JSON.stringify(current));
    }
    
    await AsyncStorage.removeItem(CURRENT_ROOM_KEY);
    console.log('🗑️ Cleared current room');
  } catch (error) {
    console.error('Failed to clear current room:', error);
  }
};

/**
 * Get last room user was in (for rejoin prompt)
 */
export const getLastRoom = async (): Promise<RoomSession | null> => {
  try {
    const data = await AsyncStorage.getItem(LAST_ROOM_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('Failed to get last room:', error);
    return null;
  }
};

/**
 * Clear last room
 */
export const clearLastRoom = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(LAST_ROOM_KEY);
    console.log('🗑️ Cleared last room');
  } catch (error) {
    console.error('Failed to clear last room:', error);
  }
};

/**
 * Auto-leave current room (called when app closes/backgrounds)
 */
export const autoLeaveCurrentRoom = async (): Promise<void> => {
  try {
    const session = await getCurrentRoom();
    if (session) {
      console.log('🚪 Auto-leaving room:', session.roomId);
      await leaveRoom(session.roomId, session.userId);
      
      // Move to last room for potential rejoin
      await AsyncStorage.setItem(LAST_ROOM_KEY, JSON.stringify(session));
      await AsyncStorage.removeItem(CURRENT_ROOM_KEY);
      
      console.log('✅ Auto-left room successfully');
    }
  } catch (error) {
    console.error('Failed to auto-leave room:', error);
  }
};

/**
 * Check if user should be prompted to rejoin
 * Returns room info if rejoin is possible, null otherwise
 */
export const shouldPromptRejoin = async (userId: string): Promise<RoomSession | null> => {
  try {
    const lastRoom = await getLastRoom();
    
    if (!lastRoom || lastRoom.userId !== userId) {
      return null;
    }
    
    // Check if last room was recent (within 10 minutes)
    const joinedAt = new Date(lastRoom.joinedAt).getTime();
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;
    
    if (now - joinedAt > tenMinutes) {
      // Too old, clear it
      await clearLastRoom();
      return null;
    }
    
    return lastRoom;
  } catch (error) {
    console.error('Failed to check rejoin:', error);
    return null;
  }
};
