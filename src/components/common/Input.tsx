import React, { useMemo, useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, Platform } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: any;
  /** Optional accessory rendered inside the field on the right (e.g. a show/hide password toggle). */
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<TextInput, InputProps>(({
  label,
  error,
  containerStyle,
  style,
  rightElement,
  onFocus,
  onBlur,
  ...props
}, ref) => {
  const { colors: COLORS } = useTheme();
  const [focused, setFocused] = useState(false);
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputWrapper}>
        <TextInput
          ref={ref}
          style={[
            styles.input,
            focused && styles.inputFocused,
            error ? styles.inputError : null,
            rightElement ? styles.inputWithRight : null,
            style,
          ]}
          placeholderTextColor={COLORS.textMuted}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          {...props}
        />
        {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
});

Input.displayName = 'Input';

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    marginBottom: 10
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    color: COLORS.text
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {})
  },
  inputFocused: {
    borderColor: COLORS.primary
  },
  inputError: {
    borderColor: COLORS.error
  },
  inputWithRight: {
    paddingRight: 44
  },
  rightElement: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  error: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4
  }
});
