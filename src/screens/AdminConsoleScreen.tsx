import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getCurrentSeason, getAllSeasons } from '../services/seasons';
import { SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../utils/constants'
import { useTheme } from '../hooks/useTheme';;

export const AdminConsoleScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors: COLORS } = useTheme();
  const [seasons, setSeasons] = useState<any[]>([]);
  const [currentSeason, setCurrentSeason] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [seasonNumber, setSeasonNumber] = useState('');
  const [seasonName, setSeasonName] = useState('');
  const [seasonTheme, setSeasonTheme] = useState('');
  const [seasonDescription, setSeasonDescription] = useState('');
  const [durationDays, setDurationDays] = useState('90');
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);


  useEffect(() => {
    loadSeasons();
  }, []);

  useEffect(() => {
    // Auto-populate next season number based on all seasons (including current)
    if (seasons.length > 0) {
      const maxSeasonNumber = Math.max(...seasons.map(s => s.number || 0));
      const nextNumber = maxSeasonNumber + 1;
      setSeasonNumber(nextNumber.toString());
      console.log(`Auto-setting next season number to ${nextNumber} (current max: ${maxSeasonNumber})`);
    } else if (currentSeason) {
      // If we have a current season but no seasons in the list, use current + 1
      const nextNumber = (currentSeason.number || 0) + 1;
      setSeasonNumber(nextNumber.toString());
      console.log(`Auto-setting next season number to ${nextNumber} based on current season`);
    } else {
      setSeasonNumber('1');
      // Silently default to season 1 - this is expected on first run
    }
  }, [seasons, currentSeason]);

  const loadSeasons = async () => {
    setLoading(true);
    try {
      const [current, all] = await Promise.all([
        getCurrentSeason(),
        getAllSeasons(),
      ]);
      setCurrentSeason(current);
      setSeasons(all);
    } catch (error) {
      console.error('Error loading seasons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSeason = async () => {
    if (!seasonNumber || !seasonName) {
      Alert.alert('Error', 'Season number and name are required');
      return;
    }

    setLoading(true);
    try {
      const functions = getFunctions();
      const createSeason = httpsCallable(functions, 'adminCreateSeason');
      
      const result = await createSeason({
        number: parseInt(seasonNumber),
        name: seasonName,
        theme: seasonTheme || null,
        description: seasonDescription || null,
        durationDays: parseInt(durationDays) || 90,
      });

      Alert.alert('Success', (result.data as any).message);
      
      // Clear form
      setSeasonNumber('');
      setSeasonName('');
      setSeasonTheme('');
      setSeasonDescription('');
      setDurationDays('90');
      
      // Reload seasons
      await loadSeasons();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create season');
    } finally {
      setLoading(false);
    }
  };

  const handleEndSeason = async (seasonId: string) => {
    Alert.alert(
      'End Season',
      'Are you sure you want to end this season? This will distribute rewards to all players.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Season',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const functions = getFunctions();
              const endSeason = httpsCallable(functions, 'adminEndSeason');
              
              const result = await endSeason({ seasonId });
              Alert.alert('Success', (result.data as any).message);
              
              await loadSeasons();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to end season');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🔧 Admin Console</Text>
          <Text style={styles.subtitle}>Manage your app</Text>
        </View>

        {/* Admin Tools */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🛠️ Admin Tools</Text>
          <TouchableOpacity 
            style={styles.toolCard}
            onPress={() => navigation.navigate('PromptApproval')}
          >
            <Text style={styles.toolIcon}>✅</Text>
            <View style={styles.toolInfo}>
              <Text style={styles.toolTitle}>Approve Prompts</Text>
              <Text style={styles.toolDescription}>Review and approve community-submitted prompts</Text>
            </View>
            <Text style={styles.toolArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.toolCard}
            onPress={() => navigation.navigate('AdminEvents')}
          >
            <Text style={styles.toolIcon}>🏆</Text>
            <View style={styles.toolInfo}>
              <Text style={styles.toolTitle}>Manage Events</Text>
              <Text style={styles.toolDescription}>Create and manage tournaments & events</Text>
            </View>
            <Text style={styles.toolArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Current Season Info */}
        {currentSeason && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📅 Current Season</Text>
            <View style={styles.seasonInfo}>
              <Text style={styles.seasonName}>{currentSeason.name}</Text>
              <Text style={styles.seasonMeta}>Season {currentSeason.number}</Text>
              <Text style={styles.seasonMeta}>
                Ends: {new Date(currentSeason.endDate).toLocaleDateString()}
              </Text>
              <TouchableOpacity
                style={styles.dangerButton}
                onPress={() => handleEndSeason(currentSeason.id)}
                disabled={loading}
              >
                <Text style={styles.dangerButtonText}>End Season Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Create New Season Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>➕ Create New Season</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Season Number *</Text>
            <TextInput
              style={styles.input}
              value={seasonNumber}
              onChangeText={setSeasonNumber}
              placeholder="e.g., 2"
              keyboardType="number-pad"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Season Name *</Text>
            <TextInput
              style={styles.input}
              value={seasonName}
              onChangeText={setSeasonName}
              placeholder="e.g., Season 1: The Beginning"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Theme (Optional)</Text>
            <TextInput
              style={styles.input}
              value={seasonTheme}
              onChangeText={setSeasonTheme}
              placeholder="e.g., launch, summer, winter"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={seasonDescription}
              onChangeText={setSeasonDescription}
              placeholder="Season description..."
              multiline
              numberOfLines={3}
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Duration (Days)</Text>
            <TextInput
              style={styles.input}
              value={durationDays}
              onChangeText={setDurationDays}
              placeholder="90"
              keyboardType="number-pad"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateSeason}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.text} />
            ) : (
              <Text style={styles.createButtonText}>Create Season</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* All Seasons List */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 All Seasons</Text>
          {seasons.length === 0 ? (
            <Text style={styles.emptyText}>No seasons yet</Text>
          ) : (
            seasons.map((season) => (
              <View key={season.id} style={styles.seasonItem}>
                <View style={styles.seasonItemHeader}>
                  <Text style={styles.seasonItemName}>{season.name}</Text>
                  <View style={[
                    styles.statusBadge,
                    season.status === 'active' && styles.statusActive,
                    season.status === 'ended' && styles.statusEnded,
                  ]}>
                    <Text style={styles.statusText}>{season.status}</Text>
                  </View>
                </View>
                <Text style={styles.seasonItemMeta}>
                  {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginBottom: SPACING.md,
  },
  backButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.black,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  card: {
    backgroundColor: COLORS.surface,
    margin: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    ...SHADOWS.md,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  seasonInfo: {
    gap: SPACING.sm,
  },
  seasonName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  seasonMeta: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.backgroundElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
  },
  inputReadOnly: {
    backgroundColor: COLORS.surface,
    opacity: 0.6,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  createButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  createButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  dangerButton: {
    backgroundColor: COLORS.error,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  dangerButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  seasonItem: {
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  seasonItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  seasonItemName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    flex: 1,
  },
  seasonItemMeta: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.textSecondary,
  },
  statusActive: {
    backgroundColor: COLORS.success,
  },
  statusEnded: {
    backgroundColor: COLORS.textSecondary,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.text,
    textTransform: 'uppercase',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  toolIcon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  toolInfo: {
    flex: 1,
  },
  toolTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: 2,
  },
  toolDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  toolArrow: {
    fontSize: 20,
    color: COLORS.textSecondary,
  },
});
