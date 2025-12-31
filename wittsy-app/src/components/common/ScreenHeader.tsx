import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SPACING } from '../../utils/constants';

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  rightComponent?: React.ReactNode;
  onBackPress?: () => void;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  showBack = true,
  rightComponent,
  onBackPress,
}) => {
  const navigation = useNavigation();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.header}>
      {showBack ? (
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.backButton} />
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerRight}>
        {rightComponent || <View style={styles.placeholder} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 56,
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
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
  },
});
