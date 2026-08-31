/**
 * Desktop-web welcome page.
 *
 * A proper website landing: two-column hero (copy + CTAs on the left, a
 * live-looking game card on the right), a feature strip, and a footer with
 * the App Store link. Rendered by WelcomeScreen on desktop web instead of
 * the phone layout. Styled to match the app's design system (gradient
 * background, glass cards, brand gradient CTAs).
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { GoogleLogo } from '../auth/GoogleSignInButton';
import { friendlyAuthError } from '../../utils/authErrors';
import { RADIUS, SPACING } from '../../utils/constants';

const APP_STORE_URL = 'https://apps.apple.com/us/app/wittz-party-word-game/id6757277835';

const AppleGlyph: React.FC<{ color: string }> = ({ color }) => (
  <Svg width={22} height={26} viewBox="0 0 20 24" fill="none">
    <Path
      d="M15.5 12.5c0-2.5 2-3.5 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.6.9-.8 0-1.9-.8-3.2-.8-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6.8 1.2 1.7 2.5 3 2.4 1.2 0 1.7-.8 3.2-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.1-1.1 2.9-2.3.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.5-1-2.5-3.9zm-2.3-7c.7-.8 1.1-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z"
      fill={color}
    />
  </Svg>
);

export const WebWelcomeHero: React.FC<{
  navigation: any;
  onGuestStart: () => void;
}> = ({ navigation, onGuestStart }) => {
  const { colors: COLORS } = useTheme();
  const { signInWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogle = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // Success: leave the spinner on — the auth listener swaps navigators.
      return;
    } catch (error: any) {
      if (error?.message !== 'Sign in was cancelled') {
        Alert.alert('Sign In Failed', friendlyAuthError(error?.message));
      }
      setGoogleLoading(false);
    }
  };

  const glass = {
    backgroundColor: COLORS.surfaceGlass,
    borderWidth: 1,
    borderColor: COLORS.surfaceGlassBorder,
  };

  return (
    <ScrollView
      style={[styles.page, { backgroundColor: COLORS.background }]}
      contentContainerStyle={styles.pageContent}
    >
      <LinearGradient
        colors={[COLORS.background, COLORS.backgroundLight, COLORS.backgroundElevated]}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient brand glow behind the hero */}
      <View style={[styles.heroGlow, { backgroundColor: COLORS.primary }]} />

      {/* Top bar: wordmark + sign-in */}
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <Text style={[styles.brandText, { color: COLORS.text }]}>Wittz</Text>
          <Text style={[styles.brandTagline, { color: COLORS.textSecondary }]}>Battle of Wits</Text>
        </View>
        <TouchableOpacity
          style={[styles.signInButton, { borderColor: COLORS.primary }]}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={[styles.signInText, { color: COLORS.primary }]}>Sign In</Text>
        </TouchableOpacity>
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={[styles.headline, { color: COLORS.text }]}>
            The party game where{'\n'}
            <Text style={{ color: COLORS.primary }}>your wit wins.</Text>
          </Text>
          <Text style={[styles.subhead, { color: COLORS.textSecondary }]}>
            Get a prompt. Write the funniest phrase. Vote for the best.
            Play instantly with friends — in the browser or on iPhone.
          </Text>

          <View style={styles.ctaRow}>
            <TouchableOpacity onPress={onGuestStart} activeOpacity={0.9}>
              <View style={styles.primaryCtaShadow}>
                <LinearGradient
                  colors={COLORS.gradientPrimary as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryCta}
                >
                  <Text style={styles.primaryCtaText}>Play Free — No Signup</Text>
                </LinearGradient>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryCta, { borderColor: COLORS.primary }]}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={[styles.secondaryCtaText, { color: COLORS.primary }]}>Create Account</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryCta, styles.googleCta]}
              onPress={handleGoogle}
              disabled={googleLoading}
            >
              <GoogleLogo />
              <Text style={[styles.secondaryCtaText, { color: '#1F1F1F' }]}>
                {googleLoading ? 'Signing in…' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.trustLine, { color: COLORS.textTertiary }]}>
            ✓ Free to play   ·   ✓ No ads   ·   ✓ 3–12 players
          </Text>
        </View>

        {/* Decorative game card */}
        <View style={styles.heroVisual}>
          <View style={[styles.mockCard, glass]}>
            <Text style={[styles.mockLabel, { color: COLORS.primary }]}>PROMPT</Text>
            <Text style={[styles.mockPrompt, { color: COLORS.text }]}>
              "What's the worst advice you could give a time traveler?"
            </Text>
            <View
              style={[
                styles.mockAnswer,
                styles.mockAnswerWinner,
                { backgroundColor: 'rgba(168, 85, 247, 0.14)', borderColor: COLORS.borderGlow },
              ]}
            >
              <Text style={[styles.mockAnswerText, { color: COLORS.text }]}>
                "Just introduce yourself to yourself, what could go wrong"
              </Text>
              <Text style={[styles.mockVotes, { color: COLORS.goldLight }]}>🏆 4 votes</Text>
            </View>
            <View style={[styles.mockAnswer, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
              <Text style={[styles.mockAnswerText, { color: COLORS.textSecondary }]}>
                "Invest in whatever your grandma says"
              </Text>
              <Text style={[styles.mockVotesDim, { color: COLORS.textMuted }]}>2 votes</Text>
            </View>
            <View style={[styles.mockAnswer, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
              <Text style={[styles.mockAnswerText, { color: COLORS.textSecondary }]}>
                "Bring a phone charger"
              </Text>
              <Text style={[styles.mockVotesDim, { color: COLORS.textMuted }]}>1 vote</Text>
            </View>
          </View>
          <View style={[styles.mockGlow, { backgroundColor: COLORS.primary }]} />
        </View>
      </View>

      {/* Feature strip */}
      <View style={styles.features}>
        {[
          { icon: '⚡', title: 'Instant rounds', body: 'Fast prompts, 25-second answers, live voting. No waiting around.' },
          { icon: '🏆', title: 'Ranked & casual', body: 'Battle friends in private rooms or climb the global leaderboard.' },
          { icon: '⭐', title: 'Starred phrases', body: 'Legendary answers get starred and immortalized in the gallery.' },
          { icon: '🎭', title: 'Your avatar', body: 'Unlock hair, accessories, and legendary styles as you play.' },
        ].map(f => (
          <View key={f.title} style={[styles.featureCard, glass]}>
            <View style={[styles.featureIconCircle, { backgroundColor: 'rgba(168, 85, 247, 0.12)' }]}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
            </View>
            <Text style={[styles.featureTitle, { color: COLORS.text }]}>{f.title}</Text>
            <Text style={[styles.featureBody, { color: COLORS.textSecondary }]}>{f.body}</Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: COLORS.divider }]}>
        <TouchableOpacity onPress={() => Linking.openURL(APP_STORE_URL)}>
          <View style={[styles.storeBadge, glass]}>
            <AppleGlyph color={COLORS.text} />
            <View>
              <Text style={[styles.storeBadgeSmall, { color: COLORS.textSecondary }]}>Download on the</Text>
              <Text style={[styles.storeBadgeBig, { color: COLORS.text }]}>App Store</Text>
            </View>
          </View>
        </TouchableOpacity>
        <View style={styles.footerLinks}>
          {[
            ['How to Play', '/how-to-play'],
            ['FAQ', '/faq'],
            ['Support', '/support'],
            ['Privacy', '/privacy'],
            ['Terms', '/terms'],
          ].map(([label, href]) => (
            <TouchableOpacity key={href} onPress={() => { (globalThis as any).location.href = href; }}>
              <Text style={[styles.footerText, { color: COLORS.textSecondary }]}>{label}</Text>
            </TouchableOpacity>
          ))}
          <Text style={[styles.footerText, { color: COLORS.textMuted }]}>
            © {new Date().getFullYear()} Wittz
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // Explicit viewport height, and deliberately NO flex:1: the navigator
  // parent sizes from content, and flex:1 (flex-basis 0%) would override
  // height and grow this ScrollView to its content height — it then never
  // scrolls, and body overflow:hidden clips the footer off-screen.
  // Desktop-web-only component, so 100vh is safe.
  page: { height: '100vh' as any },
  pageContent: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: 48,
    paddingBottom: 48,
  },
  heroGlow: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: 300,
    opacity: 0.07,
    top: -180,
    left: -120,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filter: 'blur(120px)' as any,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
  },
  brand: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  brandText: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  brandTagline: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  signInButton: {
    borderWidth: 1.5,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  signInText: { fontSize: 15, fontWeight: '700' },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 64,
    paddingVertical: 56,
  },
  heroCopy: { flex: 1.1, minWidth: 0 },
  headline: {
    fontSize: 52,
    lineHeight: 62,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 20,
  },
  subhead: {
    fontSize: 19,
    lineHeight: 30,
    marginBottom: 32,
    maxWidth: 520,
  },
  ctaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.base, marginBottom: 24, maxWidth: 600 },
  primaryCtaShadow: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  primaryCta: {
    height: 56,
    paddingHorizontal: 32,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
  secondaryCta: {
    height: 56,
    paddingHorizontal: 28,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCtaText: { fontSize: 16, fontWeight: '700' },
  googleCta: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
    flexDirection: 'row',
    gap: 10,
  },
  trustLine: { fontSize: 14, fontWeight: '500' },

  heroVisual: { flex: 0.9, alignItems: 'center' },
  mockCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: RADIUS['2xl'],
    padding: 28,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    zIndex: 1,
  },
  mockGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.18,
    top: 40,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filter: 'blur(80px)' as any,
  },
  mockLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  mockPrompt: { fontSize: 19, fontWeight: '700', lineHeight: 27, marginBottom: 8 },
  mockAnswer: {
    borderRadius: RADIUS.lg,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  mockAnswerWinner: {
    borderWidth: 1,
  },
  mockAnswerText: { fontSize: 14, flex: 1, lineHeight: 20 },
  mockVotes: { fontSize: 13, fontWeight: '800' },
  mockVotesDim: { fontSize: 13 },

  features: {
    flexDirection: 'row',
    gap: 20,
    paddingVertical: 32,
  },
  featureCard: {
    flex: 1,
    borderRadius: RADIUS.xl,
    padding: 24,
  },
  featureIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  featureIcon: { fontSize: 24 },
  featureTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  featureBody: { fontSize: 14, lineHeight: 21 },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 32,
    borderTopWidth: 1,
    flexWrap: 'wrap',
    gap: 16,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    flexWrap: 'wrap',
  },
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  storeBadgeSmall: { fontSize: 11 },
  storeBadgeBig: { fontSize: 17, fontWeight: '800' },
  footerText: { fontSize: 13 },
});
