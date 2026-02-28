/**
 * Client-Side Game Timer Hook
 * Handles ALL timer logic locally - no waiting for server
 */

import { useState, useEffect, useRef } from 'react';
import { ref, onValue } from 'firebase/database';
import { httpsCallable } from 'firebase/functions';
import { database, functions } from '../services/firebase';

const PHASE_DURATIONS = {
  prompt: 3,
  submission: 25,
  voting: 10,
  results: 8
};

export interface GameState {
  phase: 'prompt' | 'submission' | 'voting' | 'results';
  round: number;
  prompt: string;
  phaseStart: number;
  timeRemaining: number;
  submissions: { [userId: string]: string };
  votes: { [userId: string]: string };
  lastWinner?: string;
}

export function useGameTimer(roomId: string) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseAdvancedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!roomId) return;

    const gameRef = ref(database, `rooms/${roomId}/game`);
    
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      
      if (!data) {
        setGameState(null);
        return;
      }

      // Calculate time remaining
      const now = Date.now();
      const elapsed = (now - data.phaseStart) / 1000;
      const duration = PHASE_DURATIONS[data.phase as keyof typeof PHASE_DURATIONS] || 0;
      const remaining = Math.max(0, Math.floor(duration - elapsed));

      setGameState({
        ...data,
        timeRemaining: remaining
      });

      // Reset phase advanced flag when phase changes
      phaseAdvancedRef.current = false;
    });

    return () => unsubscribe();
  }, [roomId]);

  // Local timer - updates every 100ms
  useEffect(() => {
    if (!gameState) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setGameState(prev => {
        if (!prev) return null;

        const now = Date.now();
        const elapsed = (now - prev.phaseStart) / 1000;
        const duration = PHASE_DURATIONS[prev.phase as keyof typeof PHASE_DURATIONS] || 0;
        const remaining = Math.max(0, Math.floor(duration - elapsed));

        // If timer hit zero and we haven't advanced yet, advance phase
        if (remaining === 0 && !phaseAdvancedRef.current) {
          phaseAdvancedRef.current = true;
          advancePhase(roomId);
        }

        return { ...prev, timeRemaining: remaining };
      });
    }, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState?.phase, gameState?.phaseStart, roomId]);

  return gameState;
}

/**
 * Call server to advance phase
 * This is instant - server just updates the phase
 */
async function advancePhase(roomId: string) {
  try {
    const advanceGamePhase = httpsCallable(functions, 'advanceGamePhase');
    await advanceGamePhase({ roomId });
  } catch (error) {
    console.error('Error advancing phase:', error);
  }
}
