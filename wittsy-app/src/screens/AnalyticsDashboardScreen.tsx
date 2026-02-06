/**
 * Analytics Dashboard Screen
 * View app metrics and KPIs - ADMIN ONLY
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { haptics } from '../services/haptics';
import { analytics } from '../services/analytics';
import { monetization } from '../services/monetization';
import { Card } from '../components/common/Card';
import { SPACING, RADIUS } from '../utils/constants'
import { useTheme } from '../hooks/useTheme';
import { BackButton } from '../components/common/BackButton';;

const { width } = Dimensions.get('window');

interface KPI {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
}

export const AnalyticsDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors: COLORS } = useTheme();
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [kpis, setKpis] = useState<KPI[]>([]);
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);


  useEffect(() => {
    loadAnalytics();
    analytics.screenView('AnalyticsDashboard');
  }, [timeRange]);

  const loadAnalytics = async () => {
    // Mock data - in production, fetch from Firebase Analytics
    const mockKPIs: KPI[] = [
      {
        label: 'Daily Active Users',
        value: '2,547',
        change: '+12.5%',
        trend: 'up',
        icon: '👥',
      },
      {
        label: 'Games Played',
        value: '8,932',
        change: '+8.3%',
        trend: 'up',
        icon: '🎮',
      },
      {
        label: 'Revenue',
        value: `$${monetization.getTotalRevenue().toFixed(2)}`,
        change: '+23.7%',
        trend: 'up',
        icon: '💰',
      },
      {
        label: 'Avg Session',
        value: '12.4 min',
        change: '+2.1%',
        trend: 'up',
        icon: '⏱️',
      },
      {
        label: 'Retention (D1)',
        value: '68%',
        change: '+5.2%',
        trend: 'up',
        icon: '🔄',
      },
      {
        label: 'Conversion Rate',
        value: '18.5%',
        change: '-1.3%',
        trend: 'down',
        icon: '💳',
      },
      {
        label: 'Avg Revenue/User',
        value: '$3.42',
        change: '+15.8%',
        trend: 'up',
        icon: '💵',
      },
      {
        label: 'Churn Rate',
        value: '4.2%',
        change: '-0.8%',
        trend: 'up',
        icon: '📉',
      },
    ];

    setKpis(mockKPIs);
  };

  const renderKPICard = (kpi: KPI) => {
    const trendColor =
      kpi.trend === 'up' ? COLORS.success : kpi.trend === 'down' ? '#E74C3C' : COLORS.textSecondary;

    return (
      <Card key={kpi.label} variant="elevated" style={styles.kpiCard}>
        <View style={styles.kpiHeader}>
          <Text style={styles.kpiIcon}>{kpi.icon}</Text>
          <View
            style={[
              styles.trendBadge,
              { backgroundColor: `${trendColor}20` },
            ]}
          >
            <Text style={[styles.trendText, { color: trendColor }]}>
              {kpi.change}
            </Text>
          </View>
        </View>
        <Text style={styles.kpiValue}>{kpi.value}</Text>
        <Text style={styles.kpiLabel}>{kpi.label}</Text>
      </Card>
    );
  };

  return (
    <LinearGradient colors={COLORS.gradientPrimary as any} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Analytics</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          {(['day', 'week', 'month'] as const).map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                timeRange === range && styles.timeRangeButtonActive,
              ]}
              onPress={() => {
                haptics.selection();
                setTimeRange(range);
              }}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  timeRange === range && styles.timeRangeTextActive,
                ]}
              >
                {range === 'day' ? '24h' : range === 'week' ? '7d' : '30d'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* KPIs Grid */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.kpisGrid}>
            {kpis.map((kpi) => renderKPICard(kpi))}
          </View>

          {/* Charts Section */}
          <Card variant="glass" style={styles.chartCard}>
            <Text style={styles.chartTitle}>📊 User Growth</Text>
            <View style={styles.chartPlaceholder}>
              <Text style={styles.chartPlaceholderText}>
                Chart visualization would go here
              </Text>
              <Text style={styles.chartPlaceholderSubtext}>
                Integrate with Victory Charts or similar
              </Text>
            </View>
          </Card>

          <Card variant="glass" style={styles.chartCard}>
            <Text style={styles.chartTitle}>💰 Revenue Trends</Text>
            <View style={styles.chartPlaceholder}>
              <Text style={styles.chartPlaceholderText}>
                Revenue chart would go here
              </Text>
            </View>
          </Card>

          {/* Top Performers */}
          <Card variant="glass" style={styles.performersCard}>
            <Text style={styles.sectionTitle}>🏆 Top Performers</Text>
            <View style={styles.performersList}>
              {[
                { name: 'Most Played Prompt', value: 'What would you do if...' },
                { name: 'Highest Revenue Item', value: 'Fire Hair (🔥)' },
                { name: 'Most Active User', value: 'Player#1234' },
              ].map((item, index) => (
                <View key={index} style={styles.performerItem}>
                  <Text style={styles.performerLabel}>{item.name}</Text>
                  <Text style={styles.performerValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Quick Stats */}
          <Card variant="glass" style={styles.quickStatsCard}>
            <Text style={styles.sectionTitle}>⚡ Quick Stats</Text>
            <View style={styles.quickStatsList}>
              {[
                { label: 'Total Users', value: '12,547' },
                { label: 'Total Games', value: '89,234' },
                { label: 'Total Revenue', value: '$42,891' },
                { label: 'Avg Rating', value: '4.8 ⭐' },
              ].map((stat, index) => (
                <View key={index} style={styles.quickStatItem}>
                  <Text style={styles.quickStatValue}>{stat.value}</Text>
                  <Text style={styles.quickStatLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
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
  backButtonText: { fontSize: 24, color: COLORS.text },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  placeholder: { width: 40 },
  timeRangeContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: COLORS.gold,
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  timeRangeTextActive: {
    color: COLORS.text,
  },
  scrollView: { flex: 1 },
  scrollContent: {
    padding: SPACING.md,
  },
  kpisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  kpiCard: {
    width: (width - SPACING.md * 2 - SPACING.sm) / 2,
    padding: SPACING.sm,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  kpiIcon: { fontSize: 24 },
  trendBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  trendText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  chartCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  chartPlaceholder: {
    height: 200,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
  },
  chartPlaceholderText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  chartPlaceholderSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    opacity: 0.7,
  },
  performersCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  performersList: {
    gap: SPACING.sm,
  },
  performerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  performerLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  performerValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  quickStatsCard: {
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  quickStatsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  quickStatItem: {
    width: (width - SPACING.md * 3 - SPACING.md) / 2,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gold,
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
