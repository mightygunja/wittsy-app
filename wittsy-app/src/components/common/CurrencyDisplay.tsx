import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../services/firebase';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

interface CurrencyDisplayProps {
  variant?: 'full' | 'compact';
  showPremium?: boolean;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({ 
  variant = 'full',
  showPremium = false 
}) => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [coins, setCoins] = useState<number>(0);
  const [premium, setPremium] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    // Real-time listener for user stats
    const userRef = doc(firestore, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setCoins(data?.stats?.coins || 0);
        setPremium(data?.stats?.premium || 0);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error loading currency:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  if (!user) return null;

  if (loading) {
    return (
      <View style={[styles.container, variant === 'compact' && styles.containerCompact]}>
        <ActivityIndicator size="small" color="#FFD700" />
      </View>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.compactContainer}
      onPress={() => navigation.navigate('CoinShop' as never)}
      activeOpacity={0.7}
    >
      <Text style={styles.coinIcon}>🪙</Text>
      <Text style={styles.coinValue}>{coins.toLocaleString()}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  containerCompact: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  coinIcon: {
    fontSize: 14,
  },
  coinValue: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '700',
  },
});
