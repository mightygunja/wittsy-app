import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { findAvailableRankedRoom, createRankedRoom } from '../services/matchmaking';
import { joinRoom } from '../services/database';
import { Button } from '../components/common/Button';
import { SPACING, RADIUS } from '../utils/constants';

export const QuickPlayScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, userProfile } = useAuth();
  const { colors: COLORS } = useTheme();
  const [searching, setSearching] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backButtonText: {
      fontSize: 28,
      color: '#FFFFFF',
      fontWeight: '300',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    headerRight: { width: 40 },
    content: {
      flex: 1,
      padding: SPACING.lg,
      justifyContent: 'center',
    },
    infoCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      marginBottom: SPACING.xl,
      alignItems: 'center',
    },
    infoIcon: {
      fontSize: 64,
      marginBottom: SPACING.md,
    },
    infoTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: SPACING.sm,
    },
    infoText: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
      marginBottom: SPACING.md,
      lineHeight: 24,
    },
    rulesContainer: {
      width: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      marginTop: SPACING.sm,
    },
    rulesTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: SPACING.xs,
    },
    ruleText: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.9)',
      marginVertical: 4,
    },
    playButton: {
      marginBottom: SPACING.lg,
    },
    searchingContainer: {
      alignItems: 'center',
      marginTop: SPACING.md,
    },
    searchingText: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.8)',
      marginTop: SPACING.sm,
    },
  }), [SPACING, RADIUS]);

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
      // Use actual user ELO from profile (ranked rating or default)
      const userElo = userProfile.rankedRating || userProfile.rating || 1000;
      console.log(`🎮 Quick Play: User ELO = ${userElo}`);
      
      // Try to find existing ranked room
      setStatusMessage('Looking for available games...');
      let room = await findAvailableRankedRoom(userElo);

      if (room) {
        console.log('✅ Found existing room:', room.roomId);
        setStatusMessage('Joining game...');
        
        const alreadyInRoom = room.players?.some(p => p.userId === user.uid);
        
        if (alreadyInRoom) {
          console.log('User already in room, navigating directly');
          navigation.navigate('GameRoom', { roomId: room.roomId });
        } else {
          await joinRoom(room.roomId, user.uid, userProfile.username);
          navigation.navigate('GameRoom', { roomId: room.roomId });
        }
      } else {
        // No room found - AUTO-CREATE new ranked room
        console.log('⚠️ No rooms available - creating new ranked room');
        setStatusMessage('Creating new game...');
        
        const roomId = await createRankedRoom(user.uid, userProfile.username);
        console.log(`✨ Created new ranked room: ${roomId}`);
        
        setStatusMessage('Joining your new game...');
        await joinRoom(roomId, user.uid, userProfile.username);
        
        console.log('✅ Successfully joined new ranked room');
        navigation.navigate('GameRoom', { roomId });
      }
    } catch (error: any) {
      console.error('❌ Quick Play error:', error);
      
      let errorMessage = 'Failed to join game. Please try again.';
      
      if (error.message === 'Already in room') {
        errorMessage = 'You are already in a game.';
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
    <LinearGradient colors={COLORS.gradientPrimary as any} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quick Play</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.content}>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>⚡</Text>
            <Text style={styles.infoTitle}>Ranked Matchmaking</Text>
            <Text style={styles.infoText}>
              Jump into a competitive ranked game. We'll match you with players of similar skill level.
            </Text>

            <View style={styles.rulesContainer}>
              <Text style={styles.rulesTitle}>Game Rules:</Text>
              <Text style={styles.ruleText}>• 3-12 players per game</Text>
              <Text style={styles.ruleText}>• Game starts at 6 players (30s countdown)</Text>
              <Text style={styles.ruleText}>• Affects your ELO rating</Text>
              <Text style={styles.ruleText}>• No mid-game joins</Text>
            </View>
          </View>

          <Button
            title={searching ? "Finding Match..." : "Find Game"}
            onPress={handleQuickPlay}
            variant="gold"
            size="lg"
            fullWidth
            loading={searching}
            disabled={searching}
            style={styles.playButton}
          />

          {searching && (
            <View style={styles.searchingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.searchingText}>
                {statusMessage || 'Finding the perfect match...'}
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};
