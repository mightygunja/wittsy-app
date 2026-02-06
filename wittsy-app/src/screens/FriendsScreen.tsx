/**
 * Friends Screen
 * Manage friends, friend requests, search users, send invites
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { Friend, FriendRequest } from '../types/social';
import {
  getFriends,
  getPendingRequests,
  getSentRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
  toggleFavoriteFriend,
  searchUsers,
} from '../services/friends';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { SPACING } from '../utils/constants'
import { useTheme } from '../hooks/useTheme';;

type TabType = 'friends' | 'requests' | 'search';

export const FriendsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors: COLORS } = useTheme();
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);


  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    loadData();
  }, []);

  const loadData = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      const [friendsData, requestsData, sentData] = await Promise.all([
        getFriends(user.uid),
        getPendingRequests(user.uid),
        getSentRequests(user.uid),
      ]);

      setFriends(friendsData);
      setPendingRequests(requestsData);
      setSentRequests(sentData);
    } catch (error) {
      console.warn('Error loading friends data (expected if collections not initialized):', error);
      // Don't show alert - this is expected when collections don't exist yet
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user?.uid) return;

    setLoading(true);
    try {
      const results = await searchUsers(searchQuery, user.uid);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (toUserId: string, toUsername: string) => {
    if (!user?.uid || !userProfile?.username) return;

    try {
      await sendFriendRequest(user.uid, userProfile.username, toUserId, toUsername);
      Alert.alert('Success', `Friend request sent to ${toUsername}`);
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send friend request');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    if (!user?.uid) return;

    try {
      await acceptFriendRequest(requestId, user.uid);
      Alert.alert('Success', 'Friend request accepted!');
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!user?.uid) return;

    try {
      await rejectFriendRequest(requestId, user.uid);
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reject request');
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!user?.uid) return;

    try {
      await cancelFriendRequest(requestId, user.uid);
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to cancel request');
    }
  };

  const handleRemoveFriend = async (friendId: string, friendUsername: string) => {
    if (!user?.uid) return;

    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friendUsername} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(user.uid, friendId);
              await loadData();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove friend');
            }
          },
        },
      ]
    );
  };

  const handleToggleFavorite = async (friendId: string) => {
    if (!user?.uid) return;

    try {
      await toggleFavoriteFriend(user.uid, friendId);
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update favorite');
    }
  };

  const renderFriendCard = (friend: Friend) => (
    <Card key={friend.userId} variant="elevated" style={styles.friendCard}>
      <View style={styles.friendHeader}>
        <View style={styles.friendInfo}>
          <View style={styles.friendNameRow}>
            <Text style={styles.friendName}>{friend.username}</Text>
            {friend.favorited && <Text style={styles.favoriteIcon}>⭐</Text>}
            {friend.isOnline && <View style={styles.onlineIndicator} />}
          </View>
          <Text style={styles.friendRank}>{friend.rank} • {friend.rating} rating</Text>
          {friend.gamesPlayedTogether > 0 && (
            <Text style={styles.gamesPlayed}>
              🎮 {friend.gamesPlayedTogether} games together
            </Text>
          )}
        </View>
      </View>

      <View style={styles.friendActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleToggleFavorite(friend.userId)}
        >
          <Text style={styles.actionButtonText}>
            {friend.favorited ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.inviteButton]}
          onPress={() => {
            // Navigate to create room or send invite
            Alert.alert('Invite', 'Game invite feature coming soon!');
          }}
        >
          <Text style={styles.actionButtonText}>✉️ Invite</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.removeButton]}
          onPress={() => handleRemoveFriend(friend.userId, friend.username)}
        >
          <Text style={styles.actionButtonText}>❌</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderRequestCard = (request: FriendRequest) => (
    <Card key={request.id} variant="glass" style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Text style={styles.requestUsername}>{request.fromUsername}</Text>
        <Text style={styles.requestTime}>
          {new Date(request.createdAt).toLocaleDateString()}
        </Text>
      </View>
      {request.message && (
        <Text style={styles.requestMessage}>"{request.message}"</Text>
      )}
      <View style={styles.requestActions}>
        <Button
          title="Accept"
          onPress={() => handleAcceptRequest(request.id)}
          variant="primary"
          size="sm"
          style={styles.acceptButton}
        />
        <Button
          title="Decline"
          onPress={() => handleRejectRequest(request.id)}
          variant="secondary"
          size="sm"
          style={styles.declineButton}
        />
      </View>
    </Card>
  );

  const renderSentRequestCard = (request: FriendRequest) => (
    <Card key={request.id} variant="glass" style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Text style={styles.requestUsername}>To: {request.toUsername}</Text>
        <Badge text="Pending" variant="warning" size="sm" />
      </View>
      <View style={styles.requestActions}>
        <Button
          title="Cancel"
          onPress={() => handleCancelRequest(request.id)}
          variant="secondary"
          size="sm"
        />
      </View>
    </Card>
  );

  const renderSearchResultCard = (user: any) => (
    <Card key={user.id} variant="elevated" style={styles.searchCard}>
      <View style={styles.searchResultInfo}>
        <Text style={styles.searchResultName}>{user.username}</Text>
        <Text style={styles.searchResultRank}>{user.rank} • {user.rating} rating</Text>
      </View>
      <Button
        title="Add Friend"
        onPress={() => handleSendRequest(user.id, user.username)}
        variant="primary"
        size="sm"
      />
    </Card>
  );

  return (
    <LinearGradient
      colors={COLORS.gradientPrimary as any}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
            onPress={() => setActiveTab('friends')}
          >
            <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
              Friends ({friends.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
            onPress={() => setActiveTab('requests')}
          >
            <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
              Requests ({pendingRequests.length})
            </Text>
            {pendingRequests.length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>{pendingRequests.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'search' && styles.activeTab]}
            onPress={() => setActiveTab('search')}
          >
            <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
              Search
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <ScrollView
            style={styles.scrollView}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          >
            {/* Friends Tab */}
            {activeTab === 'friends' && (
              <View style={styles.tabContent}>
                {friends.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateIcon}>👥</Text>
                    <Text style={styles.emptyStateTitle}>No Friends Yet</Text>
                    <Text style={styles.emptyStateText}>
                      Search for users and send friend requests!
                    </Text>
                  </View>
                ) : (
                  friends.map(renderFriendCard)
                )}
              </View>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <View style={styles.tabContent}>
                {pendingRequests.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Received Requests</Text>
                    {pendingRequests.map(renderRequestCard)}
                  </View>
                )}

                {sentRequests.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sent Requests</Text>
                    {sentRequests.map(renderSentRequestCard)}
                  </View>
                )}

                {pendingRequests.length === 0 && sentRequests.length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateIcon}>📭</Text>
                    <Text style={styles.emptyStateTitle}>No Pending Requests</Text>
                    <Text style={styles.emptyStateText}>
                      All caught up!
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Search Tab */}
            {activeTab === 'search' && (
              <View style={styles.tabContent}>
                <View style={styles.searchBar}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search by username..."
                    placeholderTextColor={COLORS.textTertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                  />
                  <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                    <Text style={styles.searchButtonText}>🔍</Text>
                  </TouchableOpacity>
                </View>

                {searchResults.length > 0 ? (
                  searchResults.map(renderSearchResultCard)
                ) : searchQuery.length > 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateIcon}>🔍</Text>
                    <Text style={styles.emptyStateTitle}>No Results</Text>
                    <Text style={styles.emptyStateText}>
                      Try a different username
                    </Text>
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateIcon}>👋</Text>
                    <Text style={styles.emptyStateTitle}>Find Friends</Text>
                    <Text style={styles.emptyStateText}>
                      Search for users by username
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.text,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerRight: {
    width: 40,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    backgroundColor: COLORS.surface,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  notificationText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  friendCard: {
    marginBottom: SPACING.sm,
    padding: SPACING.md,
  },
  friendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  friendInfo: {
    flex: 1,
  },
  friendNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  friendName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: 8,
  },
  favoriteIcon: {
    fontSize: 16,
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
    marginLeft: 8,
  },
  friendRank: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  gamesPlayed: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  friendActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  inviteButton: {
    backgroundColor: COLORS.primary,
  },
  removeButton: {
    backgroundColor: COLORS.error,
    flex: 0.5,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  requestCard: {
    marginBottom: SPACING.sm,
    padding: SPACING.md,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  requestUsername: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  requestTime: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  requestMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginBottom: SPACING.sm,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    flex: 1,
  },
  declineButton: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: COLORS.text,
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    fontSize: 20,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  searchResultRank: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
