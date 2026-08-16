/**
 * Desktop-web welcome page.
 *
 * A proper website landing: two-column hero (copy + CTAs on the left, a
 * live-looking game card on the right), a feature strip, and a footer with
 * the App Store link. Rendered by WelcomeScreen on desktop web instead of
 * the phone layout.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';

const APP_STORE_URL = 'https://apps.apple.com/us/app/wittz-party-word-game/id6757277835';

export const WebWelcomeHero: React.FC<{
  navigation: any;
  onGuestStart: () => void;
}> = ({ navigation, onGuestStart }) => {
  const { colors: COLORS } = useTheme();

  return (
    <ScrollView
      style={[styles.page, { backgroundColor: COLORS.background }]}
      contentContainerStyle={styles.pageContent}
    >
      <LinearGradient
        colors={[COLORS.background, COLORS.backgroundLight || COLORS.background]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top bar: wordmark + sign-in */}
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <Text style={styles.brandBolt}>⚡</Text>
          <Text style={[styles.brandText, { color: COLORS.text }]}>Wittz</Text>
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
            <TouchableOpacity onPress={onGuestStart}>
              <LinearGradient
                colors={['#6C63FF', '#5348E8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryCta}
              >
                <Text style={styles.primaryCtaText}>Play Free — No Signup</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryCta, { borderColor: 'rgba(255,255,255,0.25)' }]}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={[styles.secondaryCtaText, { color: COLORS.text }]}>Create Account</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.trustLine, { color: COLORS.textSecondary }]}>
            ✓ Free to play   ✓ No ads   ✓ 3–12 players
          </Text>
        </View>

        {/* Decorative game card */}
        <View style={styles.heroVisual}>
          <View style={[styles.mockCard, { backgroundColor: COLORS.surface }]}>
            <Text style={[styles.mockLabel, { color: COLORS.textSecondary }]}>PROMPT</Text>
            <Text style={[styles.mockPrompt, { color: COLORS.text }]}>
              "What's the worst advice you could give a time traveler?"
            </Text>
            <View style={[styles.mockAnswer, { backgroundColor: 'rgba(108,99,255,0.14)' }]}>
              <Text style={[styles.mockAnswerText, { color: COLORS.text }]}>
                "Just introduce yourself to yourself, what could go wrong"
              </Text>
              <Text style={styles.mockVotes}>🏆 4 votes</Text>
            </View>
            <View style={[styles.mockAnswer, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
              <Text style={[styles.mockAnswerText, { color: COLORS.textSecondary }]}>
                "Invest in whatever your grandma says"
              </Text>
              <Text style={styles.mockVotesDim}>2 votes</Text>
            </View>
            <View style={[styles.mockAnswer, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
              <Text style={[styles.mockAnswerText, { color: COLORS.textSecondary }]}>
                "Bring a phone charger"
              </Text>
              <Text style={styles.mockVotesDim}>1 vote</Text>
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
          <View key={f.title} style={[styles.featureCard, { backgroundColor: COLORS.surface }]}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={[styles.featureTitle, { color: COLORS.text }]}>{f.title}</Text>
            <Text style={[styles.featureBody, { color: COLORS.textSecondary }]}>{f.body}</Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => Linking.openURL(APP_STORE_URL)}>
          <View style={[styles.storeBadge, { borderColor: 'rgba(255,255,255,0.3)' }]}>
            <Text style={styles.storeBadgeIcon}></Text>
            <View>
              <Text style={[styles.storeBadgeSmall, { color: COLORS.textSecondary }]}>Download on the</Text>
              <Text style={[styles.storeBadgeBig, { color: COLORS.text }]}>App Store</Text>
            </View>
          </View>
        </TouchableOpacity>
        <Text style={[styles.footerText, { color: COLORS.textSecondary }]}>
          © {new Date().getFullYear()} Wittz
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1 },
  pageContent: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: 48,
    paddingBottom: 48,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
  },
  brand: { flexDirection: 'row', alignItems: 'center' },
  brandBolt: { fontSize: 26, marginRight: 8 },
  brandText: { fontSize: 26, fontWeight: '900', letterSpacing: 0.5 },
  signInButton: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  signInText: { fontSize: 15, fontWeight: '700' },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 64,
    paddingVertical: 56,
  },
  heroCopy: { flex: 1.1 },
  headline: {
    fontSize: 52,
    lineHeight: 62,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  subhead: {
    fontSize: 19,
    lineHeight: 30,
    marginBottom: 32,
    maxWidth: 520,
  },
  ctaRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  primaryCta: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
  },
  primaryCtaText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  secondaryCta: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  secondaryCtaText: { fontSize: 17, fontWeight: '700' },
  trustLine: { fontSize: 14 },

  heroVisual: { flex: 0.9, alignItems: 'center' },
  mockCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
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
    opacity: 0.15,
    top: 40,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filter: 'blur(80px)' as any,
  },
  mockLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  mockPrompt: { fontSize: 19, fontWeight: '700', lineHeight: 27, marginBottom: 8 },
  mockAnswer: {
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  mockAnswerText: { fontSize: 14, flex: 1, lineHeight: 20 },
  mockVotes: { fontSize: 13, fontWeight: '800', color: '#FFD700' },
  mockVotesDim: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },

  features: {
    flexDirection: 'row',
    gap: 20,
    paddingVertical: 32,
  },
  featureCard: {
    flex: 1,
    borderRadius: 16,
    padding: 24,
  },
  featureIcon: { fontSize: 28, marginBottom: 12 },
  featureTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  featureBody: { fontSize: 14, lineHeight: 21 },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 40,
  },
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  storeBadgeIcon: { fontSize: 24 },
  storeBadgeSmall: { fontSize: 11 },
  storeBadgeBig: { fontSize: 17, fontWeight: '800' },
  footerText: { fontSize: 13 },
});
