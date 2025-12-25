import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { getActiveRooms, joinRoom } from '../services/database';
import { Button } from '../components/common/Button';
import { Loading } from '../components/common/Loading';
import { Room } from '../types';
import { useTheme } from '../hooks/useTheme';;

export const BrowseRoomsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors: COLORS } = useTheme();
  const { userProfile } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRooms = async () => {
    try {
      const activeRooms = await getActiveRooms({ isPrivate: false, maxResults: 50 });
      setRooms(activeRooms);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load rooms');
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
  }, []);

  // Reload rooms when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadRooms();
    }, [])
  );

  const handleJoinRoom = async (room: Room) => {
    if (!userProfile) return;
    
    try {
      await joinRoom(room.roomId, userProfile.uid, userProfile.username);
      // Navigate to game room
      navigation.navigate('GameRoom', { roomId: room.roomId });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to join room');
    }
  };

  const renderRoom = ({ item }: { item: Room }) => {
    const playerCount = item.players?.length || 0;
    const maxPlayers = item.settings.maxPlayers;
    const isFull = playerCount >= maxPlayers;

    return (
      <TouchableOpacity
        style={styles.roomCard}
        onPress={() => !isFull && handleJoinRoom(item)}
        disabled={isFull}
      >
        <View style={styles.roomHeader}>
          <Text style={styles.roomName}>{item.name}</Text>
          <View style={[styles.statusBadge, item.status === 'waiting' ? styles.waitingBadge : styles.activeBadge]}>
            <Text style={styles.statusText}>
              {item.status === 'waiting' ? 'Waiting' : 'In Progress'}
            </Text>
          </View>
        </View>
        
        <View style={styles.roomInfo}>
          <Text style={styles.infoText}>👥 {playerCount}/{maxPlayers} players</Text>
          <Text style={styles.infoText}>⏱️ {item.settings.submissionTime}s rounds</Text>
          <Text style={styles.infoText}>🎯 First to {item.settings.winningScore}</Text>
        </View>

        <Button
          title={isFull ? 'Room Full' : 'Join Room'}
          onPress={() => handleJoinRoom(item)}
          disabled={isFull}
          variant={isFull ? 'outline' : 'primary'}
          size="sm"
          style={styles.joinButton}
        />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.container}>
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
            <Text style={styles.emptyText}>No active rooms found</Text>
            <Text style={styles.emptySubtext}>Create your own room to get started!</Text>
            <Button
              title="Create Room"
              onPress={() => navigation.navigate('CreateRoom')}
              size="md"
              style={styles.createButton}
            />
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
  listContent: {
    padding: 12
  },
  roomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41
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

