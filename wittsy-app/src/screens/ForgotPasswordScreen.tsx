import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { validateEmail } from '../utils/validation';
import { useTheme } from '../hooks/useTheme';;

export const ForgotPasswordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors: COLORS } = useTheme();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleResetPassword = async () => {
    const emailError = validateEmail(email);
    
    if (emailError) {
      setError(emailError);
      return;
    }

    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      Alert.alert(
        'Success',
        'Password reset email sent! Check your inbox.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);


  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              error={error}
            />

            <Button
              title="Send Reset Link"
              onPress={handleResetPassword}
              loading={loading}
              size="sm"
              style={styles.button}
            />

            <Text
              style={styles.link}
              onPress={() => navigation.goBack()}
            >
              Back to Login
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 20
  },
  content: {
    width: '100%'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: COLORS.text
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16
  },
  button: {
    marginBottom: 8,
    height: 40
  },
  link: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8
  }
});

