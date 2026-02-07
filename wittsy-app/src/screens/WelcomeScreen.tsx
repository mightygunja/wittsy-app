/**
 * Welcome Screen
 * First screen users see - offers instant guest access or account creation
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../components/common/Button';
import { SPACING, RADIUS } from '../utils/constants';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { isGoogleSignInAvailable, isAppleSignInAvailable, getAppEnvironment } from '../utils/platform';
import { AppleSignInButton } from '../components/auth/AppleSignInButton';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { signInWithEmailAndPassword, linkWithCredential } from 'firebase/auth';
import { auth } from '../services/firebase';

interface WelcomeScreenProps {
  navigation: any;
  onGuestStart: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation, onGuestStart }) => {
  const { colors: COLORS } = useTheme();
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for play button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
      <LinearGradient
        colors={[COLORS.background, COLORS.backgroundLight, COLORS.backgroundElevated]}
        style={styles.gradient}
      />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo/Title */}
        <View style={styles.logoContainer}>
          <Text style={[styles.title, { color: COLORS.text }]}>Wittz</Text>
          <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>
            Battle of Wits
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureCard}>
            <Text style={[styles.featureText, { color: COLORS.text }]}>
              Compete with friends
            </Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={[styles.featureText, { color: COLORS.text }]}>
              Climb the leaderboard
            </Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={[styles.featureText, { color: COLORS.text }]}>
              Battle with creative phrases
            </Text>
          </View>
        </View>

        {/* CTA Buttons */}
        <View style={styles.buttonsContainer}>
          {/* Primary: Play as Guest */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={onGuestStart}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#A855F7', '#7C3AED'] as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.playGradient}
              >
                <Text style={styles.playText}>Play Now</Text>
                <Text style={styles.playSubtext}>No signup required</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Secondary: Create Account */}
          <Button
            title="Create Account"
            onPress={() => navigation.navigate('Register')}
            variant="outline"
            fullWidth
            style={styles.createButton}
            textStyle={styles.createButtonText}
          />

          {/* Apple Sign-In - Only show on iOS native builds */}
          {isAppleSignInAvailable() && (
            <AppleSignInButton
              onPress={async () => {
                setLoading(true);
                try {
                  console.log('🍎 WelcomeScreen: Starting Apple Sign-In...');
                  await signInWithApple();
                  console.log('✅ WelcomeScreen: Apple Sign-In successful');
                } catch (error: any) {
                  console.error('❌ WelcomeScreen: Apple Sign-In error:', error);
                  
                  // Check if this is an account linking request
                  if (error.message === 'ACCOUNT_LINKING_REQUIRED') {
                    console.log('🔗 Account linking required, prompting for password...');
                    
                    // Prompt user for their password to link accounts
                    Alert.prompt(
                      'Link Your Account',
                      `This email (${error.email}) is already registered. Enter your password to link your Apple account:`,
                      [
                        {
                          text: 'Cancel',
                          style: 'cancel',
                          onPress: () => setLoading(false),
                        },
                        {
                          text: 'Link Account',
                          onPress: async (password) => {
                            try {
                              console.log('🔐 Signing in with email/password to link account...');
                              
                              // Sign in with email/password first
                              const userCred = await signInWithEmailAndPassword(
                                auth,
                                error.email,
                                password || ''
                              );
                              
                              console.log('✅ Signed in with email/password');
                              console.log('🔗 Linking Apple credential...');
                              
                              // Link the Apple credential to the existing account
                              await linkWithCredential(userCred.user, error.pendingCredential);
                              
                              console.log('✅ Apple credential linked successfully!');
                              
                              // User is now signed in with their existing account
                              // No need to create a new profile - it already exists
                              Alert.alert(
                                'Success!',
                                'Your Apple account has been linked. You can now sign in with Apple or email/password.'
                              );
                            } catch (linkError: any) {
                              console.error('❌ Account linking failed:', linkError);
                              
                              let errorMsg = 'Failed to link accounts. Please check your password.';
                              if (linkError.code === 'auth/wrong-password') {
                                errorMsg = 'Incorrect password. Please try again.';
                              } else if (linkError.code === 'auth/too-many-requests') {
                                errorMsg = 'Too many failed attempts. Please try again later.';
                              } else if (linkError.message) {
                                errorMsg = linkError.message;
                              }
                              
                              Alert.alert('Linking Failed', errorMsg);
                            } finally {
                              setLoading(false);
                            }
                          },
                        },
                      ],
                      'secure-text'
                    );
                    return; // Don't set loading to false yet
                  }
                  
                  let errorMessage = 'An error occurred during sign-in';
                  
                  if (error.message) {
                    errorMessage = error.message;
                  } else if (error.code) {
                    errorMessage = `Error code: ${error.code}`;
                  }
                  
                  Alert.alert(
                    'Sign In Failed', 
                    errorMessage,
                    [{ text: 'OK' }]
                  );
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              loading={loading}
            />
          )}

          {/* Google Sign-In */}
          {isGoogleSignInAvailable() ? (
            <GoogleSignInButton
              onPress={async () => {
                setLoading(true);
                try {
                  console.log('🔵 WelcomeScreen: Starting Google Sign-In...');
                  await signInWithGoogle();
                  console.log('✅ WelcomeScreen: Google Sign-In successful');
                } catch (error: any) {
                  console.error('❌ WelcomeScreen: Google Sign-In error:', error);
                  
                  let errorMessage = 'An error occurred during sign-in';
                  
                  if (error.message) {
                    errorMessage = error.message;
                  } else if (error.code) {
                    errorMessage = `Error code: ${error.code}`;
                  }
                  
                  Alert.alert(
                    'Sign In Failed', 
                    errorMessage,
                    [{ text: 'OK' }]
                  );
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              loading={loading}
            />
          ) : null}

          {/* Tertiary: Sign In */}
          <View style={styles.signInContainer}>
            <Text style={[styles.signInText, { color: COLORS.textSecondary }]}>
              Already have an account?
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={styles.signInButton}
            >
              <Text style={[styles.signInLink, { color: COLORS.primary }]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Trust Indicators */}
        <View style={styles.trustContainer}>
          <Text style={[styles.trustText, { color: COLORS.textSecondary }]}>
            ✓ Free to play  •  ✓ No ads  •  ✓ Save progress anytime
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl * 2.5,
  },
  title: {
    fontSize: 64,
    fontWeight: '800',
    marginBottom: SPACING.xs,
    textAlign: 'center',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  featuresContainer: {
    marginBottom: SPACING.xl * 2,
    gap: SPACING.sm,
  },
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonsContainer: {
    gap: SPACING.md,
  },
  playButton: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  playGradient: {
    paddingVertical: SPACING.lg + 2,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  playSubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    textAlign: 'center',
  },
  createButton: {
    height: 56,
  },
  createButtonText: {
    textAlign: 'center',
    width: '100%',
  },
  expoGoNotice: {
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  expoGoText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  expoGoSubtext: {
    fontSize: 11,
    textAlign: 'center',
  },
  signInContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  },
  signInText: {
    fontSize: 14,
    fontWeight: '500',
  },
  signInButton: {
    paddingVertical: 2,
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '700',
  },
  trustContainer: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  trustText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
