import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Share,
  BackHandler,
  Platform,
  InputAccessoryView,
  Keyboard,
  KeyboardEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../contexts/SettingsContext';
import { AvatarDisplay } from '../components/avatar/AvatarDisplay';
import { leaveRoom, startGame, deleteRoom, restartGame } from '../services/database';
import { saveCurrentRoom, clearCurrentRoom } from '../services/roomPersistence';
import { gameTimerService } from '../services/gameTimer';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import {
  subscribeToGameState,
  markSubmission,
  markVote,
  subscribeToSubmissions,
  subscribeToVotes,
  setTyping,
  subscribeToTyping,
} from '../services/realtime';
import { ref, remove } from 'firebase/database';
import { realtimeDb } from '../services/firebase';
import { Room, GamePhase } from '../types';
import { ChatBox } from '../components/social/ChatBox';
import { useTheme } from '../hooks/useTheme';
import { validatePhrase } from '../utils/validation';
import { Button } from '../components/common/Button';
import { rewards, REWARD_AMOUNTS } from '../services/rewardsService';
import { incrementChallengeProgress } from '../services/challenges';
import { battlePass } from '../services/battlePassService';
import { GameEndSummary } from '../components/game/GameEndSummary';
import { StarCelebration } from '../components/game/StarCelebration';
import { VictoryCelebration } from '../components/game/VictoryCelebration';
import { SPACING, STAR_THRESHOLD } from '../utils/constants';
import { updatePlayerRating, updateMultiplayerRatings, RatingUpdate } from '../services/eloRatingService';
import { haptics } from '../services/haptics';
import { doc as firestoreDoc, setDoc } from 'firebase/firestore';

// Helper function to save match history
const saveMatchHistory = async (
  userId: string,
  matchData: {
    roomId: string;
    roomName: string;
    won: boolean;
    score: number;
    stars: number;
    totalVotes: number;
    roundsWon: number;
    playerCount: number;
    isRanked: boolean;
    bestPhrase?: string;
    xpEarned: number;
    leveledUp: boolean;
    playedAt: Date;
    prompt?: string;
  }
): Promise<void> => {
  const matchId = `${userId}_${matchData.roomId}_${Date.now()}`;
  const matchRef = firestoreDoc(firestore, 'matches', matchId);
  
  await setDoc(matchRef, {
    userId,
    ...matchData,
    createdAt: matchData.playedAt.toISOString(),
  });
};

// Helper function to advance game phase
const advancePhase = async (roomId: string) => {
  try {
    const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'wittsy-51992';
    const response = await fetch(
      `https://us-central1-${projectId}.cloudfunctions.net/advanceGamePhase`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { roomId } })
      }
    );
    await response.json();
  } catch (error) {
    console.error('Error advancing phase:', error);
  }
};
import { Loading } from '../components/common/Loading';
import Timer from '../components/game/Timer';
import PhraseCard from '../components/game/PhraseCard';
import ScoreBoard from '../components/game/ScoreBoard';
import PlayerList from '../components/game/PlayerList';
import { tabletHorizontalPadding } from '../utils/responsive';

type RootStackParamList = {
  GameRoom: { roomId: string };
};

type GameRoomScreenRouteProp = RouteProp<RootStackParamList, 'GameRoom'>;
type GameRoomScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface GameState {
  phase: GamePhase;
  timeRemaining: number;
  currentPrompt: string;
  currentRound: number;
  submissions: { [userId: string]: string };
  votes: { [userId: string]: string };
  lastWinner?: string;
  lastWinningPhrase?: string;
  lastWinners?: string[]; // Support multiple winners in case of tie
  lastWinningPhrases?: string[]; // Support multiple winning phrases
  roundVoteCounts?: { [userId: string]: number }; // Vote counts for this round
  phaseStartTime?: number;
  phaseDuration?: number;
  timeline?: any; // NEW: Complete game timeline for local calculation
}

