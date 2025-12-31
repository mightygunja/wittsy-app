import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SPACING, TYPOGRAPHY } from '../utils/constants'
import { useTheme } from '../hooks/useTheme';;
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { getActiveEvents } from '../services/events';
import { initializeSampleEvents } from '../services/sampleEvents';
import { Event, EventType, EventStatus } from '../types/social';

export const AdminEventsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors: COLORS } = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>('tournament');
  const [status, setStatus] = useState<EventStatus>('upcoming');
  const [featured, setFeatured] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState('32');
  const [entryFee, setEntryFee] = useState('0');
  const [prizePool, setPrizePool] = useState('1000');
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);


  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await getActiveEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const handleInitializeSampleEvents = async () => {
    Alert.alert(
      'Initialize Sample Events',
      'This will create 7 sample events in the database. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Initialize',
          onPress: async () => {
            setLoading(true);
            try {
              await initializeSampleEvents();
              Alert.alert('Success', 'Sample events created successfully!');
              await loadEvents();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to initialize events');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCreateEvent = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const startDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
      const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      const newEvent: Omit<Event, 'id'> = {
        title: title.trim(),
        description: description.trim(),
        type: eventType,
        status,
        featured,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        registrationDeadline: startDate.toISOString(),
        maxParticipants: parseInt(maxParticipants) || 32,
        currentParticipants: 0,
        entryFee: parseInt(entryFee) || 0,
        prizePool: parseInt(prizePool) || 0,
        rules: ['Standard game rules apply', 'Be respectful to all participants'],
        rewards: {
          first: { coins: parseInt(prizePool) * 0.5, xp: 500, badge: 'Champion' },
          second: { coins: parseInt(prizePool) * 0.3, xp: 300 },
          third: { coins: parseInt(prizePool) * 0.2, xp: 200 },
        },
        participants: [],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      await createEvent(newEvent);
      
      Alert.alert('Success', 'Event created successfully!');
      
      // Reset form
      setTitle('');
      setDescription('');
      setEventType('tournament');
      setStatus('upcoming');
      setFeatured(false);
      setMaxParticipants('32');
      setEntryFee('0');
      setPrizePool('1000');
      setShowForm(false);
      
      loadEvents();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const eventTypeOptions: EventType[] = ['tournament', 'challenge', 'special', 'seasonal'];
  const statusOptions: EventStatus[] = ['upcoming', 'registration', 'active', 'completed', 'cancelled'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Events</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Quick Actions */}
        {!showForm && (
          <View style={styles.quickActions}>
            <Button
              title="🎪 Initialize Sample Events"
              onPress={handleInitializeSampleEvents}
              variant="outline"
              style={styles.actionButton}
            />
            <Button
              title="+ Create New Event"
              onPress={() => setShowForm(true)}
              variant="primary"
              style={styles.actionButton}
            />
          </View>
        )}

        {/* Create Event Form */}
        {showForm && (
          <Card variant="elevated" style={styles.formCard}>
            <Text style={styles.formTitle}>Create New Event</Text>

            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Weekly Tournament"
              placeholderTextColor={COLORS.textTertiary}
            />

            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the event..."
              placeholderTextColor={COLORS.textTertiary}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Event Type</Text>
            <View style={styles.optionsRow}>
              {eventTypeOptions.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.option, eventType === type && styles.optionActive]}
                  onPress={() => setEventType(type)}
                >
                  <Text style={[styles.optionText, eventType === type && styles.optionTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Status</Text>
            <View style={styles.optionsRow}>
              {statusOptions.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.option, status === s && styles.optionActive]}
                  onPress={() => setStatus(s)}
                >
                  <Text style={[styles.optionText, status === s && styles.optionTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.label}>Featured Event</Text>
              <Switch
                value={featured}
                onValueChange={setFeatured}
                trackColor={{ false: COLORS.surface, true: COLORS.primary }}
                thumbColor={COLORS.text}
              />
            </View>

            <Text style={styles.label}>Max Participants</Text>
            <TextInput
              style={styles.input}
              value={maxParticipants}
              onChangeText={setMaxParticipants}
              placeholder="32"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="number-pad"
            />

            <Text style={styles.label}>Entry Fee (Coins)</Text>
            <TextInput
              style={styles.input}
              value={entryFee}
              onChangeText={setEntryFee}
              placeholder="0"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="number-pad"
            />

            <Text style={styles.label}>Prize Pool (Coins)</Text>
            <TextInput
              style={styles.input}
              value={prizePool}
              onChangeText={setPrizePool}
              placeholder="1000"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="number-pad"
            />

            <View style={styles.formButtons}>
              <Button
                title="Cancel"
                onPress={() => setShowForm(false)}
                variant="secondary"
                style={styles.formButton}
              />
              <Button
                title="Create Event"
                onPress={handleCreateEvent}
                variant="primary"
                loading={loading}
                style={styles.formButton}
              />
            </View>
          </Card>
        )}

        {/* Existing Events */}
        <Text style={styles.sectionTitle}>Existing Events ({events.length})</Text>
        {events.length === 0 ? (
          <Card variant="elevated" style={styles.emptyCard}>
            <Text style={styles.emptyText}>No events yet. Create your first event!</Text>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id} variant="elevated" style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                {event.featured && (
                  <View style={styles.featuredBadge}>
                    <Text style={styles.featuredText}>⭐ Featured</Text>
                  </View>
                )}
              </View>
              <Text style={styles.eventDescription}>{event.description}</Text>
              <View style={styles.eventMeta}>
                <Text style={styles.eventMetaText}>Type: {event.type}</Text>
                <Text style={styles.eventMetaText}>Status: {event.status}</Text>
                <Text style={styles.eventMetaText}>
                  Participants: {event.currentParticipants}/{event.maxParticipants}
                </Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.text,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
  },
  quickActions: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  actionButton: {
    marginBottom: SPACING.xs,
  },
  formCard: {
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  formTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: SPACING.sm,
    color: COLORS.text,
    fontSize: TYPOGRAPHY.fontSize.base,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  option: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
  },
  optionActive: {
    backgroundColor: COLORS.primary,
  },
  optionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  optionTextActive: {
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  formButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  formButton: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  emptyCard: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  eventCard: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  eventTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    flex: 1,
  },
  featuredBadge: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuredText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  eventDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  eventMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  eventMetaText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
  },
});
