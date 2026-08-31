import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { getActiveRooms, joinRoom } from '../services/database';
import { getBrowsableRankedRooms } from '../services/matchmaking';
import { Button } from '../components/common/Button';
import { Loading } from '../components/common/Loading';
import { Room } from '../types';
import { useTheme } from '../hooks/useTheme';
import { BackButton } from '../components/common/BackButton';;
import { tabletHorizontalPadding } from '../utils/responsive';

export const BrowseRoomsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors: COLORS } = useTheme();
  const { userProfile } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [roomType, setRoomType] = useState<'ranked' | 'casual'>('ranked');

  const loadRooms = async () => {
    try {
      let activeRooms: Room[];
      if (roomType === 'ranked') {
        // Get user's ELO from profile, default to the new-profile rating
        const userElo = (userProfile as any)?.rankedRating || userProfile?.rating || 1200;
        activeRooms = await getBrowsableRankedRooms(userElo);
      } else {
        const all = await getActiveRooms({ isPrivate: false, maxResults: 50 });
        activeRooms = all.filter((r: any) => !r.groupId);
      }
      setRooms(activeRooms);
      setLoadFailed(false);
    } catch (error: any) {
      console.error('Error loading rooms:', error);
      // Inline banner instead of an alert — this runs on a 5s interval,
      // so a modal here would spam the user while offline.
      setLoadFailed(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);


  useEffect(() => {
    loadRooms();

    // Refresh every 5 seconds
    const interval = setInterval(loadRooms, 5000);
    return () => clearInterval(interval);
  }, [roomType]);

  // Reload rooms when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadRooms();
      // roomType dependency keeps this from refetching with a stale tab
      // after navigating away and back
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomType])
  );

  const handleJoinRoom = async (room: Room) => {
    if (!userProfile) return;

    try {
      await joinRoom(room.roomId, userProfile.uid, userProfile.username);
      // Navigate to game room
      navigation.navigate('GameRoom', { roomId: room.roomId });
    } catch (error: any) {
      if (error?.code === 'ALREADY_IN_ROOM' || error.message === 'Already in room') {
        // Already a member — just take them back into their game
        navigation.navigate('GameRoom', { roomId: room.roomId });
        return;
      }
      Alert.alert('Error', error.message || 'Failed to join room');
    }
  };

  const renderRoom = ({ item }: { item: Room }) => {
    const playerCount = item.players?.length || 0;
    const maxPlayers = item.settings.maxPlayers;
    const countdown = getCountdownRemaining(item);
    const isFull = playerCount >= maxPlayers;
    const countdownFinished = countdown !== null && countdown === 0;

    return (
      <TouchableOpacity
        style={styles.roomCard}
        onPress={() => !isFull && !countdownFinished && handleJoinRoom(item)}
        disabled={isFull || countdownFinished}
      >
        <View style={styles.roomHeader}>
          <Text style={styles.roomName}>{item.name}</Text>
          <View style={[styles.statusBadge, item.status === 'waiting' ? styles.waitingBadge : styles.activeBadge]}>
            <Text style={[styles.statusText, { color: item.status === 'waiting' ? COLORS.warning : COLORS.success }]}>
              {item.status === 'waiting' ? 'Waiting' : 'In Progress'}
            </Text>
          </View>
        </View>
        
        <View style={styles.roomInfo}>
          <Text style={styles.infoText}>👥 {playerCount}/{maxPlayers} players</Text>
          <Text style={styles.infoText}>⏱️ {item.settings.submissionTime}s rounds</Text>
          {countdown !== null && countdown > 0 && (
            <Text style={styles.countdownText}>🕐 Starts in {countdown}s</Text>
          )}
        </View>

        <Button
          title={countdownFinished ? 'Game Started' : isFull ? 'Room Full' : 'Join Room'}
          onPress={() => handleJoinRoom(item)}
          disabled={isFull || countdownFinished}
          variant={isFull || countdownFinished ? 'outline' : 'primary'}
          size="sm"
          style={styles.joinButton}
        />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <Loading />;
  }

  const getCountdownRemaining = (room: Room): number | null => {
    if (!room.countdownStartedAt || !room.countdownDuration) return null;
    
    const startTime = new Date(room.countdownStartedAt).getTime();
    const elapsed = (Date.now() - startTime) / 1000;
    const remaining = room.countdownDuration - elapsed;
    
    return remaining > 0 ? Math.ceil(remaining) : 0;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with tabs */}
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Live Rooms</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tab selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, roomType === 'ranked' && styles.activeTab]}
          onPress={() => setRoomType('ranked')}
        >
          <Text style={[styles.tabText, roomType === 'ranked' && styles.activeTabText]}>
            🏆 Ranked Rooms
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, roomType === 'casual' && styles.activeTab]}
          onPress={() => setRoomType('casual')}
        >
          <Text style={[styles.tabText, roomType === 'casual' && styles.activeTabText]}>
            🎲 Casual Rooms
          </Text>
        </TouchableOpacity>
      </View>

      {loadFailed && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>
            Couldn't refresh rooms. Check your connection — we'll keep retrying.
          </Text>
        </View>
      )}

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.roomId}
        renderItem={renderRoom}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            loadRooms();
          }} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{roomType === 'ranked' ? '🏆' : '🎲'}</Text>
            <Text style={styles.emptyText}>
              No {roomType === 'ranked' ? 'ranked' : 'casual'} rooms available
            </Text>
            <Text style={styles.emptySubtext}>
              {roomType === 'ranked' 
                ? 'Try Quick Play to create a new ranked game!' 
                : 'Create your own casual room to get started!'}
            </Text>
            {roomType === 'casual' && (
              <Button
                title="Create Casual Room"
                onPress={() => navigation.navigate('CreateRoom')}
                size="md"
                style={styles.createButton}
              />
            )}
            {roomType === 'ranked' && (
              <Button
                title="Quick Play"
                onPress={() => navigation.navigate('QuickPlay')}
                size="md"
                style={styles.createButton}
              />
            )}
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.primary || '#6C63FF',
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface || '#F5F5F5',
    padding: 4,
    margin: 12,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: COLORS.surfaceActive || COLORS.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary || '#666',
  },
  activeTabText: {
    color: COLORS.primary || '#6C63FF',
  },
  listContent: {
    padding: 12,
    paddingHorizontal: 12 + tabletHorizontalPadding,
  },
  roomCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border || 'rgba(255, 255, 255, 0.08)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41
  },
  errorBanner: {
    marginHorizontal: 12,
    marginBottom: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: (COLORS.error || '#EF4444') + '20',
    borderWidth: 1,
    borderColor: (COLORS.error || '#EF4444') + '40',
  },
  errorBannerText: {
    fontSize: 13,
    color: COLORS.error || '#EF4444',
    textAlign: 'center',
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  roomName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  waitingBadge: {
    backgroundColor: COLORS.warning + '20',
  },
  activeBadge: {
    backgroundColor: COLORS.success + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600'
  },
  roomInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary
  },
  countdownText: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  joinButton: {
    marginTop: 8,
    height: 40
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center'
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 32,
    textAlign: 'center'
  },
  createButton: {
    width: 200,
    height: 48
  }
});

