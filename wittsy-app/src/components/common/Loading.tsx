import React, { useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export const Loading: React.FC = () => {
  const styles = useMemo(() => createStyles(), []);
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FFFFFF" />
    </View>
  );
};

const createStyles = () => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6C63FF'
  }
});


