import { ref, set, get } from 'firebase/database';
import { realtimeDb } from './firebase';

/**
 * Game Timer Service
 * Manages countdown timers and phase transitions for active games
 */

class GameTimerService {
  private timers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Start a countdown timer for a game phase
   */
  startTimer(roomId: string, initialTime: number, onTick?: (timeLeft: number) => void) {
    // Clear any existing timer for this room
    this.stopTimer(roomId);

    const gameStateRef = ref(realtimeDb, `rooms/${roomId}/gameState`);
    let timeRemaining = initialTime;

    const intervalId = setInterval(async () => {
      timeRemaining--;

      // Update the time in Realtime Database
      try {
        const snapshot = await get(gameStateRef);
        if (snapshot.exists()) {
          const currentState = snapshot.val();
          await set(gameStateRef, {
            ...currentState,
            timeRemaining: Math.max(0, timeRemaining)
          });
        }
      } catch (error) {
        console.error('Error updating timer:', error);
      }

      // Call the tick callback if provided
      if (onTick) {
        onTick(timeRemaining);
      }

      // Stop timer after calling callback at 0
      if (timeRemaining <= 0) {
        this.stopTimer(roomId);
      }
    }, 1000);

    this.timers.set(roomId, intervalId);
  }

  /**
   * Stop the timer for a specific room
   */
  stopTimer(roomId: string) {
    const intervalId = this.timers.get(roomId);
    if (intervalId) {
      clearInterval(intervalId);
      this.timers.delete(roomId);
    }
  }

  /**
   * Stop all timers
   */
  stopAllTimers() {
    this.timers.forEach((intervalId) => clearInterval(intervalId));
    this.timers.clear();
  }

  /**
   * Transition to the next game phase
   */
  async transitionPhase(
    roomId: string,
    newPhase: string,
    duration: number,
    additionalData?: any
  ) {
    const gameStateRef = ref(realtimeDb, `rooms/${roomId}/gameState`);
    
    try {
      const snapshot = await get(gameStateRef);
      if (!snapshot.exists()) return;

      const currentState = snapshot.val();
      
      await set(gameStateRef, {
        ...currentState,
        phase: newPhase,
        timeRemaining: duration,
        ...additionalData
      });

      // Start the timer for this phase
      this.startTimer(roomId, duration);
    } catch (error) {
      console.error('Error transitioning phase:', error);
    }
  }
}

export const gameTimerService = new GameTimerService();
