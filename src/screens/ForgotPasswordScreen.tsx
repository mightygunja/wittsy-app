import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { BackButton } from '../components/common/BackButton';
import { validateEmail } from '../utils/validation';
import { friendlyAuthError } from '../utils/authErrors';
import { SPACING, RADIUS, SHADOWS } from '../utils/constants';
import { useTheme } from '../hooks/useTheme';
import { tabletHorizontalPadding } from '../utils/responsive';

export const ForgotPasswordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors: COLORS } = useTheme();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const [authError, setAuthError] = useState('');
  const [sent, setSent] = useState(false);

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

  const handleResetPassword = async () => {
    if (loading) return;

    const emailError = validateEmail(email.trim());
    if (emailError) {
      setFieldError(emailError);
      return;
    }

    setFieldError('');
    setAuthError('');
    setLoading(true);

    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (error: any) {
      if (error?.message?.includes('auth/user-not-found')) {
        setAuthError('No account found with that email.');
      } else {
        setAuthError(friendlyAuthError(error?.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

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

            {/* Card */}
            <View style={styles.card}>
              {sent ? (
                <>
                  <View style={styles.sentIconCircle}>
                    <Text style={styles.sentIcon}>✓</Text>
                  </View>
                  <Text style={[styles.cardTitle, styles.sentTitle]}>Check your inbox</Text>
                  <Text style={[styles.cardSubtitle, styles.sentSubtitle]}>
                    We sent a password reset link to{'\n'}
                    <Text style={styles.sentEmail}>{email.trim()}</Text>
                  </Text>

                  <Button
                    title="Back to Sign In"
                    onPress={() => navigation.goBack()}
                    size="lg"
                    fullWidth
                  />

                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={handleResetPassword}
                    disabled={loading}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.resendText}>
                      {loading ? 'Sending…' : 'Didn’t get it? Send again'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.cardTitle}>Reset your password</Text>
                  <Text style={styles.cardSubtitle}>
                    Enter the email for your account and we’ll send you a link to reset your password.
                  </Text>

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
                      if (fieldError) setFieldError('');
                    }}
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    autoCorrect={false}
                    returnKeyType="go"
                    onSubmitEditing={handleResetPassword}
                    error={fieldError}
                    editable={!loading}
                    style={styles.input}
                    containerStyle={styles.inputContainer}
                  />

                  <Button
                    title="Send Reset Link"
                    onPress={handleResetPassword}
                    loading={loading}
                    size="lg"
                    fullWidth
                  />
                </>
              )}
            </View>

            {/* Footer */}
            {!sent && (
              <View style={styles.footer}>
                <Text style={styles.footerText}>Remembered it?</Text>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                  disabled={loading}
                >
                  <Text style={styles.footerLink}>Back to sign in</Text>
                </TouchableOpacity>
              </View>
            )}
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
    lineHeight: 20,
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
    marginBottom: SPACING.lg,
  },
  input: {
    paddingVertical: 12,
    fontSize: 15,
    borderRadius: RADIUS.md,
  },
  sentIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: SPACING.base,
  },
  sentIcon: {
    fontSize: 26,
    color: COLORS.success,
    fontWeight: '700',
  },
  sentTitle: {
    textAlign: 'center',
  },
  sentSubtitle: {
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  sentEmail: {
    color: COLORS.text,
    fontWeight: '600',
  },
  resendButton: {
    alignSelf: 'center',
    marginTop: SPACING.lg,
  },
  resendText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
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
