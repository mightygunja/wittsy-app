import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../contexts/SettingsContext';
import { leaveRoom, startGame } from '../services/database';
import { gameTimerService } from '../services/gameTimer';
import { doc, onSnapshot } from 'firebase/firestore';
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

// Helper function to advance game phase
const advancePhase = async (roomId: string) => {
  try {
    const response = await fetch(
      `https://us-central1-wittsy-51992.cloudfunctions.net/advanceGamePhase`,
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
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const [room, setRoom] = useState<Room | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [phrase, setPhrase] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [voteCount, setVoteCount] = useState(0);
  
  // Track previous phase to detect actual phase changes
  const previousPhaseRef = useRef<string | null>(null);
  
  // Store unsubscribe functions to clean up before leaving
  const roomUnsubscribeRef = useRef<(() => void) | null>(null);
  const gameStateUnsubscribeRef = useRef<(() => void) | null>(null);

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
          console.log(' Entering results phase - calculating winner');
          if (!state.lastWinner && state.votes && state.submissions) {
            const voteCounts: { [userId: string]: number } = {};
            Object.values(state.votes).forEach((votedUserId: any) => {
              if (votedUserId) voteCounts[votedUserId] = (voteCounts[votedUserId] || 0) + 1;
            });
            let maxVotes = 0;
            let winnerId = null;
            Object.entries(voteCounts).forEach(([userId, count]) => {
              if (count > maxVotes) { maxVotes = count; winnerId = userId; }
            });
            if (winnerId && state.submissions[winnerId]) {
              state.lastWinner = winnerId;
              state.lastWinningPhrase = state.submissions[winnerId];
              console.log(' Winner:', winnerId, 'Phrase:', state.lastWinningPhrase, 'Votes:', maxVotes);
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
        
        // Advance phase when timer hits 0
        if (remaining === 0 && !hasAdvanced) {
          hasAdvanced = true;
          advancePhase(roomId);
        // Auto-submit if enabled and time runs out
        if (remaining === 0 && !hasAdvanced && gameState.phase === 'submission') {
          if (settings.gameplay.autoSubmit && phrase.trim() && !hasSubmitted) {
            console.log('⚡ Auto-submitting phrase due to timeout');
            markSubmission(roomId, user.uid, phrase.trim());
            setHasSubmitted(true);
          }
        }

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

  // Handle start game (host only)
  const handleStartGame = async () => {
    if (!room || room.hostId !== user?.uid) return;

    if (room.players.length < 1) {
      Alert.alert('Error', 'Need at least 1 player to start');
      return;
    }

    try {
      await startGame(roomId);
    } catch (error) {
      console.error('Error starting game:', error);
      Alert.alert('Error', 'Failed to start game');
    }
  };

  // Handle leave room
  const handleLeaveRoom = async () => {
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
      navigation.goBack();
    } catch (error) {
      console.error('Error leaving room:', error);
      Alert.alert('Error', 'Failed to leave room');
    }
  };
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      gameTimerService.stopTimer(roomId);
    };
  }, [roomId]);

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
            <Text style={styles.phaseTitle}>GET READY!</Text>
            <Text style={styles.promptText}>{promptText}</Text>
            <Text style={styles.roundNumber}>Round {gameState.currentRound}</Text>
          </View>
        );

      case 'submission':
        return (
          <View style={styles.submissionPhase}>
            <Text style={styles.promptText}>{promptText}</Text>
            
            <View style={styles.submissionInfo}>
              <Text style={styles.infoText}>
                {submissionCount}/{room?.players.length || 0} submitted
              </Text>
              {settings.gameplay.showTypingIndicators && typingUsers.length > 0 && (
                <Text style={styles.typingText}>
                  {typingUsers.length} {typingUsers.length === 1 ? 'player is' : 'players are'} typing...
                </Text>
              )}
            </View>

            {!hasSubmitted ? (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.phraseInput}
                  placeholder="Enter your witty phrase..."
                  placeholderTextColor={COLORS.textSecondary}
                  value={phrase}
                  onChangeText={handlePhraseChange}
                  multiline
                  maxLength={200}
                  autoFocus
                />
                <Text style={styles.charCount}>{phrase.length}/200</Text>
                <Button
                  title="SUBMIT PHRASE"
                  onPress={handleSubmit}
                  disabled={!phrase.trim()}
                  size="md"
                  style={styles.submitButton}
                />
              </View>
            ) : (
              <View style={styles.waitingContainer}>
                <Text style={styles.waitingText}>✓ Phrase submitted!</Text>
                <Text style={styles.waitingSubtext}>Waiting for other players...</Text>
              </View>
            )}
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
              {Object.entries(gameState.submissions || {}).map(([userId, phraseText], index) => (
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
        console.log(' RESULTS PHASE - Winner:', gameState.lastWinner, 'Phrase:', gameState.lastWinningPhrase);
        return (
          <View style={styles.resultsPhase}>
            <Text style={styles.phaseTitle}>WINNER!</Text>
            
            {gameState.lastWinningPhrase && (
              <View style={styles.winnerCard}>
                <Text style={styles.winningPhrase}>"{gameState.lastWinningPhrase}"</Text>
                {gameState.lastWinner && (
                  <Text style={styles.winnerName}>
                    by {room?.players.find(p => p.userId === gameState.lastWinner)?.username || 'Unknown'}
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
                  <View key={userId} style={styles.resultCard}>
                    <Text style={styles.resultPhrase}>"{phraseText}"</Text>
                    <Text style={styles.resultAuthor}>by {username}</Text>
                    <Text style={styles.resultVotes}>
                      {votes} {votes === 1 ? 'vote' : 'votes'}
                      {votes >= 6 && ' ⭐'}
                    </Text>
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
          <View style={styles.lobby}>
            <Text style={styles.lobbyTitle}>Waiting for game to start...</Text>
            <Text style={styles.lobbySubtitle}>
              {room.players.length}/{room.settings.maxPlayers} players
            </Text>
            
            <PlayerList players={room.players} currentUserId={user?.uid} />
            
            {room.hostId === user?.uid && (
              <Button
                title="START GAME"
                onPress={handleStartGame}
                disabled={room.players.length < 1}
                size="md"
                style={styles.startButton}
              />
            )}
            
            {room.hostId !== user?.uid && (
              <Text style={styles.waitingForHost}>Waiting for host to start...</Text>
            )}
          </View>
        )}

        {/* Active game */}
        {gameState && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={100}
          >
            <View style={{ flex: 1 }}>
              <ScrollView 
                style={styles.gameContent}
                contentContainerStyle={styles.gameContentContainer}
                keyboardShouldPersistTaps="handled"
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
          </KeyboardAvoidingView>
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
    </SafeAreaView>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
    minHeight: 60,
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
  lobby: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  lobbyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  lobbySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  waitingForHost: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 16,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 16,
    textAlign: 'center',
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
    paddingVertical: 16,
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
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  waitingPhase: {
    minHeight: 400,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  votingPhase: {
    paddingVertical: 8,
  },
  votingHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  voteInfo: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  votedText: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '700',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  phrasesList: {
    flex: 1,
    paddingHorizontal: 4,
  },
  resultsPhase: {
    paddingVertical: 16,
  },
  winnerCard: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    padding: 16,
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
  resultVotes: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  submitButton: {
    height: 48,
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









