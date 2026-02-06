import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { BackButton } from '../components/common/BackButton';
import { isUserAdmin } from '../utils/adminCheck';
import {
  getPendingPromptSubmissions,
  approvePromptSubmission,
  rejectPromptSubmission,
  getSubmissionStats,
} from '../services/promptAdmin';
import { PromptSubmission, PromptDifficulty } from '../types/prompts';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { SPACING, RADIUS } from '../utils/constants';

export const PromptApprovalScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const { colors: COLORS } = useTheme();
  const [submissions, setSubmissions] = useState<PromptSubmission[]>([]);
  
  // Redirect non-admins
  React.useEffect(() => {
    if (!isUserAdmin(user)) {
      Alert.alert('Access Denied', 'You do not have permission to access this area.');
      navigation.goBack();
    }
  }, [user, navigation]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [selectedDifficulty, setSelectedDifficulty] = useState<{ [key: string]: PromptDifficulty }>({});

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
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
    scrollView: { flex: 1 },
    content: {
      padding: SPACING.md,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: SPACING.lg,
      gap: SPACING.sm,
    },
    statCard: {
      flex: 1,
      alignItems: 'center',
      padding: SPACING.md,
    },
    statNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: SPACING.xs,
    },
    statLabel: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.7)',
    },
    submissionCard: {
      marginBottom: SPACING.md,
      padding: SPACING.md,
    },
    submissionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.sm,
    },
    submissionText: {
      fontSize: 16,
      color: '#FFFFFF',
      fontWeight: '600',
      flex: 1,
      marginRight: SPACING.sm,
    },
    submissionMeta: {
      flexDirection: 'row',
      gap: SPACING.sm,
      marginBottom: SPACING.sm,
    },
    metaBadge: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      borderRadius: RADIUS.sm,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    metaText: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    difficultySelector: {
      flexDirection: 'row',
      gap: SPACING.xs,
      marginBottom: SPACING.sm,
    },
    difficultyButton: {
      flex: 1,
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.sm,
      borderRadius: RADIUS.sm,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      alignItems: 'center',
    },
    difficultyButtonSelected: {
      backgroundColor: 'rgba(168, 85, 247, 0.3)',
      borderColor: '#A855F7',
    },
    difficultyButtonText: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    difficultyButtonTextSelected: {
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    actionButtons: {
      flexDirection: 'row',
      gap: SPACING.sm,
    },
    approveButton: {
      flex: 1,
    },
    rejectButton: {
      flex: 1,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: SPACING.xxl,
    },
    emptyText: {
      fontSize: 18,
      color: 'rgba(255, 255, 255, 0.7)',
      textAlign: 'center',
      marginBottom: SPACING.sm,
    },
    emptySubtext: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.5)',
      textAlign: 'center',
    },
  }), [SPACING, RADIUS]);

  const loadSubmissions = async () => {
    try {
      const [pendingSubmissions, submissionStats] = await Promise.all([
        getPendingPromptSubmissions(),
        getSubmissionStats(),
      ]);
      setSubmissions(pendingSubmissions);
      setStats(submissionStats);
    } catch (error) {
      console.error('Error loading submissions:', error);
      Alert.alert('Error', 'Failed to load submissions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const handleApprove = async (submission: PromptSubmission) => {
    const difficulty = selectedDifficulty[submission.id] || submission.suggestedDifficulty;
    
    try {
      await approvePromptSubmission(submission.id, difficulty);
      Alert.alert('Success', 'Prompt approved!');
      loadSubmissions();
    } catch (error) {
      console.error('Error approving prompt:', error);
      Alert.alert('Error', 'Failed to approve prompt');
    }
  };

  const handleReject = async (submissionId: string) => {
    Alert.alert(
      'Reject Prompt',
      'Are you sure you want to reject this prompt?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectPromptSubmission(submissionId);
              Alert.alert('Success', 'Prompt rejected');
              loadSubmissions();
            } catch (error) {
              console.error('Error rejecting prompt:', error);
              Alert.alert('Error', 'Failed to reject prompt');
            }
          },
        },
      ]
    );
  };

  return (
    <LinearGradient colors={COLORS.gradientPrimary as any} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Approve Prompts</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => {
              setRefreshing(true);
              loadSubmissions();
            }} tintColor="#FFFFFF" />
          }
        >
          <View style={styles.statsContainer}>
            <Card variant="elevated" style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.pending}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </Card>
            <Card variant="elevated" style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.approved}</Text>
              <Text style={styles.statLabel}>Approved</Text>
            </Card>
            <Card variant="elevated" style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.rejected}</Text>
              <Text style={styles.statLabel}>Rejected</Text>
            </Card>
          </View>

          {submissions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No pending submissions</Text>
              <Text style={styles.emptySubtext}>All prompts have been reviewed!</Text>
            </View>
          ) : (
            submissions.map((submission) => (
              <Card key={submission.id} variant="elevated" style={styles.submissionCard}>
                <View style={styles.submissionHeader}>
                  <Text style={styles.submissionText}>{submission.text}</Text>
                </View>

                <View style={styles.submissionMeta}>
                  <View style={styles.metaBadge}>
                    <Text style={styles.metaText}>{submission.category}</Text>
                  </View>
                  <View style={styles.metaBadge}>
                    <Text style={styles.metaText}>Suggested: {submission.suggestedDifficulty}</Text>
                  </View>
                </View>

                <View style={styles.difficultySelector}>
                  {(['easy', 'medium', 'hard'] as PromptDifficulty[]).map((diff) => (
                    <TouchableOpacity
                      key={diff}
                      style={[
                        styles.difficultyButton,
                        selectedDifficulty[submission.id] === diff && styles.difficultyButtonSelected,
                      ]}
                      onPress={() => setSelectedDifficulty({ ...selectedDifficulty, [submission.id]: diff })}
                    >
                      <Text
                        style={[
                          styles.difficultyButtonText,
                          selectedDifficulty[submission.id] === diff && styles.difficultyButtonTextSelected,
                        ]}
                      >
                        {diff.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.actionButtons}>
                  <Button
                    title="Approve"
                    onPress={() => handleApprove(submission)}
                    variant="success"
                    size="sm"
                    style={styles.approveButton}
                  />
                  <Button
                    title="Reject"
                    onPress={() => handleReject(submission.id)}
                    variant="danger"
                    size="sm"
                    style={styles.rejectButton}
                  />
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};
