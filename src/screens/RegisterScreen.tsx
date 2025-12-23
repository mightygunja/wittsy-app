import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { validateEmail, validatePassword, validateUsername } from '../utils/validation';
import { COLORS } from '../utils/constants';

export const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { signUp } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; email?: string; password?: string; confirmPassword?: string }>({});

  const handleRegister = async () => {
    const usernameError = validateUsername(username);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmPasswordError = password !== confirmPassword ? 'Passwords do not match' : null;

    if (usernameError || emailError || passwordError || confirmPasswordError) {
      setErrors({
        username: usernameError || undefined,
        email: emailError || undefined,
        password: passwordError || undefined,
        confirmPassword: confirmPasswordError || undefined
      });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await signUp(email, password, username);
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

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
            <Text style={styles.title}>🎮 Wittsy</Text>
            <Text style={styles.subtitle}>Create your account</Text>

            <Input
              label="Username"
              value={username}
              onChangeText={setUsername}
              placeholder="Choose a username"
              autoCapitalize="none"
              error={errors.username}
            />

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password (min 6 characters)"
              secureTextEntry
              autoComplete="off"
              textContentType="none"
              passwordRules="minlength: 6;"
              error={errors.password}
            />

            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secureTextEntry
              autoComplete="off"
              textContentType="none"
              error={errors.confirmPassword}
            />

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              size="sm"
              style={styles.button}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Text
                style={styles.link}
                onPress={() => navigation.navigate('Login')}
              >
                Sign In
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    textAlign: 'center',
    marginBottom: 2,
    color: COLORS.text
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    color: COLORS.textSecondary
  },
  button: {
    marginBottom: 8,
    height: 40
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8
  },
  footerText: {
    fontSize: 13,
    color: COLORS.textSecondary
  },
  link: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600'
  }
});
