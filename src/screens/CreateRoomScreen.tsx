import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Switch, ScrollView, Platform } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { createRoom } from '../services/database';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { validateRoomName } from '../utils/validation';
import { COLORS, DEFAULT_SUBMISSION_TIME, DEFAULT_VOTING_TIME, DEFAULT_WINNING_SCORE } from '../utils/constants';

export const CreateRoomScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { userProfile } = useAuth();
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('12');
  const [submissionTime, setSubmissionTime] = useState(DEFAULT_SUBMISSION_TIME.toString());
  const [votingTime, setVotingTime] = useState(DEFAULT_VOTING_TIME.toString());
  const [winningScore, setWinningScore] = useState(DEFAULT_WINNING_SCORE.toString());
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleCreateRoom = async () => {
    console.log('=== handleCreateRoom CALLED ===');
    console.log('User Profile:', userProfile);
    console.log('Room Name:', roomName);
    
    if (!userProfile) {
      console.error('NO USER PROFILE!');
      Alert.alert('Error', 'User profile not loaded. Please try again.');
      return;
    }

    // Clear previous errors
    setErrors({});

    // Validate room name
    const roomNameError = validateRoomName(roomName);
    console.log('Room name validation result:', roomNameError);
    if (roomNameError) {
      console.log('Room name validation failed:', roomNameError);
      setErrors({ roomName: roomNameError });
      Alert.alert('Validation Error', roomNameError);
      return;
    }

    // Validate max players
    const maxPlayersNum = parseInt(maxPlayers);
    if (isNaN(maxPlayersNum) || maxPlayersNum < 3 || maxPlayersNum > 12) {
      const error = 'Max players must be between 3 and 12';
      console.log('Max players validation failed:', error);
      setErrors({ maxPlayers: error });
      Alert.alert('Validation Error', error);
      return;
    }

    // Validate submission time
    const submissionTimeNum = parseInt(submissionTime);
    if (isNaN(submissionTimeNum) || submissionTimeNum < 15 || submissionTimeNum > 60) {
      const error = 'Submission time must be between 15 and 60 seconds';
      console.log('Submission time validation failed:', error);
      setErrors({ submissionTime: error });
      Alert.alert('Validation Error', error);
      return;
    }

    // Validate voting time
    const votingTimeNum = parseInt(votingTime);
    if (isNaN(votingTimeNum) || votingTimeNum < 5 || votingTimeNum > 30) {
      const error = 'Voting time must be between 5 and 30 seconds';
      console.log('Voting time validation failed:', error);
      setErrors({ votingTime: error });
      Alert.alert('Validation Error', error);
      return;
    }

    // Validate winning score
    const winningScoreNum = parseInt(winningScore);
    if (isNaN(winningScoreNum) || winningScoreNum < 5 || winningScoreNum > 25) {
      const error = 'Winning score must be between 5 and 25';
      console.log('Winning score validation failed:', error);
      setErrors({ winningScore: error });
      Alert.alert('Validation Error', error);
      return;
    }

    // Validate password for private rooms
    if (isPrivate && (!password || password.trim().length === 0)) {
      const error = 'Password is required for private rooms';
      console.log('Password validation failed:', error);
      setErrors({ password: error });
      Alert.alert('Validation Error', error);
      return;
    }

    console.log('All validations passed, creating room...');
    setLoading(true);

    try {
      const roomId = await createRoom(
        userProfile.uid,
        userProfile.username,
        roomName,
        {
          maxPlayers: maxPlayersNum,
          submissionTime: submissionTimeNum,
          votingTime: votingTimeNum,
          winningScore: winningScoreNum,
          isPrivate,
          password: isPrivate ? password : undefined,
          promptPacks: ['default'],
          profanityFilter: 'medium',
          spectatorChatEnabled: true,
          allowJoinMidGame: false
        }
      );

      console.log('Room created successfully with ID:', roomId);
      setLoading(false);
      
      // Navigate to the game room
      navigation.navigate('GameRoom', { roomId });
    } catch (error: any) {
      console.error('Error creating room:', error);
      setLoading(false);
      Alert.alert('Error', error.message || 'Failed to create room. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create Your Room</Text>
          
        {/* Debug info */}
        <Text style={{ color: 'red', marginBottom: 10, fontSize: 16 }}>
          Debug: User = {userProfile?.username || 'NOT LOADED'}, Loading = {loading ? 'YES' : 'NO'}
        </Text>

        <Input
          label="Room Name"
          value={roomName}
          onChangeText={setRoomName}
          placeholder="Enter room name"
          error={errors.roomName}
          maxLength={30}
        />

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Input
            label="Max Players"
            value={maxPlayers}
            onChangeText={setMaxPlayers}
            placeholder="12"
            keyboardType="number-pad"
            error={errors.maxPlayers}
          />
        </View>
        <View style={styles.halfInput}>
          <Input
            label="Winning Score"
            value={winningScore}
            onChangeText={setWinningScore}
            placeholder="10"
            keyboardType="number-pad"
            error={errors.winningScore}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Input
            label="Submission Time (s)"
            value={submissionTime}
            onChangeText={setSubmissionTime}
            placeholder="25"
            keyboardType="number-pad"
            error={errors.submissionTime}
          />
        </View>
        <View style={styles.halfInput}>
          <Input
            label="Voting Time (s)"
            value={votingTime}
            onChangeText={setVotingTime}
            placeholder="10"
            keyboardType="number-pad"
            error={errors.votingTime}
          />
        </View>
      </View>

      <View style={styles.switchRow}>
        <View>
          <Text style={styles.switchLabel}>Private Room</Text>
          <Text style={styles.switchSubtext}>Requires password to join</Text>
        </View>
        <Switch
          value={isPrivate}
          onValueChange={setIsPrivate}
          trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
          thumbColor="#FFFFFF"
        />
      </View>

      {isPrivate && (
        <Input
          label="Password (Required)"
          value={password}
          onChangeText={setPassword}
          placeholder="Enter password for your room"
          secureTextEntry
          error={errors.password}
        />
      )}

      <Button
          title={loading ? "Creating..." : "Create Room"}
          onPress={handleCreateRoom}
          loading={loading}
          disabled={loading}
          style={styles.createButton}
        />

        <Button
          title="Cancel"
          onPress={() => {
            console.log('Cancel button clicked');
            navigation.goBack();
          }}
          variant="outline"
          disabled={loading}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  content: {
    padding: 24,
    paddingBottom: 40,
    flexGrow: 1
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: COLORS.text
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  halfInput: {
    flex: 1
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 8
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4
  },
  switchSubtext: {
    fontSize: 14,
    color: COLORS.gray
  },
  createButton: {
    marginTop: 24,
    marginBottom: 12
  }
});
