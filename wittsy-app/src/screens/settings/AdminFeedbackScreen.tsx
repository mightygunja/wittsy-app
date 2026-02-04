/**
 * Admin Feedback Screen
 * View and manage user feedback submissions
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { SPACING } from '../../utils/constants';
import { createSettingsStyles } from '../../styles/settingsStyles';
import { isUserAdmin } from '../../utils/adminCheck';
import { collection, query, orderBy, limit, getDocs, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../services/firebase';

type FeedbackItem = {
  id: string;
  userId: string;
  username: string;
  type: 'bug' | 'feature' | 'improvement' | 'other';
  title: string;
  description: string;
  status: 'new' | 'reviewed' | 'in-progress' | 'completed' | 'dismissed';
  createdAt: any;
  platform: string;
};

export const AdminFeedbackScreen: React.FC = () => {
  const { colors: COLORS } = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  const styles = useMemo(() => createSettingsStyles(COLORS, SPACING), [COLORS]);

  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bug' | 'feature' | 'improvement' | 'other'>('all');

  // Redirect non-admins
  useEffect(() => {
    if (!isUserAdmin(user)) {
      Alert.alert('Access Denied', 'You do not have permission to access this area.');
      navigation.goBack();
    }
  }, [user, navigation]);

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const feedbackRef = collection(firestore, 'feedback');
      const q = query(feedbackRef, orderBy('createdAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      
      const items: FeedbackItem[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as FeedbackItem));
      
      setFeedback(items);
    } catch (error) {
      console.error('Error loading feedback:', error);
      Alert.alert('Error', 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const updateFeedbackStatus = async (feedbackId: string, newStatus: FeedbackItem['status']) => {
    try {
      const feedbackRef = doc(firestore, 'feedback', feedbackId);
      await updateDoc(feedbackRef, { status: newStatus });
      
      // Update local state
      setFeedback(prev => prev.map(item => 
        item.id === feedbackId ? { ...item, status: newStatus } : item
      ));
      
      Alert.alert('Success', `Feedback marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating feedback:', error);
      Alert.alert('Error', 'Failed to update feedback status');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return '🐛';
      case 'feature': return '✨';
      case 'improvement': return '🚀';
      default: return '💬';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return COLORS.error;
      case 'reviewed': return COLORS.warning;
      case 'in-progress': return COLORS.info;
      case 'completed': return COLORS.success;
      case 'dismissed': return COLORS.textSecondary;
      default: return COLORS.text;
    }
  };

  const filteredFeedback = filter === 'all' 
    ? feedback 
    : feedback.filter(item => item.type === filter);

  const stats = {
    total: feedback.length,
    bugs: feedback.filter(f => f.type === 'bug').length,
    features: feedback.filter(f => f.type === 'feature').length,
    improvements: feedback.filter(f => f.type === 'improvement').length,
    new: feedback.filter(f => f.status === 'new').length,
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
        <Text style={styles.headerTitle}>User Feedback</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={loadFeedback}
        >
          <Text style={styles.backButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Overview</Text>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
            <View style={[styles.settingCard, { flex: 1, minWidth: '45%' }]}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.primary }}>{stats.total}</Text>
              <Text style={styles.settingDescription}>Total Submissions</Text>
            </View>
            <View style={[styles.settingCard, { flex: 1, minWidth: '45%' }]}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.error }}>{stats.new}</Text>
              <Text style={styles.settingDescription}>New/Unreviewed</Text>
            </View>
            <View style={[styles.settingCard, { flex: 1, minWidth: '45%' }]}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.text }}>🐛 {stats.bugs}</Text>
              <Text style={styles.settingDescription}>Bug Reports</Text>
            </View>
            <View style={[styles.settingCard, { flex: 1, minWidth: '45%' }]}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.text }}>✨ {stats.features}</Text>
              <Text style={styles.settingDescription}>Feature Requests</Text>
            </View>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filter</Text>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
            {['all', 'bug', 'feature', 'improvement', 'other'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionCard,
                  { flex: 0, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
                  filter === type && styles.optionSelected,
                ]}
                onPress={() => setFilter(type as any)}
              >
                <Text style={[styles.optionLabel, { marginBottom: 0 }]}>
                  {type === 'all' ? '📋 All' : `${getTypeIcon(type)} ${type.charAt(0).toUpperCase() + type.slice(1)}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Feedback List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Feedback ({filteredFeedback.length})
          </Text>

          {loading ? (
            <View style={{ padding: SPACING.xl, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : filteredFeedback.length === 0 ? (
            <View style={styles.settingCard}>
              <Text style={styles.settingDescription}>No feedback submissions yet</Text>
            </View>
          ) : (
            filteredFeedback.map((item) => (
              <View key={item.id} style={styles.settingCard}>
                <View style={{ marginBottom: SPACING.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.xs }}>
                    <Text style={styles.settingLabel}>
                      {getTypeIcon(item.type)} {item.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: getStatusColor(item.status), fontWeight: 'bold' }}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.settingDescription}>{item.description}</Text>
                  <Text style={[styles.settingDescription, { marginTop: SPACING.xs, fontSize: 11 }]}>
                    👤 {item.username} • 📱 {item.platform} • 📅 {item.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                  </Text>
                </View>

                {/* Status Actions */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs }}>
                  {item.status !== 'reviewed' && (
                    <TouchableOpacity
                      style={{
                        paddingHorizontal: SPACING.sm,
                        paddingVertical: SPACING.xs,
                        backgroundColor: COLORS.warning + '20',
                        borderRadius: 6,
                      }}
                      onPress={() => updateFeedbackStatus(item.id, 'reviewed')}
                    >
                      <Text style={{ fontSize: 12, color: COLORS.warning, fontWeight: '600' }}>✓ Reviewed</Text>
                    </TouchableOpacity>
                  )}
                  {item.status !== 'in-progress' && (
                    <TouchableOpacity
                      style={{
                        paddingHorizontal: SPACING.sm,
                        paddingVertical: SPACING.xs,
                        backgroundColor: COLORS.info + '20',
                        borderRadius: 6,
                      }}
                      onPress={() => updateFeedbackStatus(item.id, 'in-progress')}
                    >
                      <Text style={{ fontSize: 12, color: COLORS.info, fontWeight: '600' }}>🔨 In Progress</Text>
                    </TouchableOpacity>
                  )}
                  {item.status !== 'completed' && (
                    <TouchableOpacity
                      style={{
                        paddingHorizontal: SPACING.sm,
                        paddingVertical: SPACING.xs,
                        backgroundColor: COLORS.success + '20',
                        borderRadius: 6,
                      }}
                      onPress={() => updateFeedbackStatus(item.id, 'completed')}
                    >
                      <Text style={{ fontSize: 12, color: COLORS.success, fontWeight: '600' }}>✅ Completed</Text>
                    </TouchableOpacity>
                  )}
                  {item.status !== 'dismissed' && (
                    <TouchableOpacity
                      style={{
                        paddingHorizontal: SPACING.sm,
                        paddingVertical: SPACING.xs,
                        backgroundColor: COLORS.border,
                        borderRadius: 6,
                      }}
                      onPress={() => updateFeedbackStatus(item.id, 'dismissed')}
                    >
                      <Text style={{ fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' }}>✕ Dismiss</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