const GameRoomScreen: React.FC = () => {
  const route = useRoute<GameRoomScreenRouteProp>();
  const navigation = useNavigation<GameRoomScreenNavigationProp>();
  const { user } = useAuth();
  const { settings } = useSettings();
  const { roomId } = route.params;
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS, SPACING), [COLORS]);
  
  // Debug logging for roomId
  console.log('🎮 GameRoomScreen loaded with roomId:', roomId);
  console.log('🎮 RoomId type:', typeof roomId);
  console.log('🎮 RoomId length:', roomId?.length);

  const [room, setRoom] = useState<Room | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStarCelebration, setShowStarCelebration] = useState(false);
  const [starCelebrationData, setStarCelebrationData] = useState<{
    username: string;
    phrase: string;
    voteCount: number;
  } | null>(null);
  const [showVictoryCelebration, setShowVictoryCelebration] = useState(false);
  const [victoryData, setVictoryData] = useState<Array<{
    userId: string;
    username: string;
    avatarConfig?: any;
    totalVotes: number;
  }> | null>(null);
  const [winStreak, setWinStreak] = useState(0);
  const [lastRoundWinner, setLastRoundWinner] = useState<string | null>(null);
  const [countdownRemaining, setCountdownRemaining] = useState<number | null>(null);
  const [phrase, setPhrase] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [voteCount, setVoteCount] = useState(0);
  const [shuffledSubmissions, setShuffledSubmissions] = useState<[string, string][]>([]);
  const [multiplayerRatingChanges, setMultiplayerRatingChanges] = useState<Record<string, RatingUpdate> | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [chatKeyboardHeight, setChatKeyboardHeight] = useState(0);
  const [showGameEndSummary, setShowGameEndSummary] = useState(false);
  const [gameEndRewards, setGameEndRewards] = useState<{
    coins: number;
    xp: number;
    battlePassXP: number;
    battlePassLevelUp: boolean;
    newBattlePassLevel?: number;
  } | null>(null);
  const [ratingChanges, setRatingChanges] = useState<{
    winner: RatingUpdate;
    loser: RatingUpdate;
  } | null>(null);
  const [finalScores, setFinalScores] = useState<{ userId: string; username: string; score: number }[]>([]);
  const gameEndProcessedRef = useRef(false);
  
  // Track previous phase to detect actual phase changes
  const previousPhaseRef = useRef<string | null>(null);
  
  // Store unsubscribe functions to clean up before leaving
  const roomUnsubscribeRef = useRef<(() => void) | null>(null);
  const gameStateUnsubscribeRef = useRef<(() => void) | null>(null);

  // Handle game end and show summary
  useEffect(() => {
    if (room?.status === 'finished' && !gameState && !gameEndProcessedRef.current && user) {
      gameEndProcessedRef.current = true;
      handleGameEnd();
    }
  }, [room?.status, gameState, user]);

  const handleGameEnd = async () => {
    if (!room || !user) return;

    try {
      console.log('🎮 Game ended, processing rewards...');

      // Grant participation rewards to current user
      await rewards.grantParticipationRewards(user.uid);

      // Get Battle Pass level up info
      const battlePassResult = await battlePass.addXP(
        user.uid,
        REWARD_AMOUNTS.GAME_PARTICIPATION_XP,
        'game_end'
      );

      // Prepare final scores with phrase data
      const scores = room.players.map((player) => {
        const playerScore = room.scores?.[player.userId];
        const totalVotes = typeof playerScore === 'object' ? (playerScore.totalVotes || 0) : 0;
        const phrases = typeof playerScore === 'object' ? (playerScore.phrases || []) : [];
        
        // Find best phrase (highest votes)
        let bestPhrase = '';
        let maxVotes = 0;
        for (const phrase of phrases) {
          if (phrase.votes > maxVotes) {
            maxVotes = phrase.votes;
            bestPhrase = phrase.text;
          }
        }
        
        return {
          userId: player.userId,
          username: player.username,
          score: totalVotes,
          bestPhrase,
          phrases,
        };
      });

      // Sort by score to determine winner and loser
      const sortedScores = [...scores].sort((a, b) => b.score - a.score);
      
      // Update ELO ratings for ALL players in ranked games
      if (room.isRanked && sortedScores.length >= 2) {
        try {
          // Build vote data for margin of victory calculation
          const voteData: Record<string, number> = {};
          for (const s of sortedScores) {
            voteData[s.userId] = s.score;
          }

          if (sortedScores.length === 2) {
            // 1v1: use dedicated 1v1 function with full margin of victory
            const winnerId = sortedScores[0].userId;
            const loserId = sortedScores[1].userId;
            const totalVotes = sortedScores[0].score + sortedScores[1].score;
            
            console.log('📊 Updating 1v1 ELO ratings:', { winnerId, loserId });
            const ratingUpdate = await updatePlayerRating(winnerId, loserId, true, {
              winnerVotes: sortedScores[0].score,
              secondPlaceVotes: sortedScores[1].score,
              totalVotes,
            });
            setRatingChanges(ratingUpdate);
            
            console.log('✅ 1v1 ELO ratings updated:', {
              winner: `${ratingUpdate.winner.oldRating} → ${ratingUpdate.winner.newRating} (${ratingUpdate.winner.ratingChange > 0 ? '+' : ''}${ratingUpdate.winner.ratingChange})`,
              loser: `${ratingUpdate.loser.oldRating} → ${ratingUpdate.loser.newRating} (${ratingUpdate.loser.ratingChange > 0 ? '+' : ''}${ratingUpdate.loser.ratingChange})`
            });
          } else {
            // 3+ players: use multiplayer pairwise comparison system
            const playerIds = sortedScores.map(s => s.userId);
            const finalScoreMap: Record<string, number> = {};
            for (const s of sortedScores) {
              finalScoreMap[s.userId] = s.score;
            }
            
            console.log('📊 Updating multiplayer ELO ratings for', playerIds.length, 'players');
            const multiUpdates = await updateMultiplayerRatings(
              playerIds,
              finalScoreMap,
              true,
              voteData
            );
            setMultiplayerRatingChanges(multiUpdates);
            
            console.log('✅ Multiplayer ELO ratings updated for', Object.keys(multiUpdates).length, 'players');
          }
        } catch (error) {
          console.error('Failed to update ELO ratings:', error);
        }
      }

      // Save match history for all players (for starred phrases)
      const winnerId = sortedScores[0]?.userId;
      
      // Grant game win XP to the winner
      if (winnerId) {
        await rewards.grantGameWinRewards(winnerId);
      }
      
      for (const player of scores) {
        try {
          const playerScore = room.scores?.[player.userId];
          const stars = typeof playerScore === 'object' ? (playerScore.stars || 0) : 0;
          const roundWins = typeof playerScore === 'object' ? (playerScore.roundWins || 0) : 0;
          
          // Save to matches collection
          await saveMatchHistory(player.userId, {
            roomId: room.roomId,
            roomName: room.name,
            won: player.userId === winnerId,
            score: player.score,
            stars,
            totalVotes: player.score,
            roundsWon: roundWins,
            playerCount: room.players.length,
            isRanked: room.isRanked || false,
            bestPhrase: player.bestPhrase,
            xpEarned: 0,
            leveledUp: false,
            playedAt: new Date(),
            prompt: typeof room.currentPrompt === 'string' ? room.currentPrompt : room.currentPrompt?.text,
          });
        } catch (error) {
          console.error(`Failed to save match history for ${player.userId}:`, error);
        }
      }

      setFinalScores(scores);
      setGameEndRewards({
        coins: REWARD_AMOUNTS.GAME_PARTICIPATION,
        xp: 0,
        battlePassXP: REWARD_AMOUNTS.GAME_PARTICIPATION_XP,
        battlePassLevelUp: battlePassResult.leveledUp,
        newBattlePassLevel: battlePassResult.newLevel,
      });
      
      // Show vibrant victory celebration for winner(s)
      const topScore = sortedScores[0]?.score || 0;
      const winners = sortedScores.filter(s => s.score === topScore).map(s => ({
        userId: s.userId,
        username: room.players.find(p => p.userId === s.userId)?.username || 'Unknown',
        avatarConfig: room.players.find(p => p.userId === s.userId)?.avatarConfig,
        totalVotes: s.score,
      }));
      
      setVictoryData(winners);
      setShowVictoryCelebration(true);

      console.log('✅ Game end rewards processed');
    } catch (error) {
      console.error('Failed to process game end:', error);
    }
  };

  const handleGameEndContinue = async () => {
    setShowGameEndSummary(false);
    gameEndProcessedRef.current = false;
    
    // Leave room and go back
    if (user?.uid && room) {
      try {
        await leaveRoom(roomId, user.uid);
        clearCurrentRoom();
        navigation.goBack();
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    }
  };
  
  const handleGameRestart = async () => {
    setShowGameEndSummary(false);
    gameEndProcessedRef.current = false;
    
    try {
      await restartGame(roomId);
      console.log('🔄 Game restarted, waiting for host to start');
    } catch (error) {
      console.error('Error restarting game:', error);
      Alert.alert('Error', 'Failed to restart game');
    }
  };

  // Subscribe to room data updates (Firestore)
  useEffect(() => {
    if (!roomId) return;

    const roomRef = doc(firestore, 'rooms', roomId);
    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      // Check if we're intentionally leaving
      if (!roomUnsubscribeRef.current) return;
      if (snapshot.exists()) {
        const roomData = snapshot.data() as Room;
        console.log('🔄 Room updated:', {
          roomId,
          status: roomData.status,
          gameState: roomData.gameState,
          playerCount: roomData.players?.length || 0,
          players: roomData.players?.map(p => p.username) || [],
          currentUserId: user?.uid,
          isCurrentUserInRoom: roomData.players?.some(p => p.userId === user?.uid)
        });
        setRoom(roomData);
        setLoading(false);
      } else {
        Alert.alert('Error', 'Room not found', [
          {
            text: 'OK',
            onPress: () => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('Home' as never);
              }
            }
          }
        ]);
      }
    }, (error) => {
      console.error('Error loading room:', error);
      Alert.alert('Error', 'Failed to load room', [
        {
          text: 'OK',
          onPress: () => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Home' as never);
            }
          }
        }
      ]);
    });

    roomUnsubscribeRef.current = unsubscribe;
    return () => {
      roomUnsubscribeRef.current = null;
      unsubscribe();
    };
  }, [roomId]);

  // Countdown timer for auto-start
  useEffect(() => {
    if (!room?.countdownStartedAt || !room?.countdownDuration) {
      setCountdownRemaining(null);
      return;
    }
    
    const interval = setInterval(() => {
      if (!room?.countdownStartedAt || !room?.countdownDuration) return;
      
      const startTime = new Date(room.countdownStartedAt).getTime();
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = room.countdownDuration - elapsed;
      
      if (remaining <= 0) {
        setCountdownRemaining(0);
        clearInterval(interval);
        // Auto-start game when countdown reaches 0
        if (room.isRanked && room.status === 'waiting') {
          handleStartGame();
        }
      } else {
        setCountdownRemaining(Math.ceil(remaining));
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [room?.countdownStartedAt, room?.countdownDuration, room?.status, room?.isRanked]);

  // Subscribe to game state updates
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = subscribeToGameState(roomId, (state) => {
      console.log('🎮 Game state update received:', state);
      if (state) {
        const previousPhase = previousPhaseRef.current;
        console.log(`📍 Phase: ${state.phase}, Prompt: ${state.currentPrompt}, Round: ${state.currentRound}`);
        
        // Calculate timeRemaining from phaseStartTime and phaseDuration
        if (state.phaseStartTime && state.phaseDuration) {
          const elapsed = (Date.now() - state.phaseStartTime) / 1000;
          state.timeRemaining = Math.max(0, Math.floor(state.phaseDuration - elapsed));
        }
        
        // Reset phase-specific state when phase actually changes
        if (state.phase === 'submission' && previousPhase !== 'submission') {
          // Only reset when entering submission phase from a different phase
          console.log('🔄 Entering submission phase');
          // Check if user has already submitted in this round
          const userAlreadySubmitted = state.submissions && user?.uid && state.submissions[user.uid];
          setHasSubmitted(!!userAlreadySubmitted);
          if (userAlreadySubmitted) {
            setPhrase(state.submissions[user.uid]);
          } else {
            setPhrase('');
          }
          setHasVoted(false);
        } else if (state.phase === 'voting' && previousPhase !== 'voting') {
          console.log('🔄 Entering voting phase');
          setHasVoted(false);
        } else if (state.phase === 'results' && previousPhase !== 'results') {
          console.log('🏆 Entering results phase - calculating winner');
          
          // Track win streaks for engagement
          if (state.lastWinners && state.lastWinners.length > 0 && user?.uid) {
            const currentWinner = state.lastWinners[0];
            if (currentWinner === user.uid) {
              if (lastRoundWinner === user.uid) {
                setWinStreak(prev => prev + 1);
                if (winStreak + 1 >= 2) {
                  haptics.success();
                  console.log(`🔥 WIN STREAK: ${winStreak + 1}!`);
                }
              } else {
                setWinStreak(1);
              }
              setLastRoundWinner(user.uid);
            } else {
              if (lastRoundWinner === user.uid) {
                setWinStreak(0);
              }
              setLastRoundWinner(currentWinner);
            }
          }
          
          if (!state.lastWinner && state.votes && state.submissions) {
            const voteCounts: { [userId: string]: number } = {};
            Object.values(state.votes).forEach((votedUserId: any) => {
              if (votedUserId) voteCounts[votedUserId] = (voteCounts[votedUserId] || 0) + 1;
            });
            let maxVotes = 0;
            let winnerId: string | null = null;
            Object.entries(voteCounts).forEach(([userId, count]) => {
              if (count > maxVotes) { maxVotes = count; winnerId = userId; }
            });
            if (winnerId && state.submissions[winnerId]) {
              state.lastWinner = winnerId;
              state.lastWinningPhrase = state.submissions[winnerId];
              console.log('🏆 Winner:', winnerId, 'Phrase:', state.lastWinningPhrase, 'Votes:', maxVotes);
              
              // Check if winner earned a star (4+ votes)
              if (maxVotes >= STAR_THRESHOLD) {
                const winnerPlayer = room?.players.find(p => p.userId === winnerId);
                if (winnerPlayer) {
                  console.log('⭐ Star earned!', winnerPlayer.username, 'with', maxVotes, 'votes');
                  setStarCelebrationData({
                    username: winnerPlayer.username,
                    phrase: state.submissions[winnerId],
                    voteCount: maxVotes,
                  });
                  setShowStarCelebration(true);
                }
              }
              
              // Grant rewards to winner
              rewards.grantRoundWinRewards(winnerId, maxVotes).catch(err => 
                console.error('Failed to grant rewards:', err)
              );
              
              // Update challenge progress for round win
              incrementChallengeProgress(winnerId, 'round_won', 1).catch(err =>
                console.error('Failed to update challenge progress:', err)
              );
              
              // Update challenge progress for votes received
              incrementChallengeProgress(winnerId, 'votes_received', maxVotes).catch(err =>
                console.error('Failed to update vote challenge progress:', err)
              );
            }
          }
        }
        
        // Update the ref and state
        previousPhaseRef.current = state.phase;
        setGameState(state as GameState);
      } else {
        console.log('⚠️ Game state is null');
      }
    });

    gameStateUnsubscribeRef.current = unsubscribe;
    return () => {
      gameStateUnsubscribeRef.current = null;
      unsubscribe();
    };
  }, [roomId]);
  
  // Client-side timer - calculate from phaseStartTime and phaseDuration
  useEffect(() => {
    if (!gameState?.phaseStartTime || !gameState?.phaseDuration) return;
    
    let hasAdvanced = false;
    
    const interval = setInterval(() => {
      setGameState(prev => {
        if (!prev?.phaseStartTime || !prev?.phaseDuration) return prev;
        const elapsed = (Date.now() - prev.phaseStartTime) / 1000;
        const remaining = Math.max(0, Math.floor(prev.phaseDuration - elapsed));
        
        // Auto-submit if enabled and time runs out
        if (remaining === 0 && !hasAdvanced && gameState.phase === 'submission') {
          if (settings.gameplay.autoSubmit && phrase.trim() && !hasSubmitted && user?.uid) {
            console.log('⚡ Auto-submitting phrase due to timeout');
            markSubmission(roomId, user.uid, phrase.trim());
            setHasSubmitted(true);
          }
        }
        
        // Advance phase when timer hits 0 — including 'insufficient' phase.
        // Do NOT rely on server-side setTimeout (Cloud Function containers can be killed).
        // The 'insufficient' case in gameEngine calls startNewRound directly.
        if (remaining === 0 && !hasAdvanced) {
          hasAdvanced = true;
          advancePhase(roomId);
        }
        
        return { ...prev, timeRemaining: remaining };
      });
    }, 100); // Update every 100ms for smooth countdown
    
    return () => clearInterval(interval);
  }, [gameState?.phaseStartTime, gameState?.phaseDuration, roomId]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!roomId || gameState?.phase !== 'submission') return;

    const unsubscribe = subscribeToTyping(roomId, (typingData) => {
      const typing = Object.entries(typingData)
        .filter(([userId, isTyping]) => userId !== user?.uid && isTyping)
        .map(([userId]) => userId);
      setTypingUsers(typing);
    });

    return () => unsubscribe();
  }, [roomId, gameState?.phase, user?.uid]);

  // Shuffle submissions once when entering voting phase
  useEffect(() => {
    if (gameState?.phase === 'voting') {
      // CRITICAL: Use validSubmissions (server-filtered, excludes late entries).
      // Fall back to submissions only if validSubmissions not yet available.
      const submissionsToUse = (gameState as any)?.validSubmissions || gameState?.submissions || {};
      // EXPLICIT: Always filter out the current user to prevent self-voting
      const currentUserId = user?.uid;
      const entries = Object.entries(submissionsToUse)
        .filter(([userId]) => {
          if (!userId || userId === currentUserId) return false; // Never show own phrase
          return true;
        })
        .map(([userId, submission]) => {
          // Handle both string and {phrase, timestamp} object formats
          const phraseText = typeof submission === 'object' && submission && 'phrase' in submission
            ? (submission as any).phrase
            : submission;
          return [userId, phraseText as string] as [string, string];
        })
        .filter(([, phraseText]) => phraseText && phraseText.trim().length > 0); // Exclude empty phrases
      // Fisher-Yates shuffle for unbiased randomization
      for (let i = entries.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [entries[i], entries[j]] = [entries[j], entries[i]];
      }
      console.log('🗳️ Voting phase - available phrases:', entries.length, 'own submission excluded:', currentUserId);
      setShuffledSubmissions(entries);
    }
  }, [gameState?.phase, user?.uid]);

  // Subscribe to submission count
  useEffect(() => {
    if (!roomId || gameState?.phase !== 'submission') return;

    const unsubscribe = subscribeToSubmissions(roomId, (count) => {
      setSubmissionCount(count);
    });

    return () => unsubscribe();
  }, [roomId, gameState?.phase]);

  // Subscribe to vote count
  useEffect(() => {
    if (!roomId || gameState?.phase !== 'voting') return;

    const unsubscribe = subscribeToVotes(roomId, (votes) => {
      // votes is { phraseId: voteCount }, we need total number of voters
      // Sum up all vote counts to get total voters
      const totalVoters = Object.values(votes).reduce((sum, count) => sum + count, 0);
      setVoteCount(totalVoters);
    });

    return () => unsubscribe();
  }, [roomId, gameState?.phase]);

  // Handle typing indicator
  const handlePhraseChange = (text: string) => {
    setPhrase(text);
    
    if (settings.gameplay.showTypingIndicators && text.length > 0 && gameState?.phase === 'submission' && user?.uid) {
      setTyping(roomId, user.uid, true);
    }
  };

  
  // Handle phrase submission - one-time only
  const handleSubmit = async () => {
    if (!user?.uid || !phrase.trim()) {
      Alert.alert('Error', 'Please enter a phrase');
      return;
    }

    const error = validatePhrase(phrase);
    if (error) {
      Alert.alert('Error', error);
      return;
    }

    try {
      await markSubmission(roomId, user.uid, phrase.trim());
      setHasSubmitted(true);
      setTyping(roomId, user.uid, false);
      // Keep phrase visible so user can update before time's up
    } catch (error) {
      console.error('Error submitting phrase:', error);
      Alert.alert('Error', 'Failed to submit phrase');
    }
  };


  // Handle vote - allow changing vote by clicking different phrase
  const handleVote = async (phraseId: string) => {
    if (!user?.uid) return;

    // Prevent voting for own phrase
    if (phraseId === user.uid) {
      Alert.alert('Error', 'You cannot vote for your own phrase');
      return;
    }

    // Check if user is changing their vote
    const currentVote = gameState?.votes?.[user.uid];
    if (currentVote === phraseId) {
      // Clicking same phrase - deselect vote
      Alert.alert(
        'Remove Vote?',
        'Do you want to remove your vote?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                // Remove vote from RTDB
                const voteRef = ref(realtimeDb, `rooms/${roomId}/game/votes/${user.uid}`);
                await remove(voteRef);
                setHasVoted(false);
              } catch (error) {
                console.error('Error removing vote:', error);
              }
            }
          }
        ]
      );
      return;
    }

    try {
      await markVote(roomId, user.uid, phraseId);
      setHasVoted(true);
      
      if (currentVote && currentVote !== phraseId) {
        console.log(`🔄 Changed vote from ${currentVote} to ${phraseId}`);
      }
    } catch (error) {
      console.error('Error voting:', error);
      Alert.alert('Error', 'Failed to cast vote');
    }
  };

  // Handle start game (host or auto-start)
  const handleStartGame = async () => {
    if (!room) return;
    
    // Ranked games can only auto-start (no manual start)
    // Casual games require host to manually start
    if (!room.isRanked && room.hostId !== user?.uid) return;

    // Both casual and ranked games require 3 players
    const minPlayers = 3;
    if (room.players.length < minPlayers) {
      Alert.alert('Error', `Need at least ${minPlayers} players to start`);
      return;
    }

    try {
      await startGame(roomId);
    } catch (error) {
      console.error('Error starting game:', error);
      Alert.alert('Error', 'Failed to start game');
    }
  };

  // Actually perform the leave
  const performLeaveRoom = async () => {
    if (!user?.uid) return;

    try {
      // Unsubscribe from listeners first to prevent "Room not found" alert
      if (roomUnsubscribeRef.current) {
        roomUnsubscribeRef.current();
        roomUnsubscribeRef.current = null;
      }
      if (gameStateUnsubscribeRef.current) {
        gameStateUnsubscribeRef.current();
        gameStateUnsubscribeRef.current = null;
      }
      
      // Stop the timer for this room
      gameTimerService.stopTimer(roomId);
      await leaveRoom(roomId, user.uid);
      await clearCurrentRoom();
      navigation.goBack();
    } catch (error) {
      console.error('Error leaving room:', error);
      Alert.alert('Error', 'Failed to leave room');
    }
  };

  // Handle delete room (host only)
  const handleDeleteRoom = () => {
    if (!user?.uid || room?.hostId !== user.uid) return;

    Alert.alert(
      'Delete Room?',
      'This will immediately delete the room and kick all players. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              // Unsubscribe from room and game state before deleting
              if (roomUnsubscribeRef.current) {
                roomUnsubscribeRef.current();
                roomUnsubscribeRef.current = null;
              }
              if (gameStateUnsubscribeRef.current) {
                gameStateUnsubscribeRef.current();
                gameStateUnsubscribeRef.current = null;
              }
              
              // Stop the timer
              gameTimerService.stopTimer(roomId);
              
              // Clear persistence and navigate immediately
              await clearCurrentRoom();
              navigation.goBack();
              
              // Delete room after navigation to avoid "room not found" error
              await deleteRoom(roomId);
            } catch (error) {
              console.error('Error deleting room:', error);
              // Don't show error alert since we've already navigated away
            }
          }
        },
      ]
    );
  };

  // Handle invite players
  const handleInvitePlayers = async () => {
    if (!room || !roomId) {
      console.error('❌ Cannot share: room or roomId is missing');
      Alert.alert('Error', 'Unable to share room. Please try again.');
      return;
    }

    try {
      // Use 6-digit room code for manual entry
      const roomCode = room.roomCode;
      if (!roomCode) {
        console.error('❌ Cannot share: room code is missing');
        Alert.alert('Error', 'Room code not available. Please try again.');
        return;
      }

      const inviteUrl = `https://wittz.app/game/${roomId}?code=${roomCode}`;
      const shareMessage = Platform.OS === 'ios' 
        ? `🎮 Join my Wittz game!\n\nRoom Code: ${roomCode}\n\n${inviteUrl}`
        : `🎮 Join my Wittz game room!\n\nTap to join: ${inviteUrl}\n\nOr use room code: ${roomCode}`;
      
      console.log('📤 ========== SHARE DEBUG ==========');
      console.log('📤 Room ID:', roomId);
      console.log('📤 Room code:', roomCode);
      console.log('📤 Share URL:', inviteUrl);
      console.log('📤 ==================================');
      
      const shareOptions = Platform.OS === 'ios'
        ? { message: shareMessage, url: inviteUrl }
        : { message: shareMessage };

      const result = await Share.share(shareOptions);
      
      if (result.action === Share.sharedAction) {
        console.log('✅ Share successful');
      } else if (result.action === Share.dismissedAction) {
        console.log('ℹ️ Share dismissed');
      }
    } catch (error: any) {
      console.error('❌ Error sharing invite:', error);
      // Only show alert if it's not a user cancellation
      if (error?.message && !error.message.includes('cancel')) {
        Alert.alert('Share Failed', 'Unable to share the game room. Please try again.');
      }
    }
  };

  // Handle leave room - confirm if active ranked game
  const handleLeaveRoom = () => {
    if (!user?.uid) return;

    if (room?.isRanked && room?.status === 'active') {
      Alert.alert(
        'Leave Ranked Game?',
        'Leaving an active ranked game may affect your rating. Are you sure you want to leave?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Leave', style: 'destructive', onPress: performLeaveRoom },
        ]
      );
    } else {
      performLeaveRoom();
    }
  };
  
  // Track keyboard height so the chat box floats above the keyboard when expanded
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e: KeyboardEvent) => {
      setChatKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setChatKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Save current room on mount
  useEffect(() => {
    if (user?.uid && room?.name) {
      saveCurrentRoom(roomId, user.uid, room.name);
    }
    
    return () => {
      // Only stop timer on unmount - do NOT auto-leave room
      // Room leaving should only happen on explicit user actions (back button, leave button)
      gameTimerService.stopTimer(roomId);
    };
  }, [roomId, user?.uid, room?.name]);

  // Handle hardware back button - leave room before going back
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleLeaveRoom();
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, [roomId, user?.uid]);

  // Render phase-specific content
  // Helper to safely get prompt text (handles both string and object)
  const getPromptText = (prompt: any): string => {
    if (typeof prompt === 'string') return prompt;
    if (prompt && typeof prompt === 'object' && prompt.text) return prompt.text;
    return 'Loading prompt...';
  };

  const renderPhaseContent = () => {
    // Show loading state if game is active but no game state yet
    if (room?.status === 'active' && !gameState) {
      return (
        <View style={styles.loadingPhase}>
          <Text style={styles.loadingEmoji}>🎮</Text>
          <Text style={styles.loadingText}>Starting Game...</Text>
          <Text style={styles.loadingSubtext}>Get ready! Your prompt is loading</Text>
          <View style={styles.loadingDotsContainer}>
            <Text style={styles.loadingDots}>●●●</Text>
          </View>
        </View>
      );
    }
    
    if (!gameState) return null;
    
    const promptText = getPromptText(gameState.currentPrompt);

    switch (gameState.phase) {
      case 'prompt':
        return (
          <View style={styles.promptPhase}>
            <View style={styles.phaseTitleContainer}>
              <Text style={styles.phaseTitle}>GET READY!</Text>
              <Text style={styles.roundBadge}>Round {gameState.currentRound}</Text>
            </View>
            <View style={styles.promptDisplayContainer}>
              <Text style={styles.promptDisplayLabel}>YOUR PROMPT</Text>
              <Text style={styles.promptDisplayText}>{promptText}</Text>
            </View>
            <Text style={styles.phaseSubtitle}>Prepare your wittiest response!</Text>
          </View>
        );

      case 'submission':
        const inputAccessoryViewID = 'submitButtonAccessory';

        return (
          <View style={styles.submissionPhase}>
            {/* Prompt is OUTSIDE the ScrollView so it is always fully visible
                and never competes with the keyboard or input for space */}
            <View style={styles.promptContainerCompact}>
              <Text style={styles.promptLabelCompact}>PROMPT</Text>
              <Text style={styles.promptTextCompact}>{promptText}</Text>
            </View>

            <ScrollView
              style={styles.submissionScrollView}
              contentContainerStyle={styles.submissionScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Enhanced Progress indicator with visual bar */}
              <View style={styles.submissionInfoCompact}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTextCompact}>
                    {submissionCount}/{room?.players.length || 0} submitted
                  </Text>
                  {settings.gameplay.showTypingIndicators && typingUsers.length > 0 && (
                    <Text style={styles.typingTextCompact}>
                      {typingUsers.length} typing...
                    </Text>
                  )}
                </View>

                {/* Animated progress bar */}
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${(submissionCount / (room?.players.length || 1)) * 100}%`,
                        backgroundColor: submissionCount === room?.players.length ? '#4CAF50' : COLORS.primary
                      }
                    ]}
                  />
                </View>

                {/* Show mini avatars of who submitted */}
                {submissionCount > 0 && (
                  <View style={styles.submittedPlayersRow}>
                    <Text style={styles.submittedLabel}>Submitted:</Text>
                    <View style={styles.miniAvatarsRow}>
                      {room?.players
                        .filter(p => gameState.submissions?.[p.userId])
                        .slice(0, 5)
                        .map(p => (
                          <View key={p.userId} style={styles.miniAvatarContainer}>
                            {p.avatarConfig && (
                              <AvatarDisplay config={p.avatarConfig} size={24} />
                            )}
                          </View>
                        ))}
                      {submissionCount > 5 && (
                        <Text style={styles.moreCount}>+{submissionCount - 5}</Text>
                      )}
                    </View>
                  </View>
                )}
              </View>

              {hasSubmitted ? (
                /* After submitting: show phrase read-only, waiting for others */
                <View style={styles.submittedPhrasePreview}>
                  <Text style={styles.submittedBadgeText}>✓ Submitted — waiting for others</Text>
                  <Text style={styles.previewText}>"{phrase}"</Text>
                </View>
              ) : (
                /* Input area — only shown before submitting */
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.phraseInput}
                    placeholder="Type your witty response here..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={phrase}
                    onChangeText={handlePhraseChange}
                    onSubmitEditing={() => {
                      if (phrase.trim()) {
                        handleSubmit();
                      }
                    }}
                    multiline
                    maxLength={200}
                    autoFocus
                    returnKeyType="done"
                    blurOnSubmit={true}
                    enablesReturnKeyAutomatically={true}
                    inputAccessoryViewID={Platform.OS === 'ios' ? inputAccessoryViewID : undefined}
                  />
                  <View style={styles.charCountContainer}>
                    <Text style={[
                      styles.charCount,
                      phrase.length > 180 && styles.charCountWarning,
                      phrase.length === 200 && styles.charCountMax
                    ]}>
                      {phrase.length}/200
                    </Text>
                  </View>

                  {/* Android button - shown in scroll view */}
                  {Platform.OS === 'android' && (
                    <View style={styles.androidButtonContainer}>
                      <Button
                        title="SUBMIT PHRASE"
                        onPress={handleSubmit}
                        disabled={!phrase.trim()}
                        size="lg"
                        style={styles.submitButton}
                      />
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            {/* iOS InputAccessoryView - only shown before submitting */}
            {Platform.OS === 'ios' && !hasSubmitted && (
              <InputAccessoryView nativeID={inputAccessoryViewID}>
                <View style={styles.inputAccessoryContainer}>
                  <Button
                    title="SUBMIT"
                    onPress={handleSubmit}
                    disabled={!phrase.trim()}
                    size="lg"
                    style={styles.submitButton}
                  />
                </View>
              </InputAccessoryView>
            )}
          </View>
        );

      case 'insufficient':
        return (
          <View style={styles.waitingPhase}>
            <Text style={styles.phaseTitle}>⚠️ NOT ENOUGH SUBMISSIONS</Text>
            <Text style={styles.waitingText}>Need at least 3 submissions to vote</Text>
            <Text style={styles.waitingSubtext}>Starting new round...</Text>
          </View>
        );

      case 'waiting':
        return (
          <View style={styles.waitingPhase}>
            <Text style={styles.phaseTitle}>SHUFFLING PHRASES...</Text>
            <Text style={styles.waitingText}>Get ready to vote!</Text>
          </View>
        );

      case 'voting':
        const votingSubmissions = (gameState as any)?.validSubmissions || gameState.submissions || {};
        console.log('🗳️ VOTING PHASE - Valid submissions:', votingSubmissions, 'Count:', Object.keys(votingSubmissions).length);
        return (
          <View style={styles.votingPhase}>
            <View style={styles.votingHeader}>
              <Text style={styles.phaseTitle}>VOTE FOR THE BEST!</Text>
              <Text style={styles.promptText}>{promptText}</Text>
            </View>
            
            {/* Enhanced vote progress */}
            <View style={styles.voteInfo}>
              <View style={styles.voteProgressHeader}>
                <Text style={styles.infoText}>
                  {voteCount}/{room?.players.length || 0} voted
                </Text>
                {hasVoted && (
                  <Text style={styles.votedText}>✓ Vote cast!</Text>
                )}
              </View>
              
              {/* Vote progress bar */}
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBarFill,
                    { 
                      width: `${(voteCount / (room?.players.length || 1)) * 100}%`,
                      backgroundColor: voteCount === room?.players.length ? '#4CAF50' : '#FF6B6B'
                    }
                  ]} 
                />
              </View>
              
              {/* Pressure text when waiting */}
              {!hasVoted && voteCount > 0 && (
                <Text style={styles.pressureText}>
                  ⏰ {room?.players.length! - voteCount} {room?.players.length! - voteCount === 1 ? 'player' : 'players'} waiting for you!
                </Text>
              )}
            </View>

            <ScrollView style={styles.phrasesList} showsVerticalScrollIndicator={false}>
              {shuffledSubmissions
                .map(([userId, phraseText], index) => (
                <PhraseCard
                  key={userId}
                  number={index + 1}
                  phrase={phraseText}
                  onPress={() => handleVote(userId)}
                  disabled={userId === user?.uid}
                  isOwnPhrase={userId === user?.uid}
                  hasVoted={gameState.votes?.[user?.uid || ''] === userId}
                />
              ))}
            </ScrollView>
          </View>
        );

      case 'results':
        console.log('🏆 RESULTS PHASE - Winners:', gameState.lastWinners || [gameState.lastWinner]);
        const winners = gameState.lastWinners || (gameState.lastWinner ? [gameState.lastWinner] : []);
        const winningPhrases = gameState.lastWinningPhrases || (gameState.lastWinningPhrase ? [gameState.lastWinningPhrase] : []);
        const isTie = winners.length > 1;
        
        return (
          <View style={styles.resultsPhase}>
            {/* Show win streak badge if user is on a streak */}
            {winStreak >= 2 && winners.includes(user?.uid || '') && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakEmoji}>🔥</Text>
                <Text style={styles.streakText}>{winStreak}x WIN STREAK!</Text>
              </View>
            )}
            
            <Text style={styles.phaseTitle}>{isTie ? 'TIE!' : 'WINNER!'}</Text>
            
            {/* Show all winner avatars in case of tie */}
            <View style={styles.winnersAvatarRow}>
              {winners.map((winnerId) => {
                const winnerPlayer = room?.players.find(p => p.userId === winnerId);
                return winnerPlayer?.avatarConfig ? (
                  <View key={winnerId} style={styles.winnerAvatarContainer}>
                    <AvatarDisplay config={winnerPlayer.avatarConfig} size={isTie ? 120 : 200} />
                    <Text style={styles.winnerNameBelowAvatar}>{winnerPlayer.username}</Text>
                  </View>
                ) : null;
              })}
            </View>
            
            {/* Show winning phrase(s) */}
            {winningPhrases.map((phrase, index) => {
              const winnerId = winners[index];
              const winnerPlayer = room?.players.find(p => p.userId === winnerId);
              const voteCount = gameState.roundVoteCounts?.[winnerId] || 
                               Object.values(gameState.votes || {}).filter(v => v === winnerId).length;
              
              return (
                <View key={winnerId} style={styles.winnerCard}>
                  <Text style={styles.winningPhrase}>"{phrase}"</Text>
                  <Text style={styles.winnerName}>
                    by {winnerPlayer?.username || 'Unknown'}
                  </Text>
                  <Text style={styles.voteCountText}>
                    {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                  </Text>
                </View>
              );
            })}

            {/* Show all phrases with vote counts — use validSubmissions to exclude late entries */}
            <ScrollView style={styles.allPhrasesList}>
              {Object.entries((gameState as any).validSubmissions || gameState.submissions || {})
                .map(([userId, submission]) => {
                  // Handle both string and {phrase, timestamp} object formats
                  const phraseText = typeof submission === 'object' && submission && 'phrase' in submission
                    ? (submission as any).phrase
                    : submission as string;
                  const votes = Object.values(gameState.votes || {}).filter(v => v === userId).length;
                  const player = room?.players.find(p => p.userId === userId);
                  return { userId, phraseText, votes, username: player?.username || 'Unknown' };
                })
                .sort((a, b) => b.votes - a.votes)
                .map(({ userId, phraseText, votes, username }) => (
                  <View key={userId} style={[
                    styles.resultCard,
                    votes >= STAR_THRESHOLD && styles.starredResultCard
                  ]}>
                    <Text style={styles.resultPhrase}>"{phraseText}"</Text>
                    <Text style={styles.resultAuthor}>by {username}</Text>
                    <View style={styles.resultVotesContainer}>
                      <Text style={styles.resultVotes}>
                        {votes} {votes === 1 ? 'vote' : 'votes'}
                      </Text>
                      {votes >= STAR_THRESHOLD && (
                        <View style={styles.starBadge}>
                          <Text style={styles.starBadgeText}>STARRED</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
            </ScrollView>
          </View>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!room) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Room not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.roomName}>{room.name}</Text>
          <Text style={styles.roomCode}>Room ID: {room.roomCode}</Text>
        </View>
        
        {gameState && settings.gameplay.showTimer && (
          <View style={styles.timerContainer}>
            <Timer
              timeRemaining={gameState.timeRemaining}
              phase={gameState.phase}
            />
          </View>
        )}
        
        <View style={styles.headerActions}>
          {room.hostId === user?.uid && !room.isRanked && (
            <TouchableOpacity onPress={handleDeleteRoom} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleLeaveRoom} style={styles.leaveButton}>
            <Text style={styles.leaveButtonText}>Leave</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* In-game scoreboard - shows during active game */}
      {room.status === 'active' && room.scores && (
        <View style={styles.inGameScoreboard}>
          <Text style={styles.scoreboardTitle}>SCORES</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scoresList}>
            {Object.entries(room.scores)
              .sort(([, a], [, b]) => {
                const scoreA = typeof a === 'object' ? (a.totalVotes || 0) : 0;
                const scoreB = typeof b === 'object' ? (b.totalVotes || 0) : 0;
                return scoreB - scoreA;
              })
              .slice(0, 5)
              .map(([userId, score]) => {
                const player = room.players.find(p => p.userId === userId);
                const displayScore = typeof score === 'object' ? (score.totalVotes || 0) : 0;
                return (
                  <View key={userId} style={styles.scoreItem}>
                    <Text style={styles.playerName} numberOfLines={1}>
                      {player?.username || 'Unknown'}
                    </Text>
                    <Text style={styles.playerScore}>{displayScore} votes</Text>
                  </View>
                );
              })}
          </ScrollView>
        </View>
      )}

      {/* Main content area */}
      <View style={styles.mainContent}>
        {/* Waiting lobby (before game starts) */}
        {!gameState && room.status === 'waiting' && (
          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={styles.lobbyScrollContent}
          >
            {countdownRemaining !== null && countdownRemaining > 0 ? (
              <View style={styles.countdownContainer}>
                <View style={styles.countdownCard}>
                  <Text style={styles.countdownTitle}>🚀 Game Starting In</Text>
                  <Text style={styles.countdownNumber}>{countdownRemaining}</Text>
                  <Text style={styles.countdownSubtitle}>Get ready to play!</Text>
                </View>
              </View>
            ) : (
              <>
                {/* Prominent Invite Section for Casual Games - Above everything */}
                {!room.isRanked && (
                  <View style={styles.lobbyInviteSection}>
                    <TouchableOpacity 
                      onPress={handleInvitePlayers} 
                      style={styles.lobbyInviteButton}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.lobbyInviteIcon}>📲</Text>
                      <View style={styles.lobbyInviteTextContainer}>
                        <Text style={styles.lobbyInviteTitle}>Invite Friends</Text>
                        <Text style={styles.lobbyInviteSubtitle}>Share this room with others</Text>
                      </View>
                      <Text style={styles.lobbyInviteArrow}>›</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* For ranked games: only show player count - no settings UI */}
                {room.isRanked ? (
                  <View style={styles.lobbyTopSection}>
                    <View style={styles.lobbySimpleCard}>
                      <View style={styles.playerCountSection}>
                        <View style={styles.playerCountRow}>
                          <Text style={styles.playerCountBig}>{room.players.length}</Text>
                          <Text style={styles.playerCountDivider}>/</Text>
                          <Text style={styles.playerCountMax}>{room.settings.maxPlayers}</Text>
                        </View>
                        <Text style={styles.playerCountLabel}>Players</Text>
                      </View>
                    </View>
                    {room.settings.autoStart && (
                      <Text style={styles.autoStartHintCentered}>
                        Game starts automatically at {room.settings.countdownTriggerPlayers} players
                      </Text>
                    )}
                  </View>
                ) : (
                  <View style={styles.lobbyTopSection}>
                    <View style={styles.lobbyUnifiedCard}>
                      <View style={styles.playerCountSection}>
                        <View style={styles.playerCountRow}>
                          <Text style={styles.playerCountBig}>{room.players.length}</Text>
                          <Text style={styles.playerCountDivider}>/</Text>
                          <Text style={styles.playerCountMax}>{room.settings.maxPlayers}</Text>
                        </View>
                        <Text style={styles.playerCountLabel}>Players</Text>
                      </View>
                      
                      <View style={styles.lobbyCardDivider} />
                      
                      <View style={styles.lobbyCardContent}>
                        <View style={styles.lobbyBadgesRow}>
                          {room.seasonName && (
                            <View style={styles.compactSeasonBadge}>
                              <Text style={styles.compactBadgeIcon}>📅</Text>
                              <Text style={styles.compactBadgeText}>{room.seasonName}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                )}
            </>
            )}
            
            <View style={styles.lobbyPlayersSection}>
              <Text style={styles.lobbyPlayersTitle}>Players in Lobby</Text>
              <PlayerList players={room.players} currentUserId={user?.uid} />
            </View>
            
            {!room.isRanked && room.hostId === user?.uid && (
              <View style={styles.lobbyActionSection}>
                <Button
                  title="START GAME"
                  onPress={handleStartGame}
                  disabled={room.players.length < 3}
                  size="lg"
                  variant="primary"
                  style={styles.startButton}
                />
              </View>
            )}
            
            {!room.isRanked && room.hostId !== user?.uid && (
              <View style={styles.lobbyActionSection}>
                <View style={styles.waitingCard}>
                  <Text style={styles.waitingIcon}>⏳</Text>
                  <Text style={styles.waitingCardText}>Waiting for host to start the game...</Text>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {/* COLLAPSIBLE CHAT - Only show in lobby (waiting status) */}
        {/* bottom offset increases by keyboard height so chat rides above the keyboard */}
        {user && room?.status === 'waiting' && (
          <View style={{
            position: 'absolute',
            bottom: 20 + chatKeyboardHeight,
            left: 20,
            right: 20,
            zIndex: 9999,
            elevation: 9999,
          }}>
            <ChatBox
              roomId={roomId}
              userId={user.uid}
              username={room.players.find(p => p.userId === user.uid)?.username || 'Player'}
              compact={true}
              maxHeight={300}
              userJoinedAt={Date.now()}
            />
          </View>
        )}

        {/* Starting game - room active but game state not yet loaded from RTDB */}
        {room.status === 'active' && !gameState && (
          <View style={styles.loadingPhase}>
            <Text style={styles.loadingEmoji}>🎮</Text>
            <Text style={styles.loadingText}>Starting Game...</Text>
            <Text style={styles.loadingSubtext}>Get ready! Your prompt is loading</Text>
            <View style={styles.loadingDotsContainer}>
              <Text style={styles.loadingDots}>●●●</Text>
            </View>
          </View>
        )}

        {/* Active game */}
        {gameState && (
          <View style={{ flex: 1 }} pointerEvents="box-none">
            <View style={{ flex: 1 }} pointerEvents="box-none">
              <ScrollView 
                style={styles.gameContent}
                contentContainerStyle={styles.gameContentContainer}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={async () => {
                      setRefreshing(true);
                      try {
                        // Force reload room data from Firestore
                        const roomRef = doc(firestore, 'rooms', roomId);
                        const roomSnap = await getDoc(roomRef);
                        if (roomSnap.exists()) {
                          const roomData = roomSnap.data();
                          setRoom({ roomId: roomSnap.id, ...roomData } as Room);
                          console.log('🔄 Room data refreshed, players updated');
                        }
                      } catch (error) {
                        console.error('Error refreshing room:', error);
                      } finally {
                        setRefreshing(false);
                      }
                    }}
                    tintColor={COLORS.text}
                    colors={[COLORS.primary]}
                  />
                }
              >
                {renderPhaseContent()}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Game finished */}
        {room.status === 'finished' && !gameState && (
          <View style={styles.finishedContainer}>
            <Text style={styles.finishedTitle}>Game Over!</Text>
            <ScoreBoard
              players={room.players}
              scores={Object.fromEntries(
                Object.entries(room.scores || {}).map(([userId, score]) => [
                  userId,
                  typeof score === 'object' ? score.totalVotes : score
                ])
              )}
            />
            <Button 
              title="Back to Lobby" 
              onPress={handleLeaveRoom}
              size="md"
              style={styles.backButton}
            />
          </View>
        )}
      </View>

      {/* Scoreboard sidebar (during active game) - Hidden on mobile */}

      {/* Game End Summary Modal */}
      {showGameEndSummary && gameEndRewards && (
        <GameEndSummary
          visible={showGameEndSummary}
          rewards={gameEndRewards}
          finalScores={finalScores}
          ratingChanges={ratingChanges}
          multiplayerRatingChanges={multiplayerRatingChanges}
          currentUserId={user?.uid}
          isHost={room?.hostId === user?.uid}
          playerCount={room?.players.length}
          onContinue={handleGameEndContinue}
          onRestart={handleGameRestart}
        />
      )}

      {/* Star Celebration Animation */}
      {showStarCelebration && starCelebrationData && (
        <StarCelebration
          visible={showStarCelebration}
          username={starCelebrationData.username}
          phrase={starCelebrationData.phrase}
          voteCount={starCelebrationData.voteCount}
          onComplete={() => {
            setShowStarCelebration(false);
            setStarCelebrationData(null);
          }}
        />
      )}

      {/* Victory Celebration - Game End */}
      {showVictoryCelebration && victoryData && (
        <VictoryCelebration
          visible={showVictoryCelebration}
          winners={victoryData}
          onComplete={() => {
            setShowVictoryCelebration(false);
            setVictoryData(null);
            setShowGameEndSummary(true);
          }}
        />
      )}
    </SafeAreaView>
  );
};

const createStyles = (COLORS: any, SPACING: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    minHeight: 48,
  },
  headerLeft: {
    flex: 1,
    marginRight: 8,
  },
  roomName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  roomCode: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  timerContainer: {
    marginRight: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inviteButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#DC2626',
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  leaveButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.error,
    borderRadius: 6,
  },
  leaveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  mainContent: {
    flex: 1,
  },
  sidebar: {
    display: 'none', // Hidden on mobile - causes layout issues
  },
  inGameScoreboard: {
    backgroundColor: COLORS.surface,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  scoreboardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
    letterSpacing: 1,
  },
  scoresList: {
    flexDirection: 'row',
  },
  scoreItem: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  playerName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  playerScore: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  lobbyScrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg + tabletHorizontalPadding,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  lobbyTopSection: {
    marginBottom: SPACING.xl,
  },
  lobbyUnifiedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  lobbySimpleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  autoStartHintCentered: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
    fontStyle: 'italic',
  },
  playerCountSection: {
    alignItems: 'center',
    paddingRight: SPACING.md,
  },
  playerCountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  playerCountBig: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    lineHeight: 36,
  },
  playerCountDivider: {
    fontSize: 28,
    fontWeight: '300',
    color: COLORS.textSecondary,
    marginHorizontal: 2,
  },
  playerCountMax: {
    fontSize: 28,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  playerCountLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: SPACING.xs,
  },
  lobbyCardDivider: {
    width: 1,
    height: 60,
    backgroundColor: COLORS.border,
    marginRight: SPACING.lg,
  },
  lobbyCardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  lobbyBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  compactRankedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gold || '#FFD700',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  compactSeasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexShrink: 1,
  },
  compactBadgeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  compactBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.text,
    flexShrink: 1,
  },
  autoStartHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  lobbyPlayersSection: {
    flex: 1,
  },
  lobbyPlayersTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.lg,
    letterSpacing: 0.5,
  },
  lobbyActionSection: {
    marginTop: SPACING.md,
  },
  lobbyInviteSection: {
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  lobbyInviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: SPACING.md,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  lobbyInviteIcon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  lobbyInviteTextContainer: {
    flex: 1,
  },
  lobbyInviteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  lobbyInviteSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  lobbyInviteArrow: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  countdownContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  countdownCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: SPACING.xl * 2,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  countdownTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  countdownNumber: {
    fontSize: 96,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginVertical: SPACING.lg,
    textShadowColor: COLORS.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  countdownSubtitle: {
    fontSize: 18,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  waitingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  waitingIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  waitingCardText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  gameContent: {
    flex: 1,
  },
  gameContentContainer: {
    padding: 12,
  },
  loadingPhase: {
    minHeight: 400,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  loadingDotsContainer: {
    marginTop: 16,
  },
  loadingDots: {
    fontSize: 24,
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: 4,
  },
  promptPhase: {
    minHeight: 400,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  phaseTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  promptText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  roundNumber: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  submissionPhase: {
    flex: 1,
  },
  submissionScrollView: {
    flex: 1,
  },
  submissionScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  androidButtonContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  inputAccessoryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    borderTopWidth: 2,
    borderTopColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  promptContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  promptLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  submissionInfo: {
    marginVertical: 16,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  typingText: {
    fontSize: 12,
    color: COLORS.primary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  inputContainer: {
    marginTop: 16,
    paddingHorizontal: 4,
  },
  phraseInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  charCount: {
    textAlign: 'right',
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
    marginBottom: 12,
  },
  waitingContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  waitingText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.success,
    marginBottom: 8,
    textAlign: 'center',
  },
  waitingSubtext: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  submittedPhrasePreview: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: '90%',
  },
  previewLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewText: {
    fontSize: 15,
    color: COLORS.text,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  waitingPhase: {
    minHeight: 400,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  votingPhase: {
    flex: 1,
    paddingTop: 16,
  },
  votingHeader: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  voteProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pressureText: {
    fontSize: 13,
    color: '#FF6B6B',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  promptReminderContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
  },
  promptReminderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  promptReminderText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 22,
  },
  voteInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginHorizontal: 20,
  },
  voteProgress: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  voteProgressText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  voteProgressLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  votedBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  votedText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  phrasesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resultsPhase: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  streakEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  winnersAvatarRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  winnerAvatarContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  winnerNameBelowAvatar: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 8,
    textAlign: 'center',
  },
  winnerCard: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginVertical: 12,
    alignItems: 'center',
  },
  winningPhrase: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.background,
    textAlign: 'center',
    marginBottom: 8,
  },
  winnerName: {
    fontSize: 15,
    color: COLORS.background,
    fontWeight: '600',
  },
  voteCountText: {
    fontSize: 14,
    color: COLORS.background,
    marginTop: 6,
  },
  allPhrasesList: {
    flex: 1,
    marginTop: 16,
  },
  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  starredResultCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  resultPhrase: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 6,
  },
  resultAuthor: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  resultVotesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultVotes: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  starBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  starBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
  },
  submitButton: {
    height: 56,
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  chatContainer: {
    padding: 12,
    paddingBottom: 0,
  },
  finishedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  finishedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  startButton: {
    height: 48,
    marginTop: 16,
    alignSelf: 'center',
    width: '80%',
  },
  backButton: {
    height: 48,
    marginTop: 16,
    alignSelf: 'center',
    width: '80%',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 24,
  },
  // Prompt phase styles
  phaseTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  roundBadge: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: `${COLORS.primary}20`,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  promptDisplayContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
  },
  promptDisplayLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  promptDisplayText: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 30,
  },
  phaseSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 8,
  },
  // Submission phase - progress & typing
  progressIndicator: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  progressText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  progressLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  typingDot: {
    fontSize: 8,
    color: COLORS.primary,
  },
  // Submission input wrapper & char count
  inputWrapper: {
    position: 'relative',
  },
  charCountContainer: {
    alignItems: 'flex-end',
    marginTop: 4,
    marginBottom: 12,
  },
  charCountWarning: {
    color: '#F59E0B',
  },
  charCountMax: {
    color: COLORS.error,
    fontWeight: '700',
  },
  // Submitted badge (shown above input after first submission)
  submittedBadge: {
    backgroundColor: '#1a7a3a',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  submittedBadgeText: {
    color: '#a3f0b5',
    fontSize: 13,
    fontWeight: '600',
  },
  // Submission success state
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successEmoji: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  // Compact styles for keyboard-friendly submission phase
  promptContainerCompact: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  promptLabelCompact: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  promptTextCompact: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 20,
  },
  submissionInfoCompact: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  submittedPlayersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  submittedLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  miniAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniAvatarContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    overflow: 'hidden',
  },
  moreCount: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  progressTextCompact: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  typingTextCompact: {
    fontSize: 11,
    color: COLORS.primary,
    fontStyle: 'italic',
  },
});

export default GameRoomScreen;









