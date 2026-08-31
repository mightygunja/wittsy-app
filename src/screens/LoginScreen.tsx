import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Animated,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { BackButton } from '../components/common/BackButton';
import { AppleSignInButton } from '../components/auth/AppleSignInButton';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { isGoogleSignInAvailable, isAppleSignInAvailable } from '../utils/platform';
import { validateEmail, validatePassword } from '../utils/validation';
import { SPACING, RADIUS, SHADOWS } from '../utils/constants';
import { useTheme } from '../hooks/useTheme';
import { tabletHorizontalPadding } from '../utils/responsive';
import { signInWithEmailAndPassword, linkWithCredential } from 'firebase/auth';
import { auth } from '../services/firebase';
import { friendlyAuthError } from '../utils/authErrors';
import { EyeIcon } from '../components/common/EyeIcon';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors: COLORS } = useTheme();
  const { signIn, signInWithGoogle, signInWithApple } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [authError, setAuthError] = useState('');

  const passwordRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const busy = loading || socialLoading !== null;

  const handleLogin = async () => {
    if (busy) return;

    const emailError = validateEmail(email.trim());
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({ email: emailError || undefined, password: passwordError || undefined });
      return;
    }

    setErrors({});
    setAuthError('');
    setLoading(true);

    try {
      await signIn(email.trim(), password);
      // Success: leave the spinner on — the auth listener will switch
      // navigators and unmount this screen momentarily.
    } catch (error: any) {
      setAuthError(friendlyAuthError(error?.message));
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'apple') => {
    if (busy) return;
    setAuthError('');
    setSocialLoading(provider);

    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else {
        await signInWithApple();
      }
    } catch (error: any) {
      // Apple sign-in can require linking to an existing email/password account.
      // Alert.prompt is iOS-only, which is fine — the Apple button only renders on iOS.
      if (provider === 'apple' && error?.message === 'ACCOUNT_LINKING_REQUIRED') {
        Alert.prompt(
          'Link Your Account',
          `This email (${error.email}) is already registered. Enter your password to link your Apple account:`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setSocialLoading(null) },
            {
              text: 'Link Account',
              onPress: async (linkPassword?: string) => {
                try {
                  const userCred = await signInWithEmailAndPassword(auth, error.email, linkPassword || '');
                  await linkWithCredential(userCred.user, error.pendingCredential);
                  Alert.alert(
                    'Success!',
                    'Your Apple account has been linked. You can now sign in with Apple or email/password.'
                  );
                } catch (linkError: any) {
                  setAuthError(friendlyAuthError(linkError?.message));
                  setSocialLoading(null);
                }
              },
            },
          ],
          'secure-text'
        );
        return;
      }

      if (error?.message !== 'Sign in was cancelled') {
        setAuthError(friendlyAuthError(error?.message));
      }
      setSocialLoading(null);
    }
    // Success: leave the spinner on — the auth listener unmounts this screen.
  };

  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const hasSocialOptions = isAppleSignInAvailable() || isGoogleSignInAvailable();

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[COLORS.background, COLORS.backgroundLight, COLORS.backgroundElevated]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Brand */}
            <View style={styles.brandContainer}>
              <Text style={styles.brandTitle}>Wittz</Text>
              <Text style={styles.brandTagline}>Battle of Wits</Text>
            </View>

            {/* Form card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Welcome back</Text>
              <Text style={styles.cardSubtitle}>Sign in to continue the battle</Text>

              {authError ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{authError}</Text>
                </View>
              ) : null}

              <Input
                label="Email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
                error={errors.email}
                editable={!busy}
                style={styles.input}
                containerStyle={styles.inputContainer}
              />

              <Input
                ref={passwordRef}
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="Your password"
                secureTextEntry={!showPassword}
                autoComplete="password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={handleLogin}
                error={errors.password}
                editable={!busy}
                style={styles.input}
                containerStyle={styles.inputContainer}
                rightElement={
                  <TouchableOpacity
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon color={COLORS.textTertiary} hidden={!showPassword} />
                  </TouchableOpacity>
                }
              />

              <TouchableOpacity
                style={styles.forgotButton}
                onPress={() => navigation.navigate('ForgotPassword')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                disabled={busy}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>

              <Button
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                disabled={socialLoading !== null}
                size="lg"
                fullWidth
              />

              {hasSocialOptions && (
                <>
                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or continue with</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <View style={styles.socialButtons}>
                    {isAppleSignInAvailable() && (
                      <AppleSignInButton
                        onPress={() => handleSocialSignIn('apple')}
                        disabled={busy}
                        loading={socialLoading === 'apple'}
                      />
                    )}
                    {isGoogleSignInAvailable() && (
                      <GoogleSignInButton
                        onPress={() => handleSocialSignIn('google')}
                        disabled={busy}
                        loading={socialLoading === 'google'}
                      />
                    )}
                  </View>
                </>
              )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>New to Wittz?</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                disabled={busy}
              >
                <Text style={styles.footerLink}>Create an account</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.sm,
    zIndex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: SPACING['2xl'],
    paddingHorizontal: SPACING.xl + tabletHorizontalPadding,
  },
  content: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
  },
  brandTitle: {
    fontSize: 44,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -1,
    textAlign: 'center',
  },
  brandTagline: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.7,
    marginTop: SPACING.xxs,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.surfaceGlass,
    borderWidth: 1,
    borderColor: COLORS.surfaceGlassBorder,
    borderRadius: RADIUS['2xl'],
    padding: SPACING.xl,
    ...SHADOWS.lg,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.base,
  },
  errorBannerText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  input: {
    paddingVertical: 12,
    fontSize: 15,
    borderRadius: RADIUS.md,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
    gap: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.divider,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  socialButtons: {
    gap: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
    gap: SPACING.xs,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
