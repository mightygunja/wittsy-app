/**
 * Group Detail Screen
 * View group info, members, standings, active group games
 * Admins can invite friends, regenerate invite code, remove members
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { Group, GroupMember, GroupMemberStats } from '../types/social';
import {
  getGroup,
  getGroupMembers,
  getGroupStandings,
  subscribeToGroupActiveRooms,
  leaveGroup,
  removeMember,
  regenerateInviteCode,
  shareGroupInviteLink,
  addMemberFromFriends,
} from '../services/groups';
import { getFriends } from '../services/friends';
import { Friend } from '../types/social';
import { joinRoom } from '../services/database';
import { SPACING } from '../utils/constants';

type TabType = 'members' | 'standings' | 'games';

export const GroupDetailScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { groupId } = route.params;
  const { colors: COLORS } = useTheme();
  const { user, userProfile } = useAuth();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [standings, setStandings] = useState<GroupMemberStats[]>([]);
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('members');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showAddFriends, setShowAddFriends] = useState(false);

  const isAdmin = useMemo(
    () => members.find((m) => m.userId === user?.uid)?.role === 'admin',
    [members, user]
  );

  const loadAll = useCallback(async () => {
    if (!user) return;
    try {
      const [g, m, s] = await Promise.all([
        getGroup(groupId),
        getGroupMembers(groupId),
        getGroupStandings(groupId),
      ]);
      setGroup(g);
      setMembers(m);
      setStandings(s);
    } catch (error) {
      console.error('GroupDetailScreen load error:', error);
    } finally {
      setLoading(false);
    }
  }, [groupId, user]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
      // Subscribe to active group games
      const unsub = subscribeToGroupActiveRooms(groupId, setActiveRooms);
      return unsub;
    }, [loadAll, groupId])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const handleShare = () => {
    if (!group) return;
    shareGroupInviteLink(group.name, group.inviteCode);
  };

  const handleRegenerateCode = () => {
    if (!user) return;
    Alert.alert(
      'Regenerate Invite Code',
      'The old code will stop working. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          style: 'destructive',
          onPress: async () => {
            try {
              const newCode = await regenerateInviteCode(groupId, user.uid);
              setGroup((prev) => prev ? { ...prev, inviteCode: newCode } : prev);
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleLeaveGroup = () => {
    if (!user) return;
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveGroup(groupId, user.uid);
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = (member: GroupMember) => {
    if (!user) return;
    Alert.alert(
      'Remove Member',
      `Remove ${member.username} from this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMember(groupId, user.uid, member.userId);
              setMembers((prev) => prev.filter((m) => m.userId !== member.userId));
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleAddFriends = async () => {
    if (!user) return;
    const allFriends = await getFriends(user.uid);
    const memberIds = new Set(members.map((m) => m.userId));
    setFriends(allFriends.filter((f) => !memberIds.has(f.userId)));
    setShowAddFriends(true);
  };

  const handleAddFriend = async (friend: Friend) => {
    if (!user) return;
    try {
      await addMemberFromFriends(groupId, friend.userId, friend.username, friend.avatar);
      await loadAll();
      setFriends((prev) => prev.filter((f) => f.userId !== friend.userId));
      if (friends.length <= 1) setShowAddFriends(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleJoinRoom = async (room: any) => {
    if (!user || !userProfile) return;
    try {
      await joinRoom(room.roomId, user.uid, userProfile.username);
      navigation.navigate('GameRoom', { roomId: room.roomId });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to join room');
    }
  };

  const handleCreateGroupGame = () => {
    navigation.navigate('CreateRoom', { groupId, groupName: group?.name });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Group not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Group header */}
      <View style={styles.groupHeader}>
        <View style={styles.groupIconCircle}>
          <Text style={styles.groupIconText}>{group.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.groupName}>{group.name}</Text>
          {!!group.description && (
            <Text style={styles.groupDesc}>{group.description}</Text>
          )}
          <Text style={styles.groupMeta}>{group.memberCount} member{group.memberCount !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      {/* Invite code row */}
      <View style={styles.inviteRow}>
        <View>
          <Text style={styles.inviteLabel}>Invite Code</Text>
          <Text style={styles.inviteCode}>{group.inviteCode}</Text>
        </View>
        <View style={styles.inviteActions}>
          <TouchableOpacity style={styles.inviteBtn} onPress={handleShare}>
            <Text style={styles.inviteBtnText}>Share</Text>
          </TouchableOpacity>
          {isAdmin && (
            <TouchableOpacity style={[styles.inviteBtn, styles.inviteBtnOutline]} onPress={handleRegenerateCode}>
              <Text style={styles.inviteBtnOutlineText}>Refresh</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['members', 'standings', 'games'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'members' ? '👥 Members' : tab === 'standings' ? '🏆 Standings' : '🎮 Games'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- Members Tab ---- */}
        {activeTab === 'members' && (
          <>
            {isAdmin && (
              <TouchableOpacity style={styles.addFriendsBtn} onPress={handleAddFriends}>
                <Text style={styles.addFriendsBtnText}>+ Add Friends to Group</Text>
              </TouchableOpacity>
            )}

            {showAddFriends && (
              <View style={styles.addFriendsPanel}>
                <Text style={styles.addFriendsPanelTitle}>Select friends to add:</Text>
                {friends.length === 0 ? (
                  <Text style={styles.emptyText}>All your friends are already in this group.</Text>
                ) : (
                  friends.map((friend) => (
                    <View key={friend.userId} style={styles.friendRow}>
                      <Text style={styles.friendName}>{friend.username}</Text>
                      <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => handleAddFriend(friend)}
                      >
                        <Text style={styles.addBtnText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
                <TouchableOpacity onPress={() => setShowAddFriends(false)}>
                  <Text style={styles.cancelLink}>Done</Text>
                </TouchableOpacity>
              </View>
            )}

            {members.map((member) => (
              <View key={member.userId} style={styles.memberRow}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>{member.username.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{member.username}</Text>
                  <Text style={styles.memberRole}>{member.role === 'admin' ? '👑 Admin' : 'Member'}</Text>
                </View>
                {isAdmin && member.userId !== user?.uid && (
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemoveMember(member)}
                  >
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.leaveBtn} onPress={handleLeaveGroup}>
              <Text style={styles.leaveBtnText}>Leave Group</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ---- Standings Tab ---- */}
        {activeTab === 'standings' && (
          <>
            {standings.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🏆</Text>
                <Text style={styles.emptyTitle}>No Games Yet</Text>
                <Text style={styles.emptySubtitle}>Play some group games to see standings here.</Text>
              </View>
            ) : (
              standings.map((stat, idx) => (
                <View key={stat.userId} style={styles.standingRow}>
                  <Text style={styles.standingRank}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.standingName}>{stat.username}</Text>
                    <Text style={styles.standingMeta}>
                      {stat.gamesPlayed} games · {stat.wins} win{stat.wins !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Text style={styles.standingPoints}>{stat.totalPoints} pts</Text>
                </View>
              ))
            )}
          </>
        )}

        {/* ---- Games Tab ---- */}
        {activeTab === 'games' && (
          <>
            <TouchableOpacity style={styles.createGameBtn} onPress={handleCreateGroupGame}>
              <Text style={styles.createGameBtnText}>🎮 Create Group Game</Text>
            </TouchableOpacity>

            {activeRooms.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🎮</Text>
                <Text style={styles.emptyTitle}>No Active Games</Text>
                <Text style={styles.emptySubtitle}>Create a game for your group above.</Text>
              </View>
            ) : (
              activeRooms.map((room) => {
                const alreadyIn = room.players?.some((p: any) => p.userId === user?.uid);
                return (
                  <View key={room.roomId} style={styles.roomCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.roomName}>{room.name}</Text>
                      <Text style={styles.roomMeta}>
                        {room.players?.length || 0} players ·{' '}
                        {room.status === 'waiting' ? '⏳ Waiting' : '🎯 In progress'}
                      </Text>
                    </View>
                    {alreadyIn ? (
                      <TouchableOpacity
                        style={styles.rejoinBtn}
                        onPress={() => navigation.navigate('GameRoom', { roomId: room.roomId })}
                      >
                        <Text style={styles.rejoinBtnText}>Rejoin</Text>
                      </TouchableOpacity>
                    ) : room.status === 'waiting' ? (
                      <TouchableOpacity
                        style={styles.joinRoomBtn}
                        onPress={() => handleJoinRoom(room)}
                      >
                        <Text style={styles.joinRoomBtnText}>Join</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    errorText: { color: COLORS.textSecondary, fontSize: 16 },
    groupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: SPACING.lg,
      gap: 14,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    },
    groupIconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: COLORS.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    groupIconText: { color: '#fff', fontSize: 24, fontWeight: '700' },
    groupName: { fontSize: 18, fontWeight: '700', color: COLORS.text },
    groupDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
    groupMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
    inviteRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      backgroundColor: COLORS.card,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    },
    inviteLabel: { fontSize: 11, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
    inviteCode: { fontSize: 22, fontWeight: '700', color: COLORS.primary, letterSpacing: 4 },
    inviteActions: { flexDirection: 'row', gap: 8 },
    inviteBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 18,
      backgroundColor: COLORS.primary,
    },
    inviteBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
    inviteBtnOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.primary },
    inviteBtnOutlineText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
    tabBar: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
    },
    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor: COLORS.primary,
    },
    tabText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
    tabTextActive: { color: COLORS.primary, fontWeight: '700' },
    scroll: { flex: 1 },
    scrollContent: { padding: SPACING.lg, gap: 10, paddingBottom: 40 },
    addFriendsBtn: {
      backgroundColor: COLORS.primary + '18',
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: COLORS.primary + '40',
    },
    addFriendsBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: 15 },
    addFriendsPanel: {
      backgroundColor: COLORS.card,
      borderRadius: 14,
      padding: SPACING.md,
      gap: 8,
    },
    addFriendsPanelTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
    friendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    friendName: { fontSize: 15, color: COLORS.text },
    addBtn: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 14,
      backgroundColor: COLORS.primary,
    },
    addBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
    cancelLink: { color: COLORS.primary, fontWeight: '600', fontSize: 14, marginTop: 8, textAlign: 'center' },
    emptyText: { color: COLORS.textSecondary, fontSize: 14 },
    memberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.card,
      borderRadius: 12,
      padding: SPACING.md,
      gap: 12,
    },
    memberAvatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: COLORS.primary + '30',
      alignItems: 'center',
      justifyContent: 'center',
    },
    memberAvatarText: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
    memberName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
    memberRole: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    removeBtn: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#e74c3c',
    },
    removeBtnText: { color: '#e74c3c', fontSize: 12, fontWeight: '600' },
    leaveBtn: {
      marginTop: 16,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: '#e74c3c',
    },
    leaveBtnText: { color: '#e74c3c', fontWeight: '600', fontSize: 15 },
    standingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.card,
      borderRadius: 12,
      padding: SPACING.md,
      gap: 12,
    },
    standingRank: { fontSize: 22, width: 36, textAlign: 'center' },
    standingName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
    standingMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    standingPoints: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
    createGameBtn: {
      backgroundColor: COLORS.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    createGameBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    emptyContainer: { alignItems: 'center', paddingTop: 40 },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 6, textAlign: 'center' },
    emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
    roomCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.card,
      borderRadius: 12,
      padding: SPACING.md,
      gap: 12,
    },
    roomName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
    roomMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    joinRoomBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 18,
      backgroundColor: COLORS.primary,
    },
    joinRoomBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    rejoinBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 18,
      backgroundColor: COLORS.success || '#27ae60',
    },
    rejoinBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  });
