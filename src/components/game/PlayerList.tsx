import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Player } from '../../types';
import { COLORS } from '../../utils/constants';

interface PlayerListProps {
  players: Player[];
  onlineStatus?: { [userId: string]: boolean };
}

const PlayerList: React.FC<PlayerListProps> = ({ players, onlineStatus = {} }) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Players ({players.length})</Text>
      
      <View style={styles.grid}>
        {players.map((player) => {
          const isOnline = onlineStatus[player.userId] !== false;
          
          return (
            <View key={player.userId} style={styles.playerCard}>
              <View style={styles.avatarContainer}>
                <View style={[
                  styles.avatar,
                  { backgroundColor: player.avatar?.background || COLORS.primary }
                ]}>
                  <Text style={styles.avatarText}>
                    {player.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                
                <View style={[
                  styles.statusDot,
                  { backgroundColor: isOnline ? COLORS.success : COLORS.textSecondary }
                ]} />
              </View>
              
              <Text style={styles.username} numberOfLines={1}>
                {player.username}
              </Text>
              
              {player.isReady && (
                <View style={styles.readyBadge}>
                  <Text style={styles.readyText}>✓</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxHeight: 400,
  },
  contentContainer: {
    paddingBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  playerCard: {
    alignItems: 'center',
    width: 80,
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.border,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  username: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  readyBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.success,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  readyText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default PlayerList;
