import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { findAvailableRankedRoom, createRankedRoom } from '../services/matchmaking';
import { joinRoom } from '../services/database';
import { SPACING } from '../utils/constants';
import { createSettingsStyles } from '../styles/settingsStyles';
import { BackButton } from '../components/common/BackButton';

export const QuickPlayScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, userProfile } = useAuth();
  const { colors: COLORS } = useTheme();
  const [searching, setSearching] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const styles = useMemo(() => createSettingsStyles(COLORS, SPACING), [COLORS]);

  const handleQuickPlay = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to play');
      return;
    }

    if (!userProfile?.username) {
      Alert.alert('Error', 'Profile not loaded. Please try again.');
      return;
    }

    setSearching(true);
    setStatusMessage('Searching for matches...');
    
    try {
      // Use actual user ELO from profile (rating or the new-profile default)
      const userElo = (userProfile as any).rankedRating || userProfile.rating || 1200;

      // Try to find existing ranked room
      setStatusMessage('Looking for available games...');
      let room = await findAvailableRankedRoom(userElo);

      if (room) {
        setStatusMessage('Joining game...');

        const alreadyInRoom = room.players?.some(p => p.userId === user.uid);

        if (alreadyInRoom) {
          navigation.navigate('GameRoom', { roomId: room.roomId });
        } else {
          await joinRoom(room.roomId, user.uid, userProfile.username);
          navigation.navigate('GameRoom', { roomId: room.roomId });
        }
      } else {
        // No room found - AUTO-CREATE new ranked room (host is already added as a player)
        setStatusMessage('Creating new game...');

        const roomId = await createRankedRoom(user.uid, userProfile.username, userElo);

        navigation.navigate('GameRoom', { roomId });
      }
    } catch (error: any) {
      console.error('Quick Play error:', error);

      let errorMessage = 'Failed to join game. Please try again.';

      if (error?.code === 'ALREADY_IN_ROOM' || error.message === 'Already in room') {
        errorMessage = 'You are already in a game.';
      } else if (error.message?.includes('active ranked game')) {
        // Surface the real, actionable cause instead of a generic retry message
        errorMessage = error.message;
      } else if (error.message?.includes('Game is locked')) {
        errorMessage = error.message;
      } else if (error.message?.includes('create')) {
        errorMessage = 'Failed to create game. Please try again.';
      } else if (error.message?.includes('join')) {
        errorMessage = 'Failed to join game. Please try again.';
      }

      Alert.alert('Quick Play Error', errorMessage);
    } finally {
      setSearching(false);
      setStatusMessage('');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Quick Play</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Ranked Matchmaking</Text>
          
          <View style={styles.settingCard}>
            <Text style={[styles.settingLabel, { marginBottom: SPACING.sm, textAlign: 'center' }]}>
              Jump into a competitive ranked game
            </Text>
            <Text style={[styles.settingDescription, { textAlign: 'center', marginBottom: SPACING.md }]}>
              We'll match you with players of similar skill level based on your ELO rating
            </Text>

            <View style={{ 
              backgroundColor: COLORS.background, 
              borderRadius: 8, 
              padding: SPACING.md,
              marginTop: SPACING.sm,
            }}>
              <Text style={[styles.settingLabel, { marginBottom: SPACING.sm }]}>Game Rules</Text>
              <Text style={styles.settingDescription}>• 3-12 players per game</Text>
              <Text style={styles.settingDescription}>• Auto-starts at 6 players (30s countdown)</Text>
              <Text style={styles.settingDescription}>• Affects your ELO rating</Text>
              <Text style={styles.settingDescription}>• No mid-game joins allowed</Text>
            </View>
          </View>

          <View style={styles.settingCard}>
            <Text style={[styles.settingLabel, { marginBottom: SPACING.xs, textAlign: 'center' }]}>
              Your Current Rating
            </Text>
            <Text style={[
              styles.settingLabel, 
              { 
                fontSize: 32, 
                color: COLORS.primary, 
                textAlign: 'center',
                marginBottom: SPACING.xs,
              }
            ]}>
              {(userProfile as any)?.rankedRating || userProfile?.rating || 1200}
            </Text>
            <Text style={[styles.settingDescription, { textAlign: 'center' }]}>
              ELO Rating
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { 
                backgroundColor: searching ? COLORS.textSecondary : COLORS.primary,
                marginTop: SPACING.lg,
              }
            ]}
            onPress={handleQuickPlay}
            disabled={searching}
          >
            {searching ? (
              <ActivityIndicator color={COLORS.text} />
            ) : (
              <Text style={[styles.actionButtonText, { color: COLORS.text }]}>
                🎮 Find Game
              </Text>
            )}
          </TouchableOpacity>

          {searching && statusMessage && (
            <View style={[styles.settingCard, { marginTop: SPACING.md, alignItems: 'center' }]}>
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginBottom: SPACING.sm }} />
              <Text style={[styles.settingDescription, { textAlign: 'center' }]}>
                {statusMessage}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
