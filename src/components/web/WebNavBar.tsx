/**
 * Top navigation bar for desktop web.
 *
 * Replaces the phone bottom-nav pattern with standard website chrome:
 * wordmark on the left, primary destinations in the middle, identity on the
 * right. Rendered once at the App level (above the NavigationContainer) and
 * navigates through the shared navigationRef. Renders nothing on native or
 * mobile web, and nothing while signed out (the welcome hero owns that view).
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { isDesktopWeb, WEB_NAVBAR_HEIGHT } from '../../utils/webLayout';

const NAV_ITEMS: { label: string; screen: string; routeMatch: string[] }[] = [
  { label: 'Play', screen: 'Home', routeMatch: ['Home', 'CreateRoom', 'GameRoom', 'BrowseRooms', 'QuickPlay'] },
  { label: 'Leaderboard', screen: 'Leaderboard', routeMatch: ['Leaderboard'] },
  { label: 'Starred', screen: 'StarredPhrases', routeMatch: ['StarredPhrases'] },
  { label: 'Groups', screen: 'Groups', routeMatch: ['Groups', 'GroupDetail', 'CreateGroup'] },
  { label: 'Avatar', screen: 'AvatarCreator', routeMatch: ['AvatarCreator', 'AvatarShop'] },
];

export const WebNavBar: React.FC<{ navigationRef: any }> = ({ navigationRef }) => {
  const { user, userProfile } = useAuth();
  const { colors: COLORS } = useTheme();
  const [currentRoute, setCurrentRoute] = useState<string>('Home');

  useEffect(() => {
    if (!isDesktopWeb || !navigationRef?.current) return;
    const nav = navigationRef.current;
    const unsubscribe = nav.addListener?.('state', () => {
      try {
        setCurrentRoute(nav.getCurrentRoute()?.name || 'Home');
      } catch {}
    });
    return unsubscribe;
  }, [navigationRef, user]);

  if (!isDesktopWeb || !user) return null;

  const go = (screen: string) => {
    try {
      navigationRef?.current?.navigate(screen);
    } catch (e) {
      console.error('WebNavBar navigation failed:', e);
    }
  };

  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: COLORS.surface, borderBottomColor: COLORS.border || 'rgba(255,255,255,0.08)' },
      ]}
    >
      <View style={styles.inner}>
        {/* Wordmark */}
        <TouchableOpacity style={styles.brand} onPress={() => go('Home')}>
          <Text style={styles.brandBolt}>⚡</Text>
          <Text style={[styles.brandText, { color: COLORS.text }]}>Wittz</Text>
        </TouchableOpacity>

        {/* Primary destinations */}
        <View style={styles.links}>
          {NAV_ITEMS.map(item => {
            const active = item.routeMatch.includes(currentRoute);
            return (
              <TouchableOpacity
                key={item.screen}
                onPress={() => go(item.screen)}
                style={[styles.link, active && { backgroundColor: 'rgba(108, 99, 255, 0.16)' }]}
              >
                <Text
                  style={[
                    styles.linkText,
                    { color: active ? COLORS.primary : COLORS.textSecondary },
                    active && styles.linkTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Identity */}
        <View style={styles.right}>
          <TouchableOpacity style={styles.profileChip} onPress={() => go('Profile')}>
            <Text style={[styles.profileName, { color: COLORS.text }]} numberOfLines={1}>
              {userProfile?.username || 'Player'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsButton} onPress={() => go('EnhancedSettings')}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    height: WEB_NAVBAR_HEIGHT,
    borderBottomWidth: 1,
    zIndex: 100,
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  brandBolt: {
    fontSize: 22,
    marginRight: 6,
  },
  brandText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  links: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  link: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '600',
  },
  linkTextActive: {
    fontWeight: '700',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
    maxWidth: 160,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingsButton: {
    padding: 6,
  },
  settingsIcon: {
    fontSize: 18,
  },
});
