import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../services/firebase';
import { useNavigation } from '@react-navigation/native';

interface CurrencyDisplayProps {
  variant?: 'full' | 'compact';
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({ 
  variant = 'full'
}) => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [coins, setCoins] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    console.log('💰 CurrencyDisplay: Setting up real-time listener for user:', user.uid);

    // Real-time listener for user stats
    const userRef = doc(firestore, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const newCoins = data?.stats?.coins || 0;
        console.log('💰 CurrencyDisplay: Firestore update received, new coins:', newCoins);
        console.log('💰 CurrencyDisplay: Previous coins:', coins);
        setCoins(newCoins);
      }
      setLoading(false);
    }, (error) => {
      console.error('❌ CurrencyDisplay: Error loading currency:', error);
      setLoading(false);
    });

    return () => {
      console.log('💰 CurrencyDisplay: Cleaning up listener');
      unsubscribe();
    };
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
      key={`coins-${coins}`}
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
