import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Dimensions, Platform, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, ANIMATION } from '../utils/constants';
import { getActiveRooms, createRoom, joinRoom } from '../services/database';
import { DEFAULT_SUBMISSION_TIME, DEFAULT_VOTING_TIME, WINNING_VOTES, MAX_PLAYERS } from '../utils/constants';

const { width } = Dimensions.get('window');

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, userProfile, signOut } = useAuth();
  const [quickMatchLoading, setQuickMatchLoading] = useState(false);
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATION.slow,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulsing animation for Quick Play
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Shimmer animation
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Load active rooms on mount
    loadActiveRooms();
  }, []);

  // Reload rooms when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadActiveRooms();
    }, [])
  );

  const loadActiveRooms = async () => {
    try {
      const rooms = await getActiveRooms({ isPrivate: false });
      setActiveRooms(rooms.slice(0, 5));
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const handleQuickMatch = async () => {
    if (!user?.uid || !userProfile?.username) {
      Alert.alert('Error', 'Please sign in to play');
      return;
    }

    setQuickMatchLoading(true);

    try {
      const rooms = await getActiveRooms({
        status: 'waiting',
        isPrivate: false,
      });

      const availableRoom = rooms.find(
        room => room.players.length < room.settings.maxPlayers &&
        !room.players.find((p: any) => p.userId === user.uid) // Don't join if already in room
      );

      if (availableRoom) {
        await joinRoom(availableRoom.roomId, user.uid, userProfile.username);
        navigation.navigate('GameRoom', { roomId: availableRoom.roomId });
      } else {
        const roomId = await createRoom(
          user.uid,
          userProfile.username,
          `${userProfile.username}'s Room`,
          {
            maxPlayers: MAX_PLAYERS,
            submissionTime: DEFAULT_SUBMISSION_TIME,
            votingTime: DEFAULT_VOTING_TIME,
            winningVotes: WINNING_VOTES,
            isPrivate: false,
          }
        );
        navigation.navigate('GameRoom', { roomId });
      }
    } catch (error: any) {
      console.error('Error with quick match:', error);
      
      let errorMessage = 'Failed to start quick match';
      if (error.message?.includes('Already in room')) {
        errorMessage = 'You are already in a room. Please leave it first.';
      } else if (error.message?.includes('permission')) {
        errorMessage = 'Permission denied. Please check your connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Quick Match Error', errorMessage);
    } finally {
      setQuickMatchLoading(false);
    }
  };

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated Background */}
      <LinearGradient
        colors={[COLORS.background, COLORS.backgroundLight, COLORS.backgroundElevated]}
        style={styles.backgroundGradient}
      />
      
      {/* Shimmer Effect */}
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX: shimmerTranslate }],
          },
        ]}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.titleContainer}>
            <Text style={styles.gameTitle}>WITTSY</Text>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark] as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.titleUnderline}
            />
          </View>
          
          {/* Compact User Info */}
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.8}>
            <View style={styles.userInfoCompact}>
              <Text style={styles.usernameCompact}>{userProfile?.username || 'Player'}</Text>
              <Badge text={`LVL ${userProfile?.level || 1}`} variant="gold" size="sm" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Play - Hero Button */}
        <Animated.View
          style={[
            styles.quickPlayContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Button
            title={quickMatchLoading ? "FINDING MATCH..." : "⚡ QUICK PLAY"}
            onPress={handleQuickMatch}
            variant="gold"
            size="xl"
            fullWidth
            loading={quickMatchLoading}
          />
        </Animated.View>

        {/* Main Actions - 2 Column Grid */}
        <Animated.View
          style={[
            styles.mainActionsGrid,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Card variant="glow" onPress={() => navigation.navigate('BrowseRooms')} style={styles.mainActionCard}>
            <View style={styles.actionCard}>
              <Text style={styles.actionIcon}>🎲</Text>
              <Text style={styles.actionTitle}>BROWSE ROOMS</Text>
              <Text style={styles.actionSubtitle}>{activeRooms.length} Active</Text>
            </View>
          </Card>

          <Card variant="elevated" onPress={() => navigation.navigate('CreateRoom')} style={styles.mainActionCard}>
            <View style={styles.actionCard}>
              <Text style={styles.actionIcon}>➕</Text>
              <Text style={styles.actionTitle}>CREATE ROOM</Text>
              <Text style={styles.actionSubtitle}>Host Your Game</Text>
            </View>
          </Card>
        </Animated.View>

        {/* Secondary Features - Horizontal Scroll */}
        <Animated.View style={[styles.secondarySection, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Explore</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.secondaryScroll}
          >
            <TouchableOpacity 
              style={styles.secondaryCard}
              onPress={() => navigation.navigate('BattlePass')}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.secondaryGradient}
              >
                <Text style={styles.secondaryIcon}>⚔️</Text>
                <Text style={styles.secondaryTitle}>Battle Pass</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryCard}
              onPress={() => navigation.navigate('PromptLibrary')}
            >
              <LinearGradient
                colors={['#667EEA', '#764BA2']}
                style={styles.secondaryGradient}
              >
                <Text style={styles.secondaryIcon}>📚</Text>
                <Text style={styles.secondaryTitle}>Prompts</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryCard}
              onPress={() => navigation.navigate('Challenges')}
            >
              <LinearGradient
                colors={['#F093FB', '#F5576C']}
                style={styles.secondaryGradient}
              >
                <Text style={styles.secondaryIcon}>🎯</Text>
                <Text style={styles.secondaryTitle}>Challenges</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryCard}
              onPress={() => navigation.navigate('Events')}
            >
              <LinearGradient
                colors={['#4FACFE', '#00F2FE']}
                style={styles.secondaryGradient}
              >
                <Text style={styles.secondaryIcon}>🏆</Text>
                <Text style={styles.secondaryTitle}>Events</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryCard}
              onPress={() => navigation.navigate('Friends')}
            >
              <LinearGradient
                colors={['#43E97B', '#38F9D7']}
                style={styles.secondaryGradient}
              >
                <Text style={styles.secondaryIcon}>👥</Text>
                <Text style={styles.secondaryTitle}>Friends</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>

        {/* Live Rooms Section */}
        {activeRooms.length > 0 && (
          <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔥 Live Rooms</Text>
              <Badge text="HOT" variant="error" shine size="sm" />
            </View>
            
            {activeRooms.map((room, index) => (
              <Card 
                key={room.roomId} 
                variant="glass" 
                style={styles.roomCard}
                onPress={() => navigation.navigate('GameRoom', { roomId: room.roomId })}
              >
                <View style={styles.roomInfo}>
                  <View>
                    <Text style={styles.roomName}>{room.name}</Text>
                    <Text style={styles.roomHost}>Host: {room.hostUsername}</Text>
                  </View>
                  <View style={styles.roomMeta}>
                    <Badge 
                      text={`${room.players.length}/${room.settings.maxPlayers}`}
                      variant="info"
                      size="sm"
                    />
                    <Text style={styles.roomStatus}>
                      {room.status === 'waiting' ? '⏳ Waiting' : '🎮 Playing'}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </Animated.View>
        )}
      </ScrollView>

      {/* Fixed Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => {}}
        >
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('Leaderboard')}
        >
          <Text style={styles.navIcon}>🏆</Text>
          <Text style={styles.navLabel}>Leaderboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('EnhancedSettings')}
        >
          <Text style={styles.navIcon}>⚙️</Text>
          <Text style={styles.navLabel}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: width * 0.3,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    transform: [{ skewX: '-20deg' }],
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.sm,
    paddingBottom: 200,
  },
  header: {
    marginBottom: SPACING.sm,
  },
  userInfoCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  usernameCompact: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  gameTitle: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.black,
    color: COLORS.text,
    letterSpacing: 3,
    textAlign: 'center',
    textShadowColor: COLORS.primaryGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  titleUnderline: {
    height: 3,
    width: 100,
    borderRadius: RADIUS.full,
    marginTop: 4,
  },
  tagline: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textTertiary,
    textAlign: 'center',
    letterSpacing: 3,
    marginBottom: SPACING.lg,
  },
  userCard: {
    marginTop: SPACING.md,
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textTertiary,
    letterSpacing: 1,
    marginBottom: SPACING.xxs,
  },
  username: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.text,
  },
  viewProfile: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary,
    marginTop: SPACING.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  statsContainer: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  quickPlayContainer: {
    marginBottom: SPACING.lg,
    height: 60,
  },
  mainActionsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  mainActionCard: {
    flex: 1,
  },
  actionCard: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  secondarySection: {
    marginBottom: SPACING.lg,
  },
  secondaryScroll: {
    paddingRight: SPACING.md,
    gap: SPACING.sm,
  },
  secondaryCard: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginRight: SPACING.sm,
  },
  secondaryGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  secondaryIcon: {
    fontSize: 40,
    marginBottom: SPACING.xs,
  },
  secondaryTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  actionIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  actionTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xxs,
    letterSpacing: 0.5,
  },
  actionSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  roomCard: {
    marginBottom: SPACING.sm,
  },
  roomInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.xxs,
  },
  roomHost: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  roomMeta: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  roomStatus: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
    marginTop: SPACING.xxs,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  navIcon: {
    fontSize: 24,
    marginBottom: SPACING.xxs,
  },
  navLabel: {
    fontSize: 10,
    color: COLORS.text,
    fontWeight: '600',
  },
});
