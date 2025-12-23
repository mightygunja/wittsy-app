import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { COLORS } from '../../utils/constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: any;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  style,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={COLORS.textMuted}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    color: COLORS.text
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: COLORS.surface,
    color: COLORS.text
  },
  inputError: {
    borderColor: COLORS.error
  },
  error: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4
  }
});
