import React, { useState, useEffect } from 'react';
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
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../hooks/useAuth';
import { getRoom, leaveRoom, startGame } from '../services/database';
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
import { COLORS } from '../utils/constants';
import { validatePhrase } from '../utils/validation';
import { Button } from '../components/common/Button';
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
}

const GameRoomScreen: React.FC = () => {
  const route = useRoute<GameRoomScreenRouteProp>();
  const navigation = useNavigation<GameRoomScreenNavigationProp>();
  const { user } = useAuth();
  const { roomId } = route.params;

  const [room, setRoom] = useState<Room | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [phrase, setPhrase] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [voteCount, setVoteCount] = useState(0);

  // Load room data
  useEffect(() => {
    loadRoom();
  }, [roomId]);

  const loadRoom = async () => {
    try {
      const roomData = await getRoom(roomId);
      if (!roomData) {
        Alert.alert('Error', 'Room not found');
        navigation.goBack();
        return;
      }
      setRoom(roomData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading room:', error);
      Alert.alert('Error', 'Failed to load room');
      navigation.goBack();
    }
  };

  // Subscribe to game state updates
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = subscribeToGameState(roomId, (state) => {
      if (state) {
        setGameState(state as GameState);
        
        // Reset phase-specific state when phase changes
        if (state.phase === 'submission') {
          setHasSubmitted(false);
          setPhrase('');
          setHasVoted(false);
        } else if (state.phase === 'voting') {
          setHasVoted(false);
        }
      }
    });

    return () => unsubscribe();
  }, [roomId]);

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
    
    if (text.length > 0 && gameState?.phase === 'submission' && user?.uid) {
      setTyping(roomId, user.uid, true);
    }
  };

  // Handle phrase submission
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
      await markSubmission(roomId, user.uid);
      
      // Note: Actual phrase storage would be handled by the game server/functions
      // For now, we just mark the submission in realtime DB

      setHasSubmitted(true);
      setTyping(roomId, user.uid, false);
      Alert.alert('Success', 'Phrase submitted!');
    } catch (error) {
      console.error('Error submitting phrase:', error);
      Alert.alert('Error', 'Failed to submit phrase');
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
      Alert.alert('Success', 'Vote cast!');
    } catch (error) {
      console.error('Error voting:', error);
      Alert.alert('Error', 'Failed to cast vote');
    }
  };

  // Handle start game (host only)
  const handleStartGame = async () => {
    if (!room || room.hostId !== user?.uid) return;

    if (room.players.length < 3) {
      Alert.alert('Error', 'Need at least 3 players to start');
      return;
    }

    try {
      await startGame(roomId);
      Alert.alert('Success', 'Game starting!');
    } catch (error) {
      console.error('Error starting game:', error);
      Alert.alert('Error', 'Failed to start game');
    }
  };

  // Handle leave room
  const handleLeaveRoom = async () => {
    if (!user?.uid) return;

    try {
      await leaveRoom(roomId, user.uid);
      navigation.goBack();
    } catch (error) {
      console.error('Error leaving room:', error);
      Alert.alert('Error', 'Failed to leave room');
    }
  };

  // Render phase-specific content
  const renderPhaseContent = () => {
    if (!gameState) return null;

    switch (gameState.phase) {
      case 'prompt':
        return (
          <View style={styles.promptPhase}>
            <Text style={styles.phaseTitle}>GET READY!</Text>
            <Text style={styles.promptText}>{gameState.currentPrompt}</Text>
            <Text style={styles.roundNumber}>Round {gameState.currentRound}</Text>
          </View>
        );

      case 'submission':
        return (
          <View style={styles.submissionPhase}>
            <Text style={styles.promptText}>{gameState.currentPrompt}</Text>
            
            <View style={styles.submissionInfo}>
              <Text style={styles.infoText}>
                {submissionCount}/{room?.players.length || 0} submitted
              </Text>
              {typingUsers.length > 0 && (
                <Text style={styles.typingText}>
                  {typingUsers.length} {typingUsers.length === 1 ? 'player is' : 'players are'} typing...
                </Text>
              )}
            </View>

            {!hasSubmitted ? (
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.inputContainer}
              >
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
                />
              </KeyboardAvoidingView>
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
        return (
          <View style={styles.votingPhase}>
            <Text style={styles.promptText}>{gameState.currentPrompt}</Text>
            
            <View style={styles.voteInfo}>
              <Text style={styles.infoText}>
                {voteCount}/{room?.players.length || 0} voted
              </Text>
              {hasVoted && (
                <Text style={styles.votedText}>✓ Vote cast!</Text>
              )}
            </View>

            <ScrollView style={styles.phrasesList}>
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.roomName}>{room.name}</Text>
          <Text style={styles.roomCode}>Room ID: {roomId.substring(0, 6).toUpperCase()}</Text>
        </View>
        
        {gameState && (
          <Timer
            timeRemaining={gameState.timeRemaining}
            phase={gameState.phase}
          />
        )}
        
        <TouchableOpacity onPress={handleLeaveRoom} style={styles.leaveButton}>
          <Text style={styles.leaveButtonText}>Leave</Text>
        </TouchableOpacity>
      </View>

      {/* Main content area */}
      <View style={styles.mainContent}>
        {/* Waiting lobby (before game starts) */}
        {room.status === 'waiting' && (
          <View style={styles.lobby}>
            <Text style={styles.lobbyTitle}>Waiting for game to start...</Text>
            <Text style={styles.lobbySubtitle}>
              {room.players.length}/{room.settings.maxPlayers} players
            </Text>
            
            <PlayerList players={room.players} />
            
            {room.hostId === user?.uid && (
              <Button
                title="START GAME"
                onPress={handleStartGame}
                disabled={room.players.length < 3}
              />
            )}
            
            {room.hostId !== user?.uid && (
              <Text style={styles.waitingForHost}>Waiting for host to start...</Text>
            )}
          </View>
        )}

        {/* Active game */}
        {room.status === 'active' && room.scores && (
          <ScrollView style={styles.gameContent}>
            {renderPhaseContent()}
          </ScrollView>
        )}

        {/* Game finished */}
        {room.status === 'finished' && (
          <View style={styles.finishedContainer}>
            <Text style={styles.finishedTitle}>Game Over!</Text>
            <ScoreBoard
              players={room.players}
              scores={Object.fromEntries(
                Object.entries(room.scores || {}).map(([userId, score]) => [
                  userId,
                  typeof score === 'object' ? score.roundWins : score
                ])
              )}
            />
            <Button title="Back to Lobby" onPress={handleLeaveRoom} />
          </View>
        )}
      </View>

      {/* Scoreboard sidebar (during active game) */}
      {room.status === 'active' && (
        <View style={styles.sidebar}>
          <ScoreBoard
            players={room.players}
            scores={Object.fromEntries(
              Object.entries(room.scores || {}).map(([userId, score]) => [
                userId,
                typeof score === 'object' ? score.roundWins : score
              ])
            )}
            compact
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flex: 1,
  },
  roomName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  roomCode: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  leaveButton: {
    padding: 8,
    backgroundColor: COLORS.error,
    borderRadius: 8,
  },
  leaveButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
  },
  sidebar: {
    position: 'absolute',
    right: 0,
    top: 70,
    bottom: 0,
    width: 200,
    backgroundColor: COLORS.surface,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    padding: 12,
  },
  lobby: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  lobbyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  lobbySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  waitingForHost: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  gameContent: {
    flex: 1,
    padding: 16,
  },
  promptPhase: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  phaseTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  promptText: {
    fontSize: 28,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  roundNumber: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  submissionPhase: {
    flex: 1,
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
  },
  phraseInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  charCount: {
    textAlign: 'right',
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  waitingContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  waitingText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.success,
    marginBottom: 8,
  },
  waitingSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  waitingPhase: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  votingPhase: {
    flex: 1,
  },
  voteInfo: {
    marginVertical: 16,
    alignItems: 'center',
  },
  votedText: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '600',
    marginTop: 4,
  },
  phrasesList: {
    flex: 1,
  },
  resultsPhase: {
    flex: 1,
  },
  winnerCard: {
    backgroundColor: COLORS.gold,
    borderRadius: 16,
    padding: 24,
    marginVertical: 16,
    alignItems: 'center',
  },
  winningPhrase: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.background,
    textAlign: 'center',
    marginBottom: 12,
  },
  winnerName: {
    fontSize: 18,
    color: COLORS.background,
    fontWeight: '600',
  },
  voteCountText: {
    fontSize: 16,
    color: COLORS.background,
    marginTop: 8,
  },
  allPhrasesList: {
    flex: 1,
    marginTop: 16,
  },
  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  resultPhrase: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
  },
  resultAuthor: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  resultVotes: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  finishedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  finishedTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 24,
  },
});

export default GameRoomScreen;
