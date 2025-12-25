import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';;

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  label, 
  value, 
  icon, 
  color,
  subtitle 
}) => {
  const { colors: COLORS } = useTheme();
  const cardColor = color || COLORS.primary;
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <View style={styles.container}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={[styles.value, { color: cardColor }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    width: '48%',
    backgroundColor: COLORS.surface,
    padding: 20,
    margin: '1%',
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41
  },
  icon: {
    fontSize: 32,
    marginBottom: 8
  },
  value: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center'
  }
});




