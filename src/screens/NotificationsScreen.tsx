import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNotifications } from '../hooks/useNotifications';
import { useTheme } from '../hooks/useTheme';
import { SPACING } from '../utils/constants';
import { tabletHorizontalPadding } from '../utils/responsive';

export const NotificationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors: COLORS } = useTheme();
  const { notifications, loading, markAsRead } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: SPACING.md,
      paddingHorizontal: SPACING.md + tabletHorizontalPadding,
    },
    notificationCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 12,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
      flexDirection: 'row',
      alignItems: 'center',
    },
    unreadCard: {
      backgroundColor: 'rgba(168, 85, 247, 0.2)',
      borderLeftWidth: 3,
      borderLeftColor: '#A855F7',
    },
    notificationIcon: {
      fontSize: 32,
      marginRight: SPACING.md,
    },
    notificationContent: {
      flex: 1,
    },
    notificationTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 4,
    },
    notificationMessage: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
      marginBottom: 4,
    },
    notificationTime: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.6)',
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
    },
    emptyIcon: {
      fontSize: 64,
      marginBottom: SPACING.md,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.6)',
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    markAllButton: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
    },
    markAllText: {
      fontSize: 14,
      color: '#A855F7',
      fontWeight: '600',
    },
  }), [SPACING]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleNotificationPress = async (notification: any) => {
    await markAsRead(notification.id);

    if (notification.type === 'friend_request') {
      navigation.navigate('Friends', { tab: 'requests' });
    } else if (notification.type === 'friend_accepted') {
      navigation.navigate('Friends');
    } else if (notification.type === 'game_invite') {
      if (notification.roomId) {
        navigation.navigate('GameRoom', { roomId: notification.roomId });
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request': return '👋';
      case 'friend_accepted': return '✅';
      case 'game_invite': return '🎮';
      default: return '📬';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <LinearGradient colors={COLORS.gradientPrimary as any} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={COLORS.gradientPrimary as any} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FFFFFF" />
          }
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No notifications</Text>
              <Text style={styles.emptySubtext}>You're all caught up!</Text>
            </View>
          ) : (
            notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.read && styles.unreadCard,
                ]}
                onPress={() => handleNotificationPress(notification)}
              >
                <Text style={styles.notificationIcon}>
                  {getNotificationIcon(notification.type)}
                </Text>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationMessage}>{notification.message}</Text>
                  <Text style={styles.notificationTime}>
                    {formatTime(notification.createdAt)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};
