import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../contexts/SettingsContext';
import { AvatarDisplay } from '../components/avatar/AvatarDisplay';
import { leaveRoom, startGame } from '../services/database';
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
import { Room, GamePhase } from '../types';
import { ChatBox } from '../components/social/ChatBox';
import { useTheme } from '../hooks/useTheme';;
import { validatePhrase } from '../utils/validation';
import { Button } from '../components/common/Button';
import { rewards, REWARD_AMOUNTS } from '../services/rewardsService';
import { incrementChallengeProgress } from '../services/challenges';
import { battlePass } from '../services/battlePassService';
import { GameEndSummary } from '../components/game/GameEndSummary';
import { StarCelebration } from '../components/game/StarCelebration';
import { SPACING, STAR_THRESHOLD } from '../utils/constants';
import { updatePlayerRating, RatingUpdate } from '../services/eloRatingService';

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

  const [room, setRoom] = useState<Room | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStarCelebration, setShowStarCelebration] = useState(false);
  const [starCelebrationData, setStarCelebrationData] = useState<{
    username: string;
    phrase: string;
    voteCount: number;
  } | null>(null);
  const [countdownRemaining, setCountdownRemaining] = useState<number | null>(null);
  const [phrase, setPhrase] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [voteCount, setVoteCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
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

      // Prepare final scores
      const scores = room.players.map((player) => {
        const playerScore = room.scores?.[player.userId];
        const totalVotes = typeof playerScore === 'object' ? (playerScore.totalVotes || 0) : 0;
        return {
          userId: player.userId,
          username: player.username,
          score: totalVotes,
        };
      });

      // Sort by score to determine winner and loser
      const sortedScores = [...scores].sort((a, b) => b.score - a.score);
      
      // Update ELO ratings for 1v1 games
      let ratingUpdate = null;
      if (room.players.length === 2 && sortedScores.length === 2) {
        try {
          const winnerId = sortedScores[0].userId;
          const loserId = sortedScores[1].userId;
          
          console.log('📊 Updating ELO ratings:', { winnerId, loserId });
          ratingUpdate = await updatePlayerRating(winnerId, loserId);
          setRatingChanges(ratingUpdate);
          
          console.log('✅ ELO ratings updated:', {
            winner: `${ratingUpdate.winner.oldRating} → ${ratingUpdate.winner.newRating} (${ratingUpdate.winner.ratingChange > 0 ? '+' : ''}${ratingUpdate.winner.ratingChange})`,
            loser: `${ratingUpdate.loser.oldRating} → ${ratingUpdate.loser.newRating} (${ratingUpdate.loser.ratingChange > 0 ? '+' : ''}${ratingUpdate.loser.ratingChange})`
          });
        } catch (error) {
          console.error('Failed to update ELO ratings:', error);
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
      setShowGameEndSummary(true);

      console.log('✅ Game end rewards processed');
    } catch (error) {
      console.error('Failed to process game end:', error);
    }
  };

  const handleGameEndContinue = () => {
    setShowGameEndSummary(false);
    gameEndProcessedRef.current = false;
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
          setHasSubmitted(false);
          setPhrase('');
          setHasVoted(false);
        } else if (state.phase === 'voting' && previousPhase !== 'voting') {
          console.log('🔄 Entering voting phase');
          setHasVoted(false);
        } else if (state.phase === 'results' && previousPhase !== 'results') {
          console.log('🏆 Entering results phase - calculating winner');
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
        
        // Advance phase when timer hits 0
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
      setVoteCount(Object.keys(votes).length);
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

  
  // Handle phrase submission with optional confirmation
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

    const submitPhrase = async () => {
      try {
        await markSubmission(roomId, user.uid, phrase.trim());
        
        setHasSubmitted(true);
        setTyping(roomId, user.uid, false);
      } catch (error) {
        console.error('Error submitting phrase:', error);
        Alert.alert('Error', 'Failed to submit phrase');
      }
    };

    // Show confirmation dialog if enabled
    if (settings.gameplay.confirmBeforeSubmit) {
      Alert.alert(
        'Confirm Submission',
        `Submit this phrase?\n\n"${phrase.trim()}"`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit', onPress: submitPhrase }
        ]
      );
    } else {
      await submitPhrase();
    }
  };


  // Handle vote
  const handleVote = async (phraseId: string) => {
    if (!user?.uid || hasVoted) return;

    // Prevent voting for own phrase
    if (phraseId === user.uid) {
      Alert.alert('Error', 'You cannot vote for your own phrase');
      return;
    }

    try {
      await markVote(roomId, user.uid, phraseId);
      
      // Note: Vote storage is handled by markVote in realtime DB

      setHasVoted(true);
    } catch (error) {
      console.error('Error voting:', error);
      Alert.alert('Error', 'Failed to cast vote');
    }
  };

  // Handle start game (host or auto-start)
  const handleStartGame = async () => {
    if (!room) return;
    
    // Allow auto-start for ranked games, otherwise require host
    if (!room.isRanked && room.hostId !== user?.uid) return;

    const minPlayers = room.settings?.minPlayers || 3;
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
          <Text style={styles.loadingEmoji}>🤔</Text>
          <Text style={styles.loadingText}>Loading game...</Text>
          <Text style={styles.loadingSubtext}>Preparing your first prompt</Text>
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
        return (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.submissionPhase}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 140 : 100}
          >
            <ScrollView
              contentContainerStyle={styles.submissionScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.promptContainer}>
                <Text style={styles.promptLabel}>PROMPT</Text>
                <Text style={styles.promptText}>{promptText}</Text>
              </View>
              
              <View style={styles.submissionInfo}>
                <View style={styles.progressIndicator}>
                  <Text style={styles.progressText}>
                    {submissionCount}/{room?.players.length || 0}
                  </Text>
                  <Text style={styles.progressLabel}>submitted</Text>
                </View>
                {settings.gameplay.showTypingIndicators && typingUsers.length > 0 && (
                  <View style={styles.typingIndicator}>
                    <Text style={styles.typingDot}>●</Text>
                    <Text style={styles.typingText}>
                      {typingUsers.length} typing...
                    </Text>
                  </View>
                )}
              </View>

              {!hasSubmitted ? (
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.phraseInput}
                      placeholder="Type your witty response here..."
                      placeholderTextColor={COLORS.textSecondary}
                      value={phrase}
                      onChangeText={handlePhraseChange}
                      multiline
                      maxLength={200}
                      autoFocus
                      returnKeyType="done"
                      blurOnSubmit={false}
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
                  </View>
                  <Button
                    title={phrase.trim() ? "SUBMIT PHRASE" : "ENTER YOUR PHRASE"}
                    onPress={handleSubmit}
                    disabled={!phrase.trim()}
                    size="lg"
                    style={styles.submitButton}
                  />
                </View>
              ) : (
                <View style={styles.waitingContainer}>
                  <View style={styles.successIcon}>
                    <Text style={styles.successEmoji}>✓</Text>
                  </View>
                  <Text style={styles.waitingText}>Phrase Submitted!</Text>
                  <Text style={styles.waitingSubtext}>Waiting for other players...</Text>
                  <View style={styles.submittedPhrasePreview}>
                    <Text style={styles.previewLabel}>Your phrase:</Text>
                    <Text style={styles.previewText}>"{phrase}"</Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        );

      case 'waiting':
        return (
          <View style={styles.waitingPhase}>
            <Text style={styles.phaseTitle}>SHUFFLING PHRASES...</Text>
            <Text style={styles.waitingText}>Get ready to vote!</Text>
          </View>
        );

      case 'voting':
        console.log(' VOTING PHASE - Submissions:', gameState.submissions, 'Count:', Object.keys(gameState.submissions || {}).length);
        return (
          <View style={styles.votingPhase}>
            <View style={styles.votingHeader}>
              <Text style={styles.phaseTitle}>VOTE FOR THE BEST!</Text>
              <Text style={styles.promptText}>{promptText}</Text>
            </View>
            
            <View style={styles.voteInfo}>
              <Text style={styles.infoText}>
                {voteCount}/{room?.players.length || 0} voted
              </Text>
              {hasVoted && (
                <Text style={styles.votedText}>✓ Vote cast!</Text>
              )}
            </View>

            <ScrollView style={styles.phrasesList} showsVerticalScrollIndicator={false}>
              {Object.entries(gameState.submissions || {})
                .sort(() => Math.random() - 0.5)
                .map(([userId, phraseText], index) => (
                <PhraseCard
                  key={userId}
                  number={index + 1}
                  phrase={phraseText}
                  onPress={() => handleVote(userId)}
                  disabled={hasVoted || userId === user?.uid}
                  isOwnPhrase={userId === user?.uid}
                  hasVoted={hasVoted && gameState.votes?.[user?.uid || ''] === userId}
                />
              ))}
            </ScrollView>
          </View>
        );

      case 'results':
        console.log('🏆 RESULTS PHASE - Winner:', gameState.lastWinner, 'Phrase:', gameState.lastWinningPhrase);
        const winnerPlayer = room?.players.find(p => p.userId === gameState.lastWinner);
        return (
          <View style={styles.resultsPhase}>
            <Text style={styles.phaseTitle}>WINNER!</Text>
            
            {/* Winner Avatar - 2x size for showcase */}
            {winnerPlayer?.avatarConfig && (
              <View style={styles.winnerAvatarContainer}>
                <AvatarDisplay config={winnerPlayer.avatarConfig} size={200} />
              </View>
            )}
            
            {gameState.lastWinningPhrase && (
              <View style={styles.winnerCard}>
                <Text style={styles.winningPhrase}>"{gameState.lastWinningPhrase}"</Text>
                {gameState.lastWinner && (
                  <Text style={styles.winnerName}>
                    by {winnerPlayer?.username || 'Unknown'}
                  </Text>
                )}
                
                {/* Show vote count */}
                {gameState.votes && (
                  <Text style={styles.voteCountText}>
                    {Object.values(gameState.votes).filter(v => v === gameState.lastWinner).length} votes
                  </Text>
                )}
              </View>
            )}

            {/* Show all phrases with vote counts */}
            <ScrollView style={styles.allPhrasesList}>
              {Object.entries(gameState.submissions || {})
                .map(([userId, phraseText]) => {
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
                          <Text style={styles.starBadgeText}>⭐ STARRED</Text>
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.roomName}>{room.name}</Text>
          <Text style={styles.roomCode}>Room ID: {roomId.substring(0, 6).toUpperCase()}</Text>
        </View>
        
        {gameState && settings.gameplay.showTimer && (

        
          <Timer
            timeRemaining={gameState.timeRemaining}
            phase={gameState.phase}
          />
        )}
        
        <TouchableOpacity onPress={handleLeaveRoom} style={styles.leaveButton}>
          <Text style={styles.leaveButtonText}>Leave</Text>
        </TouchableOpacity>
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
                      {room.isRanked && (
                        <View style={styles.compactRankedBadge}>
                          <Text style={styles.compactBadgeIcon}>🏆</Text>
                          <Text style={styles.compactBadgeText}>Ranked</Text>
                        </View>
                      )}
                      {room.seasonName && (
                        <View style={styles.compactSeasonBadge}>
                          <Text style={styles.compactBadgeIcon}>📅</Text>
                          <Text style={styles.compactBadgeText}>{room.seasonName}</Text>
                        </View>
                      )}
                    </View>
                    
                    {room.isRanked && room.settings.autoStart && (
                      <Text style={styles.autoStartHint}>
                        Auto-starts at {room.settings.countdownTriggerPlayers}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
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
                  disabled={room.players.length < 1}
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
                  <Text style={styles.waitingText}>Waiting for host to start the game...</Text>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {/* Active game */}
        {gameState && (
          <View style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
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
                    tintColor="#FFFFFF"
                    colors={['#A855F7']}
                  />
                }
              >
                {gameState ? renderPhaseContent() : (
                  <View style={styles.waitingPhase}>
                    <Text style={styles.phaseTitle}>Loading game...</Text>
                    <Text style={styles.waitingSubtext}>Please wait</Text>
                  </View>
                )}
              </ScrollView>
              
              {/* In-game Chat */}
              {user && (
                <View style={styles.chatContainer}>
                  <ChatBox
                    roomId={roomId}
                    userId={user.uid}
                    username={room.players.find(p => p.userId === user.uid)?.username || 'Player'}
                    compact={true}
                    maxHeight={300}
                  />
                </View>
              )}
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
          currentUserId={user?.uid}
          onContinue={handleGameEndContinue}
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
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    minHeight: 56,
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
  leaveButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.error,
    borderRadius: 6,
    marginLeft: 8,
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
  },
  compactBadgeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  compactBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.text,
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
  waitingText: {
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
  submissionScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
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
    marginBottom: 20,
    paddingHorizontal: 20,
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
  winnerAvatarContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
});

export default GameRoomScreen;









