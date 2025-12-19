import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, ANIMATION } from '../utils/constants';
import { getActiveRooms, createRoom, joinRoom } from '../services/database';
import { DEFAULT_SUBMISSION_TIME, DEFAULT_VOTING_TIME, DEFAULT_WINNING_SCORE, MAX_PLAYERS } from '../utils/constants';

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
    if (!user?.uid || !userProfile?.username) return;

    setQuickMatchLoading(true);

    try {
      const rooms = await getActiveRooms({
        status: 'waiting',
        isPrivate: false,
      });

      const availableRoom = rooms.find(
        room => room.players.length < room.settings.maxPlayers
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
            winningScore: DEFAULT_WINNING_SCORE,
            isPrivate: false,
          }
        );
        navigation.navigate('GameRoom', { roomId });
      }
    } catch (error) {
      console.error('Error with quick match:', error);
    } finally {
      setQuickMatchLoading(false);
    }
  };

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={styles.container}>
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
              colors={COLORS.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.titleUnderline}
            />
          </View>
          
          <Text style={styles.tagline}>BATTLE OF WITS</Text>
          
          {/* User Info Card */}
          <Card variant="glass" style={styles.userCard}>
            <View style={styles.userInfo}>
              <View>
                <Text style={styles.welcomeText}>WELCOME BACK</Text>
                <Text style={styles.username}>{userProfile?.username || 'Player'}</Text>
              </View>
              <View style={styles.statsContainer}>
                <Badge text={`LVL ${userProfile?.level || 1}`} variant="gold" shine />
                <Badge 
                  text={userProfile?.rank || 'Silver III'} 
                  variant="rank" 
                  size="sm"
                />
              </View>
            </View>
          </Card>
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

        {/* Main Actions Grid */}
        <Animated.View
          style={[
            styles.actionsGrid,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Card variant="glow" onPress={() => navigation.navigate('BrowseRooms')}>
            <View style={styles.actionCard}>
              <Text style={styles.actionIcon}>🎲</Text>
              <Text style={styles.actionTitle}>BROWSE ROOMS</Text>
              <Text style={styles.actionSubtitle}>{activeRooms.length} Active</Text>
            </View>
          </Card>

          <Card variant="elevated" onPress={() => navigation.navigate('CreateRoom')}>
            <View style={styles.actionCard}>
              <Text style={styles.actionIcon}>➕</Text>
              <Text style={styles.actionTitle}>CREATE ROOM</Text>
              <Text style={styles.actionSubtitle}>Host Your Game</Text>
            </View>
          </Card>
        </Animated.View>

        {/* Live Rooms Section */}
        {activeRooms.length > 0 && (
          <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔥 LIVE ROOMS</Text>
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

        {/* Secondary Actions */}
        <Animated.View style={[styles.secondaryActions, { opacity: fadeAnim }]}>
          <Button
            title="👤 Profile"
            onPress={() => navigation.navigate('Profile')}
            variant="ghost"
            size="md"
          />
          <Button
            title="🏆 Leaderboard"
            onPress={() => navigation.navigate('Leaderboard')}
            variant="ghost"
            size="md"
          />
          <Button
            title="⚙️ Settings"
            onPress={() => navigation.navigate('Settings')}
            variant="ghost"
            size="md"
          />
        </Animated.View>
      </ScrollView>
    </View>
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
    padding: SPACING.lg,
    paddingBottom: SPACING['3xl'],
  },
  header: {
    marginBottom: SPACING.xl,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  gameTitle: {
    fontSize: TYPOGRAPHY.fontSize['5xl'],
    fontWeight: TYPOGRAPHY.fontWeight.black,
    color: COLORS.text,
    letterSpacing: 4,
    textAlign: 'center',
    textShadowColor: COLORS.primaryGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  titleUnderline: {
    height: 4,
    width: 120,
    borderRadius: RADIUS.full,
    marginTop: SPACING.xs,
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
  statsContainer: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  quickPlayContainer: {
    marginBottom: SPACING.xl,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  actionCard: {
    alignItems: 'center',
    padding: SPACING.lg,
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
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.text,
    letterSpacing: 1,
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
  secondaryActions: {
    gap: SPACING.sm,
  },
});
