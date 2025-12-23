/**
 * Avatar Creator Screen
 * Complete avatar customization with live preview
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { avatarService } from '../services/avatarService';
import { haptics } from '../services/haptics';
import { analytics } from '../services/analytics';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { COLORS, SPACING, RADIUS } from '../utils/constants';
import {
  AvatarConfig,
  AvatarCategory,
  AvatarRarity,
  DEFAULT_SKIN_TONES,
  DEFAULT_EYES,
  DEFAULT_MOUTHS,
  DEFAULT_HAIR_STYLES,
  DEFAULT_ACCESSORIES,
  DEFAULT_BACKGROUNDS,
  DEFAULT_EFFECTS,
  RARITY_COLORS,
} from '../types/avatar';

const { width } = Dimensions.get('window');

export const AvatarCreatorScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [config, setConfig] = useState<AvatarConfig | null>(null);
  const [unlockedItems, setUnlockedItems] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<AvatarCategory>('skin');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    loadAvatar();
    analytics.screenView('AvatarCreator');
  }, []);

  useEffect(() => {
    if (config) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [config]);

  const loadAvatar = async () => {
    if (!user) return;

    try {
      const avatarData = await avatarService.getUserAvatar(user.uid);
      if (avatarData) {
        setConfig(avatarData.config);
        setUnlockedItems(avatarData.unlockedItems);
      }
    } catch (error) {
      console.error('Failed to load avatar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !config) return;

    setSaving(true);
    haptics.medium();

    try {
      await avatarService.updateAvatarConfig(user.uid, config);
      haptics.success();
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save avatar:', error);
      haptics.error();
    } finally {
      setSaving(false);
    }
  };

  const handleItemSelect = (category: AvatarCategory, itemId: string) => {
    if (!config) return;

    haptics.light();

    const newConfig = { ...config };

    switch (category) {
      case 'skin':
        newConfig.skin = itemId;
        break;
      case 'eyes':
        newConfig.eyes = itemId;
        break;
      case 'mouth':
        newConfig.mouth = itemId;
        break;
      case 'hair':
        newConfig.hair = itemId;
        break;
      case 'facial_hair':
        if (newConfig.facialHair) {
          newConfig.facialHair = itemId;
        }
        break;
      case 'accessories':
        if (newConfig.accessories.includes(itemId)) {
          newConfig.accessories = newConfig.accessories.filter((id) => id !== itemId);
        } else {
          newConfig.accessories = [...newConfig.accessories, itemId];
        }
        break;
      case 'clothing':
        newConfig.clothing = itemId;
        break;
      case 'background':
        newConfig.background = itemId;
        break;
      case 'effects':
        if (newConfig.effects.includes(itemId)) {
          newConfig.effects = newConfig.effects.filter((id) => id !== itemId);
        } else {
          newConfig.effects = [...newConfig.effects, itemId];
        }
        break;
    }

    setConfig(newConfig);
  };

  const handleRandomize = () => {
    if (!user) return;

    haptics.medium();
    const randomConfig = avatarService.generateRandomAvatar(unlockedItems);
    setConfig(randomConfig);
  };

  const getCategoryItems = (category: AvatarCategory) => {
    switch (category) {
      case 'skin':
        return DEFAULT_SKIN_TONES;
      case 'eyes':
        return DEFAULT_EYES;
      case 'mouth':
        return DEFAULT_MOUTHS;
      case 'hair':
        return DEFAULT_HAIR_STYLES;
      case 'accessories':
        return DEFAULT_ACCESSORIES;
      case 'background':
        return DEFAULT_BACKGROUNDS;
      case 'effects':
        return DEFAULT_EFFECTS;
      default:
        return [];
    }
  };

  const isItemSelected = (category: AvatarCategory, itemId: string): boolean => {
    if (!config) return false;

    switch (category) {
      case 'accessories':
        return config.accessories.includes(itemId);
      case 'effects':
        return config.effects.includes(itemId);
      default:
        return config[category] === itemId;
    }
  };

  const categories: { id: AvatarCategory; name: string; icon: string }[] = [
    { id: 'skin', name: 'Skin', icon: '👤' },
    { id: 'eyes', name: 'Eyes', icon: '👀' },
    { id: 'mouth', name: 'Mouth', icon: '👄' },
    { id: 'hair', name: 'Hair', icon: '💇' },
    { id: 'accessories', name: 'Accessories', icon: '👓' },
    { id: 'background', name: 'Background', icon: '🎨' },
    { id: 'effects', name: 'Effects', icon: '✨' },
  ];

  if (loading || !config) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading avatar...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={COLORS.gradientPrimary} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              haptics.light();
              navigation.goBack();
            }}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Avatar Creator</Text>
          <TouchableOpacity
            style={styles.randomButton}
            onPress={handleRandomize}
          >
            <Text style={styles.randomButtonText}>🎲</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar Preview */}
        <Animated.View
          style={[
            styles.previewContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Card variant="glass" style={styles.previewCard}>
            <LinearGradient
              colors={
                config.background.startsWith('bg_gradient')
                  ? ['#667EEA', '#764BA2']
                  : [config.background, config.background]
              }
              style={styles.avatarBackground}
            >
              <View style={styles.avatarContainer}>
                {/* Simplified emoji-based avatar preview */}
                <Text style={styles.avatarEmoji}>
                  {DEFAULT_SKIN_TONES.find((s) => s.id === config.skin)?.emoji || '👤'}
                </Text>
                <Text style={styles.avatarFeature}>
                  {DEFAULT_EYES.find((e) => e.id === config.eyes)?.emoji || '👀'}
                </Text>
                <Text style={styles.avatarFeature}>
                  {DEFAULT_MOUTHS.find((m) => m.id === config.mouth)?.emoji || '😊'}
                </Text>
                <Text style={styles.avatarFeature}>
                  {DEFAULT_HAIR_STYLES.find((h) => h.id === config.hair)?.emoji || '💇'}
                </Text>
                {config.accessories.map((accId) => (
                  <Text key={accId} style={styles.avatarAccessory}>
                    {DEFAULT_ACCESSORIES.find((a) => a.id === accId)?.emoji || ''}
                  </Text>
                ))}
                {config.effects.map((fxId) => (
                  <Text key={fxId} style={styles.avatarEffect}>
                    {DEFAULT_EFFECTS.find((f) => f.id === fxId)?.emoji || ''}
                  </Text>
                ))}
              </View>
            </LinearGradient>
          </Card>
        </Animated.View>

        {/* Category Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryTabs}
          contentContainerStyle={styles.categoryTabsContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryTab,
                selectedCategory === category.id && styles.categoryTabActive,
              ]}
              onPress={() => {
                haptics.selection();
                setSelectedCategory(category.id);
              }}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text
                style={[
                  styles.categoryName,
                  selectedCategory === category.id && styles.categoryNameActive,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Items Grid */}
        <ScrollView style={styles.itemsContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.itemsGrid}>
            {getCategoryItems(selectedCategory).map((item: any) => {
              const isUnlocked = unlockedItems.includes(item.id);
              const isSelected = isItemSelected(selectedCategory, item.id);
              const rarity: AvatarRarity = (item.rarity as AvatarRarity) || 'common';

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.itemCard,
                    isSelected && styles.itemCardSelected,
                    !isUnlocked && styles.itemCardLocked,
                  ]}
                  onPress={() => {
                    if (isUnlocked) {
                      handleItemSelect(selectedCategory, item.id);
                    } else {
                      haptics.warning();
                      navigation.navigate('AvatarShop', { itemId: item.id });
                    }
                  }}
                  disabled={!isUnlocked}
                >
                  <LinearGradient
                    colors={
                      isSelected
                        ? (COLORS.gradientPrimary as any)
                        : (['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] as any)
                    }
                    style={styles.itemCardGradient}
                  >
                    <Text style={styles.itemEmoji}>{item.emoji || '❓'}</Text>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {!isUnlocked && (
                      <View style={styles.lockedBadge}>
                        <Text style={styles.lockedIcon}>🔒</Text>
                      </View>
                    )}
                    {rarity !== 'common' && isUnlocked && (
                      <View
                        style={[
                          styles.rarityBadge,
                          { backgroundColor: RARITY_COLORS[rarity] },
                        ]}
                      />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <Button
            title={saving ? 'Saving...' : 'Save Avatar'}
            onPress={handleSave}
            variant="primary"
            size="lg"
            fullWidth
            disabled={saving}
            loading={saving}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: { fontSize: 24, color: COLORS.text },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  randomButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  randomButtonText: { fontSize: 24 },
  previewContainer: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  previewCard: {
    padding: 0,
    overflow: 'hidden',
  },
  avatarBackground: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 120 },
  avatarFeature: { fontSize: 40, position: 'absolute' },
  avatarAccessory: { fontSize: 50, position: 'absolute', top: -20 },
  avatarEffect: { fontSize: 30, position: 'absolute' },
  categoryTabs: {
    maxHeight: 80,
    marginBottom: SPACING.md,
  },
  categoryTabsContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  categoryTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    minWidth: 80,
  },
  categoryTabActive: {
    backgroundColor: COLORS.primary,
  },
  categoryIcon: { fontSize: 24, marginBottom: 4 },
  categoryName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  categoryNameActive: { color: COLORS.text },
  itemsContainer: { flex: 1 },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  itemCard: {
    width: (width - SPACING.md * 2 - SPACING.sm * 3) / 4,
    aspectRatio: 1,
    marginBottom: SPACING.sm,
  },
  itemCardSelected: {
    transform: [{ scale: 1.05 }],
  },
  itemCardLocked: {
    opacity: 0.5,
  },
  itemCardGradient: {
    flex: 1,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xs,
  },
  itemEmoji: { fontSize: 32, marginBottom: 4 },
  itemName: {
    fontSize: 10,
    color: COLORS.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  lockedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  lockedIcon: { fontSize: 16 },
  rarityBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footer: {
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
  },
});
