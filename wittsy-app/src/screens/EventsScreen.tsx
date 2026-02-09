/**
 * Events Screen
 * Browse and register for events and tournaments
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { BackButton } from '../components/common/BackButton';
import { isUserAdmin } from '../utils/adminCheck';
import { Event } from '../types/social';
import {
  getActiveEvents,
  getFeaturedEvents,
  registerForEvent,
  unregisterFromEvent,
  checkEventRequirements,
} from '../services/events';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { SPACING } from '../utils/constants';
import { tabletHorizontalPadding } from '../utils/responsive';

export const EventsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors: COLORS } = useTheme();
  const { user, userProfile } = useAuth();
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
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

    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const [featured, active] = await Promise.all([
        getFeaturedEvents(),
        getActiveEvents(),
      ]);

      setFeaturedEvents(featured);
      setAllEvents(active);
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Error', 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const handleRegister = async (event: Event) => {
    if (!user?.uid || !userProfile) return;

    // Check requirements
    const { eligible, reasons } = await checkEventRequirements(user.uid, event);
    if (!eligible) {
      Alert.alert('Not Eligible', reasons.join('\n'));
      return;
    }

    Alert.alert(
      'Register for Event',
      `Do you want to register for ${event.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Register',
          onPress: async () => {
            try {
              await registerForEvent(
                event.id,
                user.uid,
                userProfile.username,
                userProfile.avatar,
                userProfile.rating
              );
              Alert.alert('Success', `You're registered for ${event.name}!`);
              await loadEvents();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to register');
            }
          },
        },
      ]
    );
  };

  const handleUnregister = async (event: Event) => {
    if (!user?.uid) return;

    Alert.alert(
      'Unregister',
      `Are you sure you want to unregister from ${event.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unregister',
          style: 'destructive',
          onPress: async () => {
            try {
              await unregisterFromEvent(event.id, user.uid);
              Alert.alert('Success', 'You have been unregistered');
              await loadEvents();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to unregister');
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge text="Upcoming" variant="info" size="sm" />;
      case 'registration':
        return <Badge text="Open" variant="success" size="sm" />;
      case 'active':
        return <Badge text="Live" variant="warning" size="sm" />;
      case 'completed':
        return <Badge text="Ended" variant="default" size="sm" />;
      default:
        return null;
    }
  };

  const renderEventCard = (event: Event, featured = false) => {
    const isFull = event.maxParticipants
      ? event.currentParticipants >= event.maxParticipants
      : false;
    const canRegister = event.status === 'registration' && !isFull;

    return (
      <Card
        key={event.id}
        variant={featured ? 'gradient' : 'elevated'}
        style={[styles.eventCard, featured && styles.featuredCard]}
      >
        {featured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>⭐ FEATURED</Text>
          </View>
        )}

        <View style={styles.eventHeader}>
          <View style={styles.eventIconContainer}>
            <Text style={styles.eventIcon}>{event.icon}</Text>
          </View>
          <View style={styles.eventHeaderInfo}>
            <Text style={styles.eventName}>{event.name}</Text>
            {getStatusBadge(event.status)}
          </View>
        </View>

        <Text style={styles.eventDescription}>{event.description}</Text>

        {/* Event Info */}
        <View style={styles.eventInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📅</Text>
            <Text style={styles.infoText}>
              {new Date(event.startDate).toLocaleDateString()} -{' '}
              {new Date(event.endDate).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>👥</Text>
            <Text style={styles.infoText}>
              {event.currentParticipants}
              {event.maxParticipants ? ` / ${event.maxParticipants}` : ''} participants
            </Text>
          </View>

          {event.entryFee && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🪙</Text>
              <Text style={styles.infoText}>{event.entryFee} coins entry fee</Text>
            </View>
          )}
        </View>

        {/* Prizes */}
        {event.prizes && event.prizes.length > 0 && (
          <View style={styles.prizesSection}>
            <Text style={styles.prizesTitle}>🏆 Prizes</Text>
            {event.prizes.slice(0, 3).map((prize, index) => (
              <View key={index} style={styles.prizeRow}>
                <Text style={styles.prizePosition}>{prize.positionRange || `${prize.position}${getOrdinalSuffix(prize.position)}`}</Text>
                <View style={styles.prizeRewards}>
                  {prize.xp && <Text style={styles.prizeText}>{prize.xp} XP</Text>}
                  {prize.coins && <Text style={styles.prizeText}>{prize.coins} coins</Text>}
                  {prize.badge && <Text style={styles.prizeText}>🏅 {prize.badge}</Text>}
                  {prize.title && <Text style={styles.prizeText}>👑 {prize.title}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Requirements */}
        {event.requirements && (
          <View style={styles.requirementsSection}>
            <Text style={styles.requirementsTitle}>Requirements:</Text>
            {event.requirements.minLevel && (
              <Text style={styles.requirementText}>• Level {event.requirements.minLevel}+</Text>
            )}
            {event.requirements.minRating && (
              <Text style={styles.requirementText}>• {event.requirements.minRating}+ rating</Text>
            )}
            {event.requirements.minGamesPlayed && (
              <Text style={styles.requirementText}>• {event.requirements.minGamesPlayed}+ games played</Text>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.eventActions}>
          {canRegister && (
            <Button
              title="Register"
              onPress={() => handleRegister(event)}
              variant="primary"
              style={styles.registerButton}
            />
          )}
          {isFull && event.status === 'registration' && (
            <View style={styles.fullBadge}>
              <Text style={styles.fullText}>Event Full</Text>
            </View>
          )}
          <Button
            title="View Details"
            onPress={() => {
              // Navigate to event details
              Alert.alert('Event Details', 'Detailed view coming soon!');
            }}
            variant="secondary"
            size="sm"
          />
        </View>
      </Card>
    );
  };

  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  return (
  <LinearGradient colors={COLORS.gradientPrimary as any} style={styles.container}>
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Admin Button - Top Right */}
      {isUserAdmin(user) && (
        <View style={styles.adminButtonContainer}>
          <TouchableOpacity 
            style={styles.adminButton}
            onPress={() => navigation.navigate('AdminEvents')}
          >
            <Text style={styles.adminButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Featured Events */}
          {featuredEvents.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⭐ Featured Events</Text>
              {featuredEvents.map(event => renderEventCard(event, true))}
            </View>
          )}

          {/* All Events */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 All Events</Text>
            {allEvents.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>🎪</Text>
                <Text style={styles.emptyStateTitle}>No Events Available</Text>
                <Text style={styles.emptyStateText}>
                  Check back soon for upcoming events!
                </Text>
              </View>
            ) : (
              allEvents.map(event => renderEventCard(event, false))
            )}
          </View>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerRight: {
    width: 40,
  },
  adminButtonContainer: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    zIndex: 10,
  },
  adminButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminButtonText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingHorizontal: SPACING.md + tabletHorizontalPadding,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  eventCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  featuredCard: {
    borderWidth: 2,
    borderColor: COLORS.warning,
  },
  featuredBadge: {
    position: 'absolute',
    top: -8,
    right: SPACING.md,
    backgroundColor: COLORS.warning,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  featuredText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  eventIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  eventIcon: {
    fontSize: 32,
  },
  eventHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  eventDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  eventInfo: {
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text,
  },
  prizesSection: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  prizesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  prizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  prizePosition: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    minWidth: 40,
  },
  prizeRewards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  prizeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  requirementsSection: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  requirementText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  eventActions: {
    gap: 8,
  },
  registerButton: {
    marginBottom: 8,
  },
  fullBadge: {
    backgroundColor: COLORS.error,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  fullText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
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
