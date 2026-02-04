import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getCurrentSeason, getAllSeasons } from '../services/seasons';
import { SPACING } from '../utils/constants';
import { createSettingsStyles } from '../styles/settingsStyles';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { isUserAdmin } from '../utils/adminCheck';

export const AdminConsoleScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors: COLORS } = useTheme();
  const { user } = useAuth();
  const [seasons, setSeasons] = useState<any[]>([]);
  
  // Redirect non-admins
  React.useEffect(() => {
    if (!isUserAdmin(user)) {
      Alert.alert('Access Denied', 'You do not have permission to access this area.');
      navigation.goBack();
    }
  }, [user, navigation]);
  const [currentSeason, setCurrentSeason] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [seasonNumber, setSeasonNumber] = useState('');
  const [seasonName, setSeasonName] = useState('');
  const [seasonTheme, setSeasonTheme] = useState('');
  const [seasonDescription, setSeasonDescription] = useState('');
  const [durationDays, setDurationDays] = useState('90');
  const styles = useMemo(() => createSettingsStyles(COLORS, SPACING), [COLORS]);


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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Console</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>

        {/* Admin Tools */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛠️ Admin Tools</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('AdminFeedback')}
          >
            <Text style={styles.actionButtonText}>💭 User Feedback</Text>
            <Text style={styles.actionButtonIcon}>→</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('PromptApproval')}
          >
            <Text style={styles.actionButtonText}>✅ Approve Prompts</Text>
            <Text style={styles.actionButtonIcon}>→</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('AdminEvents')}
          >
            <Text style={styles.actionButtonText}>🏆 Manage Events</Text>
            <Text style={styles.actionButtonIcon}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Current Season Info */}
        {currentSeason && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Current Season</Text>
            <View style={styles.settingCard}>
              <Text style={[styles.settingLabel, { marginBottom: SPACING.xs }]}>{currentSeason.name}</Text>
              <Text style={styles.settingDescription}>Season {currentSeason.number}</Text>
              <Text style={styles.settingDescription}>
                Ends: {new Date(currentSeason.endDate).toLocaleDateString()}
              </Text>
              <TouchableOpacity
                style={[styles.dangerButton, { marginTop: SPACING.md }]}
                onPress={() => handleEndSeason(currentSeason.id)}
                disabled={loading}
              >
                <Text style={[styles.actionButtonText, { color: COLORS.text }]}>End Season Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Create New Season Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>➕ Create New Season</Text>
          
          <View style={styles.settingCard}>
            <Text style={[styles.settingLabel, { marginBottom: SPACING.xs }]}>Season Number *</Text>
            <TextInput
              style={{
                fontSize: 16,
                color: COLORS.text,
                padding: SPACING.sm,
                backgroundColor: COLORS.background,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: COLORS.border,
                marginBottom: SPACING.md,
              }}
              value={seasonNumber}
              onChangeText={setSeasonNumber}
              placeholder="e.g., 2"
              keyboardType="number-pad"
              placeholderTextColor={COLORS.textSecondary}
            />

            <Text style={[styles.settingLabel, { marginBottom: SPACING.xs }]}>Season Name *</Text>
            <TextInput
              style={{
                fontSize: 16,
                color: COLORS.text,
                padding: SPACING.sm,
                backgroundColor: COLORS.background,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: COLORS.border,
                marginBottom: SPACING.md,
              }}
              value={seasonName}
              onChangeText={setSeasonName}
              placeholder="e.g., Season 1: The Beginning"
              placeholderTextColor={COLORS.textSecondary}
            />

            <Text style={[styles.settingLabel, { marginBottom: SPACING.xs }]}>Theme (Optional)</Text>
            <TextInput
              style={{
                fontSize: 16,
                color: COLORS.text,
                padding: SPACING.sm,
                backgroundColor: COLORS.background,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: COLORS.border,
                marginBottom: SPACING.md,
              }}
              value={seasonTheme}
              onChangeText={setSeasonTheme}
              placeholder="e.g., launch, summer, winter"
              placeholderTextColor={COLORS.textSecondary}
            />

            <Text style={[styles.settingLabel, { marginBottom: SPACING.xs }]}>Description (Optional)</Text>
            <TextInput
              style={{
                fontSize: 16,
                color: COLORS.text,
                padding: SPACING.sm,
                backgroundColor: COLORS.background,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: COLORS.border,
                minHeight: 80,
                textAlignVertical: 'top',
                marginBottom: SPACING.md,
              }}
              value={seasonDescription}
              onChangeText={setSeasonDescription}
              placeholder="Season description..."
              multiline
              numberOfLines={3}
              placeholderTextColor={COLORS.textSecondary}
            />

            <Text style={[styles.settingLabel, { marginBottom: SPACING.xs }]}>Duration (Days)</Text>
            <TextInput
              style={{
                fontSize: 16,
                color: COLORS.text,
                padding: SPACING.sm,
                backgroundColor: COLORS.background,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: COLORS.border,
                marginBottom: SPACING.md,
              }}
              value={durationDays}
              onChangeText={setDurationDays}
              placeholder="90"
              keyboardType="number-pad"
              placeholderTextColor={COLORS.textSecondary}
            />

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
              onPress={handleCreateSeason}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.text} />
              ) : (
                <Text style={[styles.actionButtonText, { color: COLORS.text }]}>Create Season</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* All Seasons List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 All Seasons</Text>
          {seasons.length === 0 ? (
            <View style={styles.settingCard}>
              <Text style={styles.settingDescription}>No seasons yet</Text>
            </View>
          ) : (
            seasons.map((season) => (
              <View key={season.id} style={styles.settingCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs }}>
                  <Text style={styles.settingLabel}>{season.name}</Text>
                  <View style={{
                    paddingHorizontal: SPACING.sm,
                    paddingVertical: 4,
                    borderRadius: 12,
                    backgroundColor: season.status === 'active' ? COLORS.success : COLORS.textSecondary,
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: COLORS.text, textTransform: 'uppercase' }}>
                      {season.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.settingDescription}>
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
