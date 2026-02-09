import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Alert, Switch, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { createRoom } from '../services/database';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { validateRoomName } from '../utils/validation';
import { DEFAULT_SUBMISSION_TIME, DEFAULT_VOTING_TIME, WINNING_VOTES } from '../utils/constants'
import { useTheme } from '../hooks/useTheme';;
import { tabletHorizontalPadding } from '../utils/responsive';

export const CreateRoomScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors: COLORS } = useTheme();
  const { userProfile } = useAuth();
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('12');
  const [submissionTime, setSubmissionTime] = useState(DEFAULT_SUBMISSION_TIME.toString());
  const [votingTime, setVotingTime] = useState(DEFAULT_VOTING_TIME.toString());
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

    // Winning votes is now fixed at 20 (WINNING_VOTES constant)

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
      const settings: any = {
        maxPlayers: maxPlayersNum,
        minPlayers: 2,
        submissionTime: submissionTimeNum,
        votingTime: votingTimeNum,
        winningVotes: WINNING_VOTES, // Fixed at 20
        isPrivate,
        promptPacks: ['default'],
        profanityFilter: 'medium',
        spectatorChatEnabled: true,
        allowJoinMidGame: true,
        autoStart: false,
        countdownTriggerPlayers: 0
      };
      
      if (isPrivate) {
        settings.password = password;
      }
      
      const roomId = await createRoom(
        userProfile.uid,
        userProfile.username,
        roomName,
        settings
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
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);


  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <Text style={styles.title}>Create Your Room</Text>

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
          <Text style={styles.infoLabel}>Winning Votes</Text>
          <View style={styles.fixedValueContainer}>
            <Text style={styles.fixedValue}>20 votes</Text>
            <Text style={styles.fixedValueSubtext}>Fixed</Text>
          </View>
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
          trackColor={{ false: COLORS.border, true: COLORS.primary }}
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
        size="md"
        style={styles.createButton}
      />

      <Button
        title="Cancel"
        onPress={() => navigation.goBack()}
        variant="outline"
        disabled={loading}
        size="md"
        style={styles.cancelButton}
      />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  content: {
    padding: 16,
    paddingHorizontal: 16 + tabletHorizontalPadding,
    paddingBottom: 24
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
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
    color: COLORS.textSecondary
  },
  createButton: {
    marginTop: 16,
    marginBottom: 8,
    height: 48
  },
  cancelButton: {
    height: 48
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8
  },
  fixedValueContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center'
  },
  fixedValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4
  },
  fixedValueSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1
  }
});
