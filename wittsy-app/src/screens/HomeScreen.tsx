import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Animated, Dimensions, Platform, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { useTheme } from '../hooks/useTheme';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay';
import { GameplayTutorial } from '../components/tutorial/GameplayTutorial';
import { DailyRewardModal } from '../components/DailyRewardModal';
import { dailyRewardsService } from '../services/dailyRewardsService';
import { TYPOGRAPHY, SPACING, RADIUS, ANIMATION } from '../utils/constants';
import { getActiveRooms, createRoom, joinRoom } from '../services/database';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { isUserAdmin } from '../utils/adminCheck';
import { getBrowsableRankedRooms } from '../services/matchmaking';
import { DEFAULT_SUBMISSION_TIME, DEFAULT_VOTING_TIME, WINNING_VOTES, MAX_PLAYERS } from '../utils/constants';

const { width } = Dimensions.get('window');

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const { unreadCount } = useNotifications();
  const { colors: COLORS } = useTheme();
  const [quickMatchLoading, setQuickMatchLoading] = useState(false);
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  const [selectedRoomType, setSelectedRoomType] = useState<'ranked' | 'casual' | null>('ranked');
  const [rankedRooms, setRankedRooms] = useState<any[]>([]);
  const [casualRooms, setCasualRooms] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [dailyRewardClaimedThisSession, setDailyRewardClaimedThisSession] = useState(false);
  
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  
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
          toValue: 1.02,
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
    
    // Load ranked rooms by default
    loadRankedRooms();
    
    // Check daily login reward will be handled by useFocusEffect
    
    // Check if user needs to see tutorial
    const checkTutorial = () => {
      if (userProfile && !userProfile.gameplayTutorialCompleted) {
        setTimeout(() => setShowTutorial(true), 1500);
      }
    };
    
    checkTutorial();
  }, [user, userProfile]);

  // Reload rooms when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadActiveRooms();
      checkDailyReward();
      // Reload the selected room type if one is active
      if (selectedRoomType === 'ranked') {
        loadRankedRooms();
      } else if (selectedRoomType === 'casual') {
        loadCasualRooms();
      }
    }, [selectedRoomType])
  );

  const checkDailyReward = async () => {
    if (!user) return;
    
    // Don't check again if already claimed this session
    if (dailyRewardClaimedThisSession) {
      console.log('Daily reward already claimed this session, skipping check');
      return;
    }
    
    try {
      // Check AsyncStorage for today's claim status
      const today = new Date().toDateString();
      const lastClaimDate = await AsyncStorage.getItem(`dailyReward_${user.uid}_lastClaim`);
      
      if (lastClaimDate === today) {
        console.log('Daily reward already claimed today (from AsyncStorage), skipping');
        setDailyRewardClaimedThisSession(true);
        return;
      }
      
      const status = await dailyRewardsService.canClaimToday(user.uid);
      if (status.canClaim && !status.alreadyClaimed) {
        // Show modal after a short delay for better UX
        setTimeout(() => {
          setShowDailyReward(true);
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to check daily reward:', error);
    }
  };

  const handleDailyRewardClaimed = async (coins: number, streak: number) => {
    // Mark as claimed this session to prevent re-appearing
    setDailyRewardClaimedThisSession(true);
    
    // Store claim date in AsyncStorage
    try {
      const today = new Date().toDateString();
      await AsyncStorage.setItem(`dailyReward_${user?.uid}_lastClaim`, today);
      console.log('✅ Daily reward claim date saved to AsyncStorage');
    } catch (error) {
      console.error('Failed to save claim date to AsyncStorage:', error);
    }
    
    // Close modal immediately
    setShowDailyReward(false);
    
    // Refresh user profile to update coin balance in real-time
    if (refreshUserProfile) {
      await refreshUserProfile();
    }
    
    console.log(`Daily reward claimed: ${coins} coins, ${streak} day streak`);
  };

  const loadActiveRooms = async () => {
    try {
      const rooms = await getActiveRooms({ isPrivate: false });
      setActiveRooms(rooms.slice(0, 5));
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const loadRankedRooms = async () => {
    setLoadingRooms(true);
    try {
      const userElo = 1000;
      const rooms = await getBrowsableRankedRooms(userElo);
      setRankedRooms(rooms);
    } catch (error) {
      console.error('Error loading ranked rooms:', error);
    } finally {
      setLoadingRooms(false);
    }
  };

  const loadCasualRooms = async () => {
    setLoadingRooms(true);
    try {
      const rooms = await getActiveRooms({ isPrivate: false, maxResults: 50 });
      setCasualRooms(rooms);
    } catch (error) {
      console.error('Error loading casual rooms:', error);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleTutorialComplete = async () => {
    setShowTutorial(false);
    if (user?.uid) {
      try {
        await updateDoc(doc(firestore, 'users', user.uid), {
          gameplayTutorialCompleted: true,
          gameplayTutorialCompletedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Failed to mark tutorial as completed:', error);
      }
    }
  };

  const handleTutorialSkip = async () => {
    setShowTutorial(false);
    if (user?.uid) {
      try {
        await updateDoc(doc(firestore, 'users', user.uid), {
          gameplayTutorialCompleted: true,
          gameplayTutorialSkipped: true,
          gameplayTutorialCompletedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Failed to mark tutorial as skipped:', error);
      }
    }
  };

  const handleRoomTypeSelect = (type: 'ranked' | 'casual') => {
    setSelectedRoomType(type);
    if (type === 'ranked') {
      loadRankedRooms();
    } else {
      loadCasualRooms();
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    if (!userProfile) return;
    try {
      await joinRoom(roomId, userProfile.uid, userProfile.username);
      navigation.navigate('GameRoom', { roomId });
    } catch (error: any) {
      // If user is already in room, just navigate to it
      if (error.message === 'Already in room') {
        navigation.navigate('GameRoom', { roomId });
      } else {
        Alert.alert('Error', error.message || 'Failed to join room');
      }
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
      <GameplayTutorial
        visible={showTutorial}
        onComplete={handleTutorialComplete}
        onSkip={handleTutorialSkip}
      />
      
      {user && (
        <DailyRewardModal
          visible={showDailyReward}
          userId={user.uid}
          onClose={() => setShowDailyReward(false)}
          onClaimed={handleDailyRewardClaimed}
        />
      )}
      
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              if (selectedRoomType === 'ranked') {
                await loadRankedRooms();
              } else if (selectedRoomType === 'casual') {
                await loadCasualRooms();
              }
              setRefreshing(false);
            }}
            tintColor="#FFFFFF"
            colors={['#A855F7']}
          />
        }
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
            <Animated.View style={{ transform: [{ rotate: '-25deg' }], position: 'absolute', top: 8, left: '10%' }}>
              <Text style={styles.battleOfTextInner}>Battle of</Text>
            </Animated.View>
            <Text style={styles.gameTitle}>Wittz</Text>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark] as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.titleUnderline}
            />
          </View>
          
          {/* Compact User Info */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.8}>
              <View style={styles.userInfoCompact}>
                <Text style={styles.usernameCompact}>{userProfile?.username || 'Player'}</Text>
                <Badge text={`LVL ${userProfile?.level || 1}`} variant="gold" size="sm" />
              </View>
            </TouchableOpacity>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.notificationBell}
                onPress={() => navigation.navigate('Notifications')}
              >
                <Text style={styles.bellIcon}>🔔</Text>
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <CurrencyDisplay variant="compact" showPremium={false} />
            </View>
          </View>
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
            onPress={() => navigation.navigate('QuickPlay')}
            variant="gold"
            size="xl"
            fullWidth
            loading={quickMatchLoading}
          />
        </Animated.View>

        {/* Main Actions - 3 Button Grid */}
        <Animated.View
          style={[
            styles.mainActionsGrid,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Card 
            variant={selectedRoomType === 'ranked' ? 'glow' : 'elevated'} 
            onPress={() => handleRoomTypeSelect('ranked')} 
            style={styles.mainActionCard}
          >
            <View style={styles.actionCard}>
              <Text style={styles.actionIcon}>🏆</Text>
              <Text style={styles.actionTitle}>RANKED GAMES</Text>
              <Text style={styles.actionSubtitle}>Competitive</Text>
            </View>
          </Card>

          <Card 
            variant={selectedRoomType === 'casual' ? 'glow' : 'elevated'} 
            onPress={() => handleRoomTypeSelect('casual')} 
            style={styles.mainActionCard}
          >
            <View style={styles.actionCard}>
              <Text style={styles.actionIcon}>🎲</Text>
              <Text style={styles.actionTitle}>CASUAL GAMES</Text>
              <Text style={styles.actionSubtitle}>Relaxed Play</Text>
            </View>
          </Card>

          <Card 
            variant="elevated" 
            onPress={() => navigation.navigate('CreateRoom')} 
            style={styles.mainActionCard}
          >
            <View style={styles.actionCard}>
              <Text style={styles.actionIcon}>➕</Text>
              <Text style={styles.actionTitle}>CREATE PRIVATE</Text>
              <Text style={styles.actionSubtitle}>Host Game</Text>
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
              onPress={() => navigation.navigate('StarredPhrases')}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.secondaryGradient}
              >
                <Text style={styles.secondaryIcon}>⭐</Text>
                <Text style={styles.secondaryTitle}>Starred Phrases</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryCard}
              onPress={() => navigation.navigate('BattlePass')}
            >
              <LinearGradient
                colors={['#FF6B6B', '#EE5A6F']}
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

            <TouchableOpacity 
              style={styles.secondaryCard}
              onPress={() => navigation.navigate('CoinShop')}
            >
              <LinearGradient
                colors={['#FFD700', '#FF8C00']}
                style={styles.secondaryGradient}
              >
                <Text style={styles.secondaryIcon}>💰</Text>
                <Text style={styles.secondaryTitle}>Coin Shop</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryCard}
              onPress={() => navigation.navigate('AvatarShop')}
            >
              <LinearGradient
                colors={['#9D50BB', '#6E48AA']}
                style={styles.secondaryGradient}
              >
                <Text style={styles.secondaryIcon}>🎨</Text>
                <Text style={styles.secondaryTitle}>Avatar Shop</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Admin Card - Only for admins */}
            {isUserAdmin(user) && (
              <TouchableOpacity 
                style={styles.secondaryCard}
                onPress={() => navigation.navigate('AdminConsole')}
              >
                <LinearGradient
                  colors={['#FF6B6B', '#C92A2A']}
                  style={styles.secondaryGradient}
                >
                  <Text style={styles.secondaryIcon}>⚙️</Text>
                  <Text style={styles.secondaryTitle}>Admin</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </ScrollView>
        </Animated.View>

        {/* Current Room Games Section - appears below Explore when button clicked */}
        {selectedRoomType && (
          <Animated.View style={[styles.roomListSection, { opacity: fadeAnim }]}>
            <Text style={styles.sectionTitle}>
              {selectedRoomType === 'ranked' ? 'Current Ranked Games' : 'Current Casual Games'}
            </Text>
            {loadingRooms ? (
              <Text style={styles.loadingText}>Loading rooms...</Text>
            ) : (
              <View style={styles.roomList}>
                {(selectedRoomType === 'ranked' ? rankedRooms : casualRooms).length === 0 ? (
                  <View style={styles.emptyRooms}>
                    <Text style={styles.emptyRoomsText}>
                      No {selectedRoomType} games available
                    </Text>
                    {selectedRoomType === 'ranked' && (
                      <Button
                        title="Quick Play"
                        onPress={() => navigation.navigate('QuickPlay')}
                        size="sm"
                        fullWidth
                        style={styles.emptyButton}
                      />
                    )}
                  </View>
                ) : (
                  (selectedRoomType === 'ranked' ? rankedRooms : casualRooms).map((room: any) => {
                    const isUserInRoom = room.players?.some((p: any) => p.userId === user?.uid);
                    const roomStatus = room.status === 'waiting' ? 'Waiting for players' : 'Started';
                    
                    return (
                      <TouchableOpacity
                        key={room.roomId}
                        style={styles.roomCard}
                        onPress={() => handleJoinRoom(room.roomId)}
                      >
                        <View style={styles.roomCardContent}>
                          <View style={styles.roomCardTop}>
                            <Text style={styles.roomCardName} numberOfLines={1} ellipsizeMode="tail">{room.name}</Text>
                            {isUserInRoom && (
                              <Badge text="YOU'RE IN" variant="success" size="sm" />
                            )}
                          </View>
                          <View style={styles.roomCardBottom}>
                            <Text style={styles.roomCardPlayers}>
                              👥 {room.players?.length || 0}/{room.settings.maxPlayers}
                            </Text>
                            <Text style={styles.roomCardStatus}>
                              {room.status === 'waiting' ? '⏳' : '🎮'} {roomStatus}
                            </Text>
                            {room.countdownStartedAt && room.countdownDuration && (
                              <Text style={styles.roomCardCountdown}>
                                ⏱️ Starting soon
                              </Text>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}
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

const createStyles = (COLORS: any) => StyleSheet.create({
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
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationBell: {
    position: 'relative',
  },
  bellIcon: {
    fontSize: 20,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
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
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
    position: 'relative',
    paddingVertical: SPACING.sm,
  },
  battleOfText: {
    fontSize: 28,
    fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'cursive',
    fontStyle: 'italic',
    color: COLORS.text,
    opacity: 0.85,
    position: 'absolute',
    top: 8,
    left: '10%',
  },
  battleOfTextInner: {
    fontSize: 28,
    fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'cursive',
    fontStyle: 'italic',
    color: COLORS.text,
    opacity: 0.85,
  },
  gameTitle: {
    fontSize: 42,
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
  createRoomContainer: {
    marginBottom: SPACING.md,
  },
    mainActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
    justifyContent: 'space-between',
  },
  mainActionCard: {
    flex: 1,
    minWidth: 110,
  },
  roomListSection: {
    marginBottom: SPACING.lg,
  },
  roomList: {
    gap: SPACING.sm,
  },
  roomCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xs,
  },
  roomCardContent: {
    gap: SPACING.xs,
  },
  roomCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  roomCardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  roomCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flexWrap: 'wrap',
  },
  roomCardPlayers: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  roomCardStatus: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  roomCardCountdown: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
  },
  emptyRooms: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  emptyRoomsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  emptyButton: {
    minWidth: 120,
    alignSelf: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    padding: SPACING.lg,
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
