import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Animated, Platform, TouchableOpacity, Alert } from 'react-native';
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
import { deepLinking } from '../services/deepLinking';
import { TYPOGRAPHY, SPACING, RADIUS, ANIMATION } from '../utils/constants';
import { getActiveRooms, createRoom, joinRoom, getUserActiveRoom, getUserActiveCasualRoom } from '../services/database';
import { getUserGroups, subscribeToGroupActiveRooms, joinGroupViaInviteCode } from '../services/groups';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { isUserAdmin } from '../utils/adminCheck';
import { getBrowsableRankedRooms } from '../services/matchmaking';
import { DEFAULT_SUBMISSION_TIME, DEFAULT_VOTING_TIME, WINNING_VOTES, MAX_PLAYERS } from '../utils/constants';

import { screenWidth, contentWidth, isTablet, isLargeTablet, tabletContentStyle, tabletHorizontalPadding, scaleFontSize, scaleIconSize, getLineHeight } from '../utils/responsive';
const width = contentWidth;


export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const { unreadCount } = useNotifications();
  const { colors: COLORS } = useTheme();
  const [quickMatchLoading, setQuickMatchLoading] = useState(false);
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  const [userActiveRoom, setUserActiveRoom] = useState<any | null>(null);
  const [userActiveCasualRoom, setUserActiveCasualRoom] = useState<any | null>(null);
  const [selectedRoomType, setSelectedRoomType] = useState<'ranked' | 'casual' | null>('casual');
  const [rankedRooms, setRankedRooms] = useState<any[]>([]);
  const [casualRooms, setCasualRooms] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [dailyRewardClaimedThisSession, setDailyRewardClaimedThisSession] = useState(false);
  const dailyRewardCheckedRef = useRef(false);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [groupActiveRooms, setGroupActiveRooms] = useState<{ [groupId: string]: any[] }>({});
  const groupRoomUnsubscribers = useRef<(() => void)[]>([]);
  
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Shimmer animation - runs independently to prevent interruption
  useEffect(() => {
    const shimmerLoop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    shimmerLoop.start();
    
    return () => shimmerLoop.stop();
  }, []); // Empty dependency array - runs once and never stops

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

    // Load active rooms on mount
    loadActiveRooms();
    
    // Load user's active rooms
    loadUserActiveRoom();
    loadUserActiveCasualRoom();
    
    // Load casual rooms by default
    loadCasualRooms();
    
    // Check daily login reward will be handled by useFocusEffect
    
    // Check if user needs to see tutorial
    const checkTutorial = () => {
      if (userProfile && !userProfile.gameplayTutorialCompleted) {
        setTimeout(() => setShowTutorial(true), 1500);
      }
    };
    
    checkTutorial();
  }, [user, userProfile]);

  // Handle deep links for game room invites
  useEffect(() => {
    if (!user || !userProfile) return;

    const handleDeepLinkConfig = async (config: any) => {
      console.log('🔗 HomeScreen received deep link:', config);
      
      // Handle group invite deep links
      if (config.screen === 'Groups' && config.params?.inviteCode) {
        const { inviteCode } = config.params;
        try {
          const result = await joinGroupViaInviteCode(inviteCode, user.uid, userProfile.username);
          if (result.success && result.groupId) {
            navigation.navigate('GroupDetail', { groupId: result.groupId });
          } else {
            Alert.alert('Error', result.error || 'Invalid group invite code');
          }
        } catch (error: any) {
          Alert.alert('Error', error.message || 'Failed to join group');
        }
        return;
      }

      // Only handle GameRoom deep links
      if (config.screen === 'GameRoom' && config.params?.roomId) {
        const roomId = config.params.roomId;
        console.log('🎮 Attempting to join room from deep link:', roomId);
        
        try {
          // Join the room first
          await joinRoom(roomId, user.uid, userProfile.username);
          console.log('✅ Successfully joined room, navigating...');
          
          // Then navigate
          navigation.navigate('GameRoom', { roomId });
        } catch (error: any) {
          console.error('❌ Failed to join room from deep link:', error);
          
          // If already in room, just navigate
          if (error.message === 'Already in room') {
            console.log('ℹ️ Already in room, navigating anyway...');
            navigation.navigate('GameRoom', { roomId });
          } else {
            Alert.alert('Error', error.message || 'Failed to join room');
          }
        }
      }
    };

    deepLinking.addListener(handleDeepLinkConfig);

    return () => {
      deepLinking.removeListener(handleDeepLinkConfig);
    };
  }, [user, userProfile, navigation]);

  // Reload rooms when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadActiveRooms();
      loadUserActiveRoom();
      loadUserActiveCasualRoom();
      checkDailyReward();
      // Reload the selected room type if one is active
      if (selectedRoomType === 'ranked') {
        loadRankedRooms();
      } else if (selectedRoomType === 'casual') {
        loadCasualRooms();
      }
      // Load groups and subscribe to their active rooms
      if (user) {
        getUserGroups(user.uid).then((groups) => {
          setUserGroups(groups);
          // Tear down previous subscriptions
          groupRoomUnsubscribers.current.forEach((unsub) => unsub());
          groupRoomUnsubscribers.current = [];
          // Subscribe to active rooms per group
          groups.forEach((group) => {
            const unsub = subscribeToGroupActiveRooms(group.id, (rooms) => {
              setGroupActiveRooms((prev) => ({ ...prev, [group.id]: rooms }));
            });
            groupRoomUnsubscribers.current.push(unsub);
          });
        });
      }
      return () => {
        groupRoomUnsubscribers.current.forEach((unsub) => unsub());
        groupRoomUnsubscribers.current = [];
      };
    }, [selectedRoomType, user])
  );

  const checkDailyReward = async () => {
    if (!user) return;
    
    // CRITICAL: Only check once per app session using ref
    if (dailyRewardCheckedRef.current) {
      return;
    }
    
    // Don't check again if already claimed this session OR if modal is already showing
    if (dailyRewardClaimedThisSession || showDailyReward) {
      return;
    }
    
    // Mark as checked immediately to prevent race conditions
    dailyRewardCheckedRef.current = true;
    
    try {
      // Check AsyncStorage for today's claim status
      const today = new Date().toDateString();
      const lastClaimDate = await AsyncStorage.getItem(`dailyReward_${user.uid}_lastClaim`);
      
      if (lastClaimDate === today) {
        setDailyRewardClaimedThisSession(true);
        return;
      }
      
      const status = await dailyRewardsService.canClaimToday(user.uid);
      if (status.canClaim && !status.alreadyClaimed && !showDailyReward) {
        // Show modal after a short delay for better UX
        setTimeout(() => {
          if (!showDailyReward && !dailyRewardClaimedThisSession) {
            setShowDailyReward(true);
          }
        }, 1000);
      }
    } catch (error) {
      // Silently handle errors
    }
  };

  const handleDailyRewardClaimed = async (coins: number, streak: number) => {
    console.log(`🎁 Daily reward claimed: ${coins} coins, streak ${streak}`);
    
    // Close modal immediately and mark as claimed
    setShowDailyReward(false);
    setDailyRewardClaimedThisSession(true);
    dailyRewardCheckedRef.current = true;
    
    // Store claim date in AsyncStorage
    try {
      const today = new Date().toDateString();
      await AsyncStorage.setItem(`dailyReward_${user?.uid}_lastClaim`, today);
    } catch (error) {
      console.error('Failed to save claim date:', error);
    }
    
    console.log('🔄 Refreshing user profile...');
    // Force immediate refresh to update coin display
    if (refreshUserProfile) {
      await refreshUserProfile();
      console.log('✅ User profile refreshed - coins should update');
    } else {
      console.error('⚠️ refreshUserProfile not available');
    }
  };

  const loadActiveRooms = async () => {
    try {
      const rooms = await getActiveRooms({ isPrivate: false });
      setActiveRooms(rooms.filter((r: any) => !r.groupId).slice(0, 5));
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const loadUserActiveRoom = async () => {
    if (!user?.uid) return;
    try {
      const room = await getUserActiveRoom(user.uid);
      setUserActiveRoom(room);
      console.log('👤 User active ranked room:', room ? room.roomId : 'none');
    } catch (error) {
      console.error('Error loading user active room:', error);
    }
  };

  const loadUserActiveCasualRoom = async () => {
    if (!user?.uid) return;
    try {
      const room = await getUserActiveCasualRoom(user.uid);
      setUserActiveCasualRoom(room);
      console.log('👤 User active casual room:', room ? room.roomId : 'none');
    } catch (error) {
      console.error('Error loading user active casual room:', error);
    }
  };

  const loadRankedRooms = async () => {
    setLoadingRooms(true);
    try {
      const userElo = userProfile?.rating || 1000;
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
      setCasualRooms(rooms.filter((r: any) => !r.groupId));
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

  const handleJoinByCode = () => {
    Alert.prompt(
      'Join Room',
      'Enter the 6-digit room code:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Join',
          onPress: async (code?: string) => {
            if (!code || code.trim().length === 0) {
              Alert.alert('Invalid Code', 'Please enter a valid 6-digit room code');
              return;
            }
            
            const roomCode = code.trim().toUpperCase();
            console.log('🔑 Attempting to join room with 6-digit code:', roomCode);
            
            try {
              // Look up room by roomCode using dedicated function
              const { getRoomByCode } = await import('../services/database');
              const matchingRoom = await getRoomByCode(roomCode);
              
              if (matchingRoom) {
                console.log('✅ Found room with code:', roomCode, 'Room ID:', matchingRoom.roomId);
                await handleJoinRoom(matchingRoom.roomId);
              } else {
                console.error('❌ No room found with code:', roomCode);
                Alert.alert('Room Not Found', `No active room found with code: ${roomCode}`);
              }
            } catch (error: any) {
              console.error('❌ Error joining by code:', error);
              Alert.alert('Error', 'Failed to join room. Please try again.');
            }
          },
        },
      ],
      'plain-text'
    );
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
        room => !room.groupId &&
        room.players.length < room.settings.maxPlayers &&
        !room.players.find((p: any) => p.userId === user.uid)
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
          },
          false // isRanked = false for casual games
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
    outputRange: [-screenWidth, screenWidth],
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
            <Text style={styles.battleOfTextInner}>Battle of</Text>
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
            title="➕ CREATE ROOM"
            onPress={() => navigation.navigate('CreateRoom')}
            variant="gold"
            size="xl"
            fullWidth
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
            variant={selectedRoomType === 'casual' ? 'glow' : 'elevated'} 
            onPress={() => handleRoomTypeSelect('casual')} 
            style={styles.mainActionCard}
          >
            <View style={styles.actionCard}>
              <Text style={styles.actionIcon}>🎲</Text>
              <Text style={styles.actionTitle} adjustsFontSizeToFit minimumFontScale={0.7}>CASUAL LOBBY</Text>
              <Text style={styles.actionSubtitle} adjustsFontSizeToFit minimumFontScale={0.8}>Join Public Games</Text>
            </View>
          </Card>

          <Card 
            variant={selectedRoomType === 'ranked' ? 'glow' : 'elevated'} 
            onPress={() => handleRoomTypeSelect('ranked')} 
            style={styles.mainActionCard}
          >
            <View style={styles.actionCard}>
              <Text style={styles.actionIcon}>🏆</Text>
              <Text style={styles.actionTitle} adjustsFontSizeToFit minimumFontScale={0.7}>RANKED LOBBY</Text>
              <Text style={styles.actionSubtitle} adjustsFontSizeToFit minimumFontScale={0.8}>Competitive Play</Text>
            </View>
          </Card>

          <Card 
            variant="elevated" 
            onPress={() => navigation.navigate('QuickPlay')} 
            style={styles.mainActionCard}
          >
            <View style={styles.actionCard}>
              <Text style={styles.actionIcon}>⚡</Text>
              <Text style={styles.actionTitle} adjustsFontSizeToFit minimumFontScale={0.7}>QUICK MATCH</Text>
              <Text style={styles.actionSubtitle} adjustsFontSizeToFit minimumFontScale={0.8}>Auto-Match Ranked</Text>
            </View>
          </Card>
        </Animated.View>

        {/* Join by Code - Thin Full Width Card */}
        <Animated.View style={[{ opacity: fadeAnim, marginBottom: SPACING.lg }]}>
          <Card variant="elevated">
            <TouchableOpacity 
              onPress={handleJoinByCode}
              style={styles.joinByCodeCard}
              activeOpacity={0.7}
            >
              <Text style={styles.joinByCodeIcon}>🔑</Text>
              <View style={styles.joinByCodeTextContainer}>
                <Text style={styles.joinByCodeTitle}>Join by Room Code</Text>
                <Text style={styles.joinByCodeSubtitle}>Enter 6-digit code from invite</Text>
              </View>
              <Text style={styles.joinByCodeArrow}>›</Text>
            </TouchableOpacity>
          </Card>
        </Animated.View>

        {/* Secondary Features - Horizontal Scroll */}
        <Animated.View style={[styles.secondarySection, { opacity: fadeAnim }]}>
          <Text style={[styles.sectionTitle, { marginBottom: SPACING.md }]}>Explore</Text>
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
                colors={['#FFB800', '#FF8C00']}
                style={styles.secondaryGradient}
              >
                <Text style={styles.secondaryIcon}>⭐</Text>
                <Text style={styles.secondaryTitle} numberOfLines={0}>Starred Phrases</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryCard}
              onPress={() => navigation.navigate('Friends')}
            >
              <LinearGradient
                colors={['#26A69A', '#00897B']}
                style={styles.secondaryGradient}
              >
                <Text style={styles.secondaryIcon}>👥</Text>
                <Text style={styles.secondaryTitle} numberOfLines={0}>Friends</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryCard}
              onPress={() => navigation.navigate('Groups')}
            >
              <LinearGradient
                colors={['#5C6BC0', '#3949AB']}
                style={styles.secondaryGradient}
              >
                <Text style={styles.secondaryIcon}>🏘️</Text>
                <Text style={styles.secondaryTitle} numberOfLines={0}>Groups</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryCard}
              onPress={() => navigation.navigate('AvatarCreator')}
            >
              <LinearGradient
                colors={['#E74C3C', '#C0392B']}
                style={styles.secondaryGradient}
              >
                <Text style={styles.secondaryIcon}>🎨</Text>
                <Text style={styles.secondaryTitle} numberOfLines={0}>Avatar Creator</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryCard}
              onPress={() => navigation.navigate('AvatarShop')}
            >
              <LinearGradient
                colors={['#AB47BC', '#8E24AA']}
                style={styles.secondaryGradient}
              >
                <Text style={styles.secondaryIcon}>👤</Text>
                <Text style={styles.secondaryTitle} numberOfLines={0}>Avatar Shop</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryCard}
              onPress={() => navigation.navigate('CoinShop')}
            >
              <LinearGradient
                colors={['#FFA726', '#F57C00']}
                style={styles.secondaryGradient}
              >
                <Text style={styles.secondaryIcon}>💰</Text>
                <Text style={styles.secondaryTitle} numberOfLines={0}>Coin Shop</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryCard}
              onPress={() => navigation.navigate('BattlePass')}
            >
              <LinearGradient
                colors={['#9B59B6', '#8E44AD']}
                style={styles.secondaryGradient}
              >
                <Text style={styles.secondaryIcon}>⚔️</Text>
                <Text style={styles.secondaryTitle} numberOfLines={0}>Battle Pass</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryCard}
              onPress={() => navigation.navigate('PromptLibrary')}
            >
              <LinearGradient
                colors={['#5B7FDB', '#4A5FC1']}
                style={styles.secondaryGradient}
              >
                <Text style={styles.secondaryIcon}>📚</Text>
                <Text style={styles.secondaryTitle} numberOfLines={0}>Prompts</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryCard}
              onPress={() => navigation.navigate('Challenges')}
            >
              <LinearGradient
                colors={['#EC407A', '#D81B60']}
                style={styles.secondaryGradient}
              >
                <Text style={styles.secondaryIcon}>🎯</Text>
                <Text style={styles.secondaryTitle} numberOfLines={0}>Challenges</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryCard}
              onPress={() => navigation.navigate('Events')}
            >
              <LinearGradient
                colors={['#29B6F6', '#0288D1']}
                style={styles.secondaryGradient}
              >
                <Text style={styles.secondaryIcon}>🏆</Text>
                <Text style={styles.secondaryTitle} numberOfLines={0}>Events</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Admin Card - Only for admins */}
            {isUserAdmin(user) && (
              <TouchableOpacity
                style={styles.secondaryCard}
                onPress={() => navigation.navigate('AdminConsole')}
              >
                <LinearGradient
                  colors={['#EF5350', '#C62828']}
                  style={styles.secondaryGradient}
                >
                  <Text style={styles.secondaryIcon}>⚙️</Text>
                  <Text style={styles.secondaryTitle} numberOfLines={0}>Admin</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </ScrollView>
        </Animated.View>

        {/* Active Ranked Game Section - shows if user is in an active ranked room AND not viewing casual games */}
        {userActiveRoom && selectedRoomType !== 'casual' && (
          <Animated.View style={[styles.activeGameSection, { opacity: fadeAnim }]}>
            <Text style={[styles.sectionTitle, { marginBottom: SPACING.md }]}>
              Active Ranked Game
            </Text>
            <View style={styles.roomList}>
              <TouchableOpacity
                style={styles.activeGameCard}
                onPress={() => navigation.navigate('GameRoom', { roomId: userActiveRoom.roomId })}
                activeOpacity={0.8}
              >
                <View style={styles.roomCardHeader}>
                  <View style={styles.roomCardTitleRow}>
                    <Text style={styles.roomCardName}>{userActiveRoom.name}</Text>
                    <Badge text="ACTIVE" variant="success" size="sm" />
                  </View>
                  <Text style={styles.roomCardPlayers}>
                    👥 {userActiveRoom.players?.length || 0}/{userActiveRoom.settings?.maxPlayers || 12}
                  </Text>
                </View>
                <View style={styles.roomCardFooter}>
                  <Text style={styles.roomCardStatus}>
                    {userActiveRoom.status === 'waiting' ? '⏳ Waiting to start' : '🎯 Game in progress'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Active Casual Game Section - shows if user is in an active casual room AND viewing casual games */}
        {userActiveCasualRoom && selectedRoomType === 'casual' && (
          <Animated.View style={[styles.activeGameSection, { opacity: fadeAnim }]}>
            <Text style={[styles.sectionTitle, { marginBottom: SPACING.md }]}>
              Active Casual Game
            </Text>
            <View style={styles.roomList}>
              <TouchableOpacity
                style={styles.activeGameCard}
                onPress={() => navigation.navigate('GameRoom', { roomId: userActiveCasualRoom.roomId })}
                activeOpacity={0.8}
              >
                <View style={styles.roomCardHeader}>
                  <View style={styles.roomCardTitleRow}>
                    <Text style={styles.roomCardName}>{userActiveCasualRoom.name}</Text>
                    <Badge text="ACTIVE" variant="success" size="sm" />
                  </View>
                  <Text style={styles.roomCardPlayers}>
                    👥 {userActiveCasualRoom.players?.length || 0}/{userActiveCasualRoom.settings?.maxPlayers || 12}
                  </Text>
                </View>
                <View style={styles.roomCardFooter}>
                  <Text style={styles.roomCardStatus}>
                    {userActiveCasualRoom.status === 'waiting' ? '⏳ Waiting to start' : '🎯 Game in progress'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Group Games Sections — one per group the user belongs to */}
        {userGroups.map((group) => {
          const rooms = groupActiveRooms[group.id] || [];
          if (rooms.length === 0) return null;
          return (
            <Animated.View key={group.id} style={[styles.activeGameSection, { opacity: fadeAnim }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md }}>
                <Text style={styles.sectionTitle}>🏘️ {group.name} — Group Games</Text>
                <TouchableOpacity onPress={() => navigation.navigate('GroupDetail', { groupId: group.id })}>
                  <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: '600' }}>View Group</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.roomList}>
                {rooms.map((room: any) => {
                  const alreadyIn = room.players?.some((p: any) => p.userId === user?.uid);
                  return (
                    <TouchableOpacity
                      key={room.roomId}
                      style={styles.activeGameCard}
                      onPress={() => {
                        if (alreadyIn) {
                          navigation.navigate('GameRoom', { roomId: room.roomId });
                        } else {
                          handleJoinRoom(room.roomId);
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.roomCardHeader}>
                        <View style={styles.roomCardTitleRow}>
                          <Text style={styles.roomCardName}>{room.name}</Text>
                          {alreadyIn && <Badge text="YOU'RE IN" variant="success" size="sm" />}
                        </View>
                        <Text style={styles.roomCardPlayers}>
                          👥 {room.players?.length || 0}/{room.settings?.maxPlayers || 12}
                        </Text>
                      </View>
                      <View style={styles.roomCardFooter}>
                        <Text style={styles.roomCardStatus}>
                          {room.status === 'waiting' ? '⏳ Waiting to start' : '🎯 Game in progress'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          );
        })}

        {/* Current Room Games Section - appears below Explore when button clicked */}
        {selectedRoomType && (
          <Animated.View style={[styles.roomListSection, { opacity: fadeAnim }]}>
            <Text style={[styles.sectionTitle, { marginBottom: SPACING.md }]}>
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
                        onPress={() => {
                          // If user is already in the room, navigate directly without trying to join
                          if (isUserInRoom) {
                            navigation.navigate('GameRoom', { roomId: room.roomId });
                          } else {
                            handleJoinRoom(room.roomId);
                          }
                        }}
                      >
                        <View style={styles.roomCardHeader}>
                          <View style={styles.roomCardTitleRow}>
                            <Text style={styles.roomCardName}>{room.name}</Text>
                            {isUserInRoom && (
                              <Badge text="YOU'RE IN" variant="success" size="sm" />
                            )}
                          </View>
                          <Text style={styles.roomCardPlayers}>
                            👥 {room.players?.length || 0}/{room.settings.maxPlayers}
                          </Text>
                        </View>
                        <View style={styles.roomCardFooter}>
                          <Text style={styles.roomCardStatus}>
                            {room.status === 'waiting' ? '⏳' : '🎮'} {roomStatus}
                          </Text>
                          {room.countdownStartedAt && room.countdownDuration && (
                            <Text style={styles.roomCardCountdown}>
                              ⏱️ Starting soon
                            </Text>
                          )}
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
    width: screenWidth * 0.3,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    transform: [{ skewX: '-20deg' }],
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.sm,
    paddingHorizontal: SPACING.sm + tabletHorizontalPadding,
    paddingBottom: 200,
  },
  header: {
    marginBottom: SPACING.md,
    marginTop: SPACING.xs,
    paddingVertical: SPACING.xs,
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
    fontSize: scaleFontSize(20),
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
    fontSize: scaleFontSize(10),
    fontWeight: 'bold',
  },
  userInfoCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  usernameCompact: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xl),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    lineHeight: getLineHeight(scaleFontSize(TYPOGRAPHY.fontSize.xl)),
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
    position: 'relative',
    paddingVertical: 0,
  },
  battleOfText: {
    fontSize: scaleFontSize(28),
    fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'cursive',
    fontStyle: 'italic',
    color: COLORS.text,
    opacity: 0.85,
    position: 'absolute',
    top: 8,
    left: '10%',
  },
  battleOfTextInner: {
    fontSize: scaleFontSize(28),
    fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'cursive',
    fontStyle: 'italic',
    color: COLORS.text,
    opacity: 0.85,
    textAlign: 'center',
    marginBottom: 2,
  },
  gameTitle: {
    fontSize: scaleFontSize(42),
    fontWeight: TYPOGRAPHY.fontWeight.black,
    color: COLORS.text,
    letterSpacing: 3,
    textAlign: 'center',
    textShadowColor: COLORS.primaryGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    lineHeight: getLineHeight(scaleFontSize(42)),
  },
  titleUnderline: {
    height: 3,
    width: 100,
    borderRadius: RADIUS.full,
    marginTop: 4,
  },
  tagline: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textTertiary,
    textAlign: 'center',
    letterSpacing: 3,
    marginBottom: SPACING.lg,
    lineHeight: getLineHeight(scaleFontSize(TYPOGRAPHY.fontSize.base)),
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
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textTertiary,
    letterSpacing: 1,
    marginBottom: SPACING.xxs,
  },
  username: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize['2xl']),
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.text,
  },
  viewProfile: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
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
  activeGameSection: {
    marginBottom: SPACING.lg,
  },
  activeGameCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
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
  roomCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  roomCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flex: 1,
  },
  roomCardName: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  roomCardPlayers: {
    fontSize: scaleFontSize(14),
    color: 'rgba(255, 255, 255, 0.8)',
  },
  roomCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  roomCardStatus: {
    fontSize: scaleFontSize(13),
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  roomCardCountdown: {
    fontSize: scaleFontSize(12),
    color: '#FFD700',
    fontWeight: '600',
  },
  emptyRooms: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  emptyRoomsText: {
    fontSize: scaleFontSize(14),
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  emptyButton: {
    minWidth: 120,
    alignSelf: 'center',
  },
  loadingText: {
    fontSize: scaleFontSize(14),
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
    width: isLargeTablet ? 140 : isTablet ? 120 : 100,
    height: isLargeTablet ? 140 : isTablet ? 120 : 100,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginRight: SPACING.sm,
  },
  secondaryGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: isTablet ? SPACING.md : SPACING.sm,
  },
  secondaryIcon: {
    fontSize: scaleIconSize(36),
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  secondaryTitle: {
    fontSize: scaleFontSize(13),
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: getLineHeight(scaleFontSize(13)),
    flexWrap: 'wrap',
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
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.lg),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    letterSpacing: 0.5,
    lineHeight: getLineHeight(scaleFontSize(TYPOGRAPHY.fontSize.lg)),
  },
  actionIcon: {
    fontSize: scaleIconSize(48),
    marginBottom: SPACING.sm,
  },
  actionTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xxs,
    letterSpacing: 0.5,
    lineHeight: getLineHeight(scaleFontSize(TYPOGRAPHY.fontSize.base)),
  },
  actionSubtitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: getLineHeight(scaleFontSize(TYPOGRAPHY.fontSize.xs)),
  },
  roomName: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.md),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.xxs,
    lineHeight: getLineHeight(scaleFontSize(TYPOGRAPHY.fontSize.md)),
  },
  roomHost: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.textSecondary,
    lineHeight: getLineHeight(scaleFontSize(TYPOGRAPHY.fontSize.sm)),
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
    fontSize: scaleFontSize(24),
    marginBottom: SPACING.xxs,
  },
  navLabel: {
    fontSize: scaleFontSize(10),
    color: COLORS.text,
    fontWeight: '600',
  },
  joinByCodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  joinByCodeIcon: {
    fontSize: scaleFontSize(20),
  },
  joinByCodeTextContainer: {
    flex: 1,
  },
  joinByCodeTitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    lineHeight: getLineHeight(scaleFontSize(TYPOGRAPHY.fontSize.base)),
  },
  joinByCodeSubtitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.textSecondary,
    lineHeight: getLineHeight(scaleFontSize(TYPOGRAPHY.fontSize.sm)),
  },
  joinByCodeArrow: {
    fontSize: scaleFontSize(20),
    color: COLORS.textTertiary,
  },
});
