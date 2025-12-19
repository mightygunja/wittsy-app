import { ref, onValue, set, remove, onDisconnect, serverTimestamp } from 'firebase/database';
import { realtimeDb } from './firebase';

// ==================== PRESENCE OPERATIONS ====================

/**
 * Set user online status
 */
export const setUserOnline = (userId: string, username: string): void => {
  const userStatusRef = ref(realtimeDb, `presence/${userId}`);
  const connectedRef = ref(realtimeDb, '.info/connected');
  
  onValue(connectedRef, (snapshot) => {
    if (snapshot.val() === true) {
      // User is online
      set(userStatusRef, {
        online: true,
        username,
        lastSeen: serverTimestamp()
      });
      
      // Remove presence on disconnect
      onDisconnect(userStatusRef).set({
        online: false,
        username,
        lastSeen: serverTimestamp()
      });
    }
  });
};

/**
 * Set user offline
 */
export const setUserOffline = (userId: string): void => {
  const userStatusRef = ref(realtimeDb, `presence/${userId}`);
  set(userStatusRef, {
    online: false,
    lastSeen: serverTimestamp()
  });
};

/**
 * Subscribe to user presence updates
 */
export const subscribeToPresence = (
  userId: string,
  callback: (isOnline: boolean) => void
): (() => void) => {
  const userStatusRef = ref(realtimeDb, `presence/${userId}`);
  
  const unsubscribe = onValue(userStatusRef, (snapshot) => {
    const data = snapshot.val();
    callback(data?.online === true);
  });
  
  return unsubscribe;
};

/**
 * Subscribe to room presence (all players)
 */
export const subscribeToRoomPresence = (
  roomId: string,
  callback: (presenceData: { [userId: string]: any }) => void
): (() => void) => {
  const roomPresenceRef = ref(realtimeDb, `rooms/${roomId}/presence`);
  
  const unsubscribe = onValue(roomPresenceRef, (snapshot) => {
    callback(snapshot.val() || {});
  });
  
  return unsubscribe;
};

// ==================== TYPING INDICATORS ====================

/**
 * Set user typing status in a room
 */
export const setTyping = (roomId: string, userId: string, isTyping: boolean): void => {
  const typingRef = ref(realtimeDb, `typing/${roomId}/${userId}`);
  
  if (isTyping) {
    set(typingRef, {
      timestamp: serverTimestamp()
    });
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      remove(typingRef);
    }, 3000);
  } else {
    remove(typingRef);
  }
};

/**
 * Subscribe to typing indicators in a room
 */
export const subscribeToTyping = (
  roomId: string,
  callback: (typingUsers: string[]) => void
): (() => void) => {
  const typingRef = ref(realtimeDb, `typing/${roomId}`);
  
  const unsubscribe = onValue(typingRef, (snapshot) => {
    const typingData = snapshot.val() || {};
    const typingUsers = Object.keys(typingData);
    callback(typingUsers);
  });
  
  return unsubscribe;
};

// ==================== GAME STATE SYNC ====================

/**
 * Update live game state
 */
export const updateGameState = (
  roomId: string,
  state: {
    phase?: 'submission' | 'voting' | 'results';
    timeRemaining?: number;
    currentPrompt?: any;
    submissions?: { [userId: string]: boolean };
    votes?: { [userId: string]: string };
  }
): void => {
  const gameStateRef = ref(realtimeDb, `rooms/${roomId}/gameState`);
  set(gameStateRef, {
    ...state,
    updatedAt: serverTimestamp()
  });
};

/**
 * Subscribe to live game state updates
 */
export const subscribeToGameState = (
  roomId: string,
  callback: (gameState: any) => void
): (() => void) => {
  const gameStateRef = ref(realtimeDb, `rooms/${roomId}/gameState`);
  
  const unsubscribe = onValue(gameStateRef, (snapshot) => {
    callback(snapshot.val());
  });
  
  return unsubscribe;
};

/**
 * Clear game state when room closes
 */
export const clearRoomState = (roomId: string): void => {
  const roomRef = ref(realtimeDb, `rooms/${roomId}`);
  remove(roomRef);
};

// ==================== PLAYER ACTIONS ====================

/**
 * Mark that a player has submitted their phrase
 */
export const markSubmission = (roomId: string, userId: string): void => {
  const submissionRef = ref(realtimeDb, `rooms/${roomId}/submissions/${userId}`);
  set(submissionRef, {
    submitted: true,
    timestamp: serverTimestamp()
  });
};

/**
 * Mark that a player has voted
 */
export const markVote = (roomId: string, userId: string, phraseId: string): void => {
  const voteRef = ref(realtimeDb, `rooms/${roomId}/votes/${userId}`);
  set(voteRef, {
    phraseId,
    timestamp: serverTimestamp()
  });
};

/**
 * Subscribe to submissions count
 */
export const subscribeToSubmissions = (
  roomId: string,
  callback: (count: number) => void
): (() => void) => {
  const submissionsRef = ref(realtimeDb, `rooms/${roomId}/submissions`);
  
  const unsubscribe = onValue(submissionsRef, (snapshot) => {
    const submissions = snapshot.val() || {};
    callback(Object.keys(submissions).length);
  });
  
  return unsubscribe;
};

/**
 * Subscribe to votes count
 */
export const subscribeToVotes = (
  roomId: string,
  callback: (votes: { [phraseId: string]: number }) => void
): (() => void) => {
  const votesRef = ref(realtimeDb, `rooms/${roomId}/votes`);
  
  const unsubscribe = onValue(votesRef, (snapshot) => {
    const votesData = snapshot.val() || {};
    const voteCounts: { [phraseId: string]: number } = {};
    
    Object.values(votesData).forEach((vote: any) => {
      const phraseId = vote.phraseId;
      voteCounts[phraseId] = (voteCounts[phraseId] || 0) + 1;
    });
    
    callback(voteCounts);
  });
  
  return unsubscribe;
};
