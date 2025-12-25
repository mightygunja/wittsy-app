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
  const gameRef = ref(realtimeDb, `rooms/${roomId}/game`);
  
  console.log('🎮 Subscribing to game:', `rooms/${roomId}/game`);
  
  const unsubscribe = onValue(gameRef, (snapshot) => {
    const state = snapshot.val();
    
    if (state) {
      // Transform new format to old format for compatibility
      const phaseDurations = { prompt: 3, submission: 25, voting: 10, results: 8 };
      const elapsed = (Date.now() - state.phaseStart) / 1000;
      const duration = phaseDurations[state.phase as keyof typeof phaseDurations] || 0;
      const remaining = Math.max(0, Math.floor(duration - elapsed));
      
      const transformedState = {
        phase: state.phase,
        timeRemaining: remaining,
        currentPrompt: state.prompt,
        currentRound: state.round,
        submissions: state.submissions || {},
        votes: state.votes || {},
        lastWinner: state.lastWinner,
        lastWinningPhrase: state.lastWinningPhrase,
        phaseStartTime: state.phaseStart,
        phaseDuration: duration
      };
      
      console.log('⏱️ Game state update:', transformedState);
      callback(transformedState);
    } else {
      callback(null);
    }
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
export const markSubmission = (roomId: string, userId: string, phraseText: string): void => {
  // Store in submissions tracking
  const submissionRef = ref(realtimeDb, `rooms/${roomId}/submissions/${userId}`);
  set(submissionRef, {
    submitted: true,
    timestamp: serverTimestamp()
  });
  
  // Store the actual phrase in game state (matching subscription path)
  const gameStateSubmissionRef = ref(realtimeDb, `rooms/${roomId}/game/submissions/${userId}`);
  set(gameStateSubmissionRef, phraseText);
  console.log('💾 Saved submission:', phraseText, 'to', `rooms/${roomId}/game/submissions/${userId}`);
};

/**
 * Mark that a player has voted
 */
export const markVote = (roomId: string, userId: string, phraseId: string): void => {
  // Store in votes tracking
  const voteRef = ref(realtimeDb, `rooms/${roomId}/votes/${userId}`);
  set(voteRef, {
    phraseId,
    timestamp: serverTimestamp()
  });
  
  // Store the actual vote in game state (matching subscription path)
  const gameStateVoteRef = ref(realtimeDb, `rooms/${roomId}/game/votes/${userId}`);
  set(gameStateVoteRef, phraseId);
  console.log('🗳️ Saved vote for:', phraseId, 'to', `rooms/${roomId}/game/votes/${userId}`);
};

/**
 * Subscribe to submissions count
 */
export const subscribeToSubmissions = (
  roomId: string,
  callback: (count: number) => void
): (() => void) => {
  // Count actual submissions in game state, not just tracking flags
  const gameSubmissionsRef = ref(realtimeDb, `rooms/${roomId}/game/submissions`);
  
  const unsubscribe = onValue(gameSubmissionsRef, (snapshot) => {
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
  // Read actual votes from game state
  const votesRef = ref(realtimeDb, `rooms/${roomId}/game/votes`);
  
  const unsubscribe = onValue(votesRef, (snapshot) => {
    const votesData = snapshot.val() || {};
    const voteCounts: { [phraseId: string]: number } = {};
    
    // votesData is now { userId: phraseId } format
    Object.values(votesData).forEach((phraseId: any) => {
      if (phraseId) {
        voteCounts[phraseId] = (voteCounts[phraseId] || 0) + 1;
      }
    });
    
    callback(voteCounts);
  });
  
  return unsubscribe;
};
