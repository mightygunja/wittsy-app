import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { validateEmail, validatePassword } from '../utils/validation';
import { SPACING } from '../utils/constants';
import { useTheme } from '../hooks/useTheme';
import { tabletHorizontalPadding } from '../utils/responsive';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors: COLORS } = useTheme();
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleLogin = async () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({ email: emailError || undefined, password: passwordError || undefined });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'An error occurred');
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
            <Text style={styles.title}>🎮 Wittz</Text>
            <Text style={styles.subtitle}>Welcome back!</Text>

            <View style={{ marginBottom: 24 }}>
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
                placeholder="Enter your password"
                secureTextEntry
                error={errors.password}
              />
            </View>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              size="lg"
              style={styles.button}
            />

            {/* Google Sign-In */}
        {isGoogleSignInAvailable() && (
          <GoogleSignInButton
            onPress={async () => {
              setLoading(true);
              try {
                await signInWithGoogle();
              } catch (error: any) {
                Alert.alert('Sign In Failed', error.message);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            loading={loading}
          />
        )}

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Text
                style={[styles.link, { marginTop: 0, marginLeft: 4 }]}
                onPress={() => navigation.navigate('Register')}
              >
                Sign Up
              </Text>
            </View>

            <Text
              style={styles.link}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              Forgot Password?
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
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24 + tabletHorizontalPadding
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center'
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: COLORS.text,
    letterSpacing: 1
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    color: COLORS.textSecondary,
    fontWeight: '500'
  },
  button: {
    marginBottom: 16,
    height: 48
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    alignItems: 'center'
  },
  footerText: {
    fontSize: 15,
    color: COLORS.textSecondary
  },
  link: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16
  }
});
