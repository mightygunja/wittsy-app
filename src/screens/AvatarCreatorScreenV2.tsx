/**
 * Professional Avatar Creator V2
 * Industry-standard avatar customization with:
 * - SVG-based compositing (not emoji stacking)
 * - Drag-and-drop positioning
 * - Real-time preview
 * - Smooth animations
 * - Professional UX patterns from top games
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  PanResponder,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { avatarService } from '../services/avatarService';
import { haptics } from '../services/haptics';
import { analytics } from '../services/analytics';
import { firestore } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { SPACING, RADIUS, SHADOWS } from '../utils/constants'
import { useTheme } from '../hooks/useTheme';
import {
  AvatarConfig,
  AvatarCategory,
  DEFAULT_SKIN_TONES,
  DEFAULT_EYES,
  DEFAULT_MOUTHS,
  DEFAULT_HAIR_STYLES,
  DEFAULT_ACCESSORIES,
  DEFAULT_BACKGROUNDS,
  RARITY_COLORS,
  AvatarRarity,
} from '../types/avatar';
import { SkinBase, Eyes, Mouths, Hair, Accessories, SKIN_COLORS, HAIR_COLORS } from '../components/avatar/AvatarFeatures';
import { contentWidth, avatarDisplaySize, avatarGridColumns, tabletHorizontalPadding } from '../utils/responsive';

const width = contentWidth;
const AVATAR_SIZE = avatarDisplaySize;
const CANVAS_SIZE = AVATAR_SIZE; // Store for position calculations

// Map avatar item IDs to SVG style names
const getStyleFromId = (id: string): string => {
  // Extract style from ID (e.g., 'eyes_happy' -> 'happy')
  const parts = id.split('_');
  return parts.length > 1 ? parts.slice(1).join('_') : parts[0];
};

// Extract hair color from hair ID to match AvatarDisplay rendering
const getHairColor = (hairId: string): string => {
  if (!hairId) return HAIR_COLORS.brown;
  
  const colorMap: { [key: string]: string } = {
    'blue': HAIR_COLORS.blue,
    'pink': HAIR_COLORS.pink,
    'green': HAIR_COLORS.green,
    'purple': HAIR_COLORS.purple,
    'rainbow': HAIR_COLORS.pink,
    'galaxy': HAIR_COLORS.purple,
    'neon': HAIR_COLORS.green,
    'cyber': HAIR_COLORS.blue,
    'ice': '#B0E0E6',
    'lava': '#FF4500',
    'fire': '#FF4500',
    'lightning': '#FFD700',
    'phoenix': '#FF6347',
    'celestial': '#E6E6FA',
    'void': '#2F4F4F',
    'founder_gold': HAIR_COLORS.blonde,
    'champion': HAIR_COLORS.blonde,
  };
  
  for (const [keyword, color] of Object.entries(colorMap)) {
    if (hairId.includes(keyword)) {
      return color;
    }
  }
  
  return HAIR_COLORS.brown;
};

interface DraggableFeature {
  id: string;
  type: 'eyes' | 'mouth' | 'hair' | 'accessory';
  style: string; // e.g., 'happy', 'smile', 'short'
  emoji: string; // fallback
  x: number;
  y: number;
  scale: number;
  rotation: number;
  color?: string; // for hair
}

export const AvatarCreatorScreenV2: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors: COLORS } = useTheme();
  const { user } = useAuth();
  const [config, setConfig] = useState<AvatarConfig | null>(null);
  const [unlockedItems, setUnlockedItems] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<AvatarCategory>('skin');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Draggable features state
  const [draggableFeatures, setDraggableFeatures] = useState<DraggableFeature[]>([]);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);

  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('🎨 AVATAR CREATOR V2 LOADED - NEW DRAG & DROP VERSION');
    loadAvatar();
    analytics.screenView('AvatarCreatorV2');
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Real-time listener for unlocked items (detects purchases from Avatar Shop)
  useEffect(() => {
    if (!user) return;

    const avatarRef = doc(firestore, 'avatars', user.uid);
    const unsubscribe = onSnapshot(avatarRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const newUnlockedItems = data?.unlockedItems || [];
        console.log('🔄 Avatar unlocked items updated:', newUnlockedItems.length);
        setUnlockedItems(newUnlockedItems);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const loadAvatar = async () => {
    if (!user) return;

    try {
      const avatarData = await avatarService.getUserAvatar(user.uid);
      if (avatarData) {
        setConfig(avatarData.config);
        setUnlockedItems(avatarData.unlockedItems);
        initializeDraggableFeatures(avatarData.config);
      } else {
        // Create default avatar with only default unlocked items
        const defaultConfig: AvatarConfig = {
          skin: 'skin_light',
          eyes: 'eyes_normal',
          mouth: 'mouth_smile',
          hair: 'hair_short',
          accessories: [],
          clothing: 'clothing_casual',
          background: 'bg_white',
          effects: [],
        };
        setConfig(defaultConfig);
        // Use the same default unlocked items as avatarService
        const defaultUnlocked = [
          'skin_light', 'skin_medium_light', 'skin_medium', 'skin_medium_dark', 'skin_dark',
          'eyes_normal', 'eyes_happy',
          'mouth_smile', 'mouth_grin',
          'hair_short', 'hair_long', 'hair_bald',
          'acc_none', 'acc_glasses',
          'bg_white', 'bg_purple', 'bg_blue',
          'fx_none',
          'clothing_casual',
        ];
        setUnlockedItems(defaultUnlocked);
        initializeDraggableFeatures(defaultConfig);
      }
    } catch (error) {
      console.error('Failed to load avatar:', error);
      // Create default on error with only default unlocked items
      const defaultConfig: AvatarConfig = {
        skin: 'skin_light',
        eyes: 'eyes_normal',
        mouth: 'mouth_smile',
        hair: 'hair_short',
        accessories: [],
        clothing: 'clothing_casual',
        background: 'bg_white',
        effects: [],
      };
      setConfig(defaultConfig);
      // Use the same default unlocked items as avatarService
      const defaultUnlocked = [
        'skin_light', 'skin_medium_light', 'skin_medium', 'skin_medium_dark', 'skin_dark',
        'eyes_normal', 'eyes_happy',
        'mouth_smile', 'mouth_grin',
        'hair_short', 'hair_long', 'hair_bald',
        'acc_none', 'acc_glasses',
        'bg_white', 'bg_purple', 'bg_blue',
        'fx_none',
        'clothing_casual',
      ];
      setUnlockedItems(defaultUnlocked);
      initializeDraggableFeatures(defaultConfig);
    } finally {
      setLoading(false);
    }
  };

  const initializeDraggableFeatures = (avatarConfig: AvatarConfig) => {
    const features: DraggableFeature[] = [];
    const savedPositions = avatarConfig.positions || {};
    
    // Hair (if exists)
    if (avatarConfig.hair) {
      const hairItem = DEFAULT_HAIR_STYLES.find(h => h.id === avatarConfig.hair);
      if (hairItem) {
        const defaultPos = { x: AVATAR_SIZE / 2 - 30, y: 20, scale: 1.2, rotation: 0 };
        const pos = savedPositions.hair || defaultPos;
        features.push({
          id: 'hair',
          type: 'hair',
          style: getStyleFromId(avatarConfig.hair), // e.g., 'short', 'long', 'curly'
          emoji: hairItem.emoji,
          x: pos.x,
          y: pos.y,
          scale: pos.scale,
          rotation: pos.rotation,
          color: getHairColor(avatarConfig.hair), // Extract color from hair ID
        });
      }
    }
    
    // Eyes
    const eyesItem = DEFAULT_EYES.find(e => e.id === avatarConfig.eyes);
    if (eyesItem) {
      const defaultPos = { x: AVATAR_SIZE / 2 - 25, y: AVATAR_SIZE / 2 - 20, scale: 1, rotation: 0 };
      const pos = savedPositions.eyes || defaultPos;
      features.push({
        id: 'eyes',
        type: 'eyes',
        style: getStyleFromId(avatarConfig.eyes), // e.g., 'happy', 'wink', 'normal'
        emoji: eyesItem.emoji,
        x: pos.x,
        y: pos.y,
        scale: pos.scale,
        rotation: pos.rotation,
      });
    }
    
    // Mouth
    const mouthItem = DEFAULT_MOUTHS.find(m => m.id === avatarConfig.mouth);
    if (mouthItem) {
      const defaultPos = { x: AVATAR_SIZE / 2 - 20, y: AVATAR_SIZE / 2 + 30, scale: 1, rotation: 0 };
      const pos = savedPositions.mouth || defaultPos;
      features.push({
        id: 'mouth',
        type: 'mouth',
        style: getStyleFromId(avatarConfig.mouth), // e.g., 'smile', 'grin', 'laugh'
        emoji: mouthItem.emoji,
        x: pos.x,
        y: pos.y,
        scale: pos.scale,
        rotation: pos.rotation,
      });
    }
    
    // Accessories
    avatarConfig.accessories.forEach((accId, index) => {
      const accItem = DEFAULT_ACCESSORIES.find(a => a.id === accId);
      if (accItem && accId !== 'acc_none') {
        // Extract style from accessory ID (e.g., 'acc_glasses' -> 'glasses')
        const style = accId.replace('acc_', '');
        const defaultPos = { x: AVATAR_SIZE / 2 - 30 + (index * 20), y: AVATAR_SIZE / 2 - 10, scale: 1.1, rotation: 0 };
        const pos = savedPositions.accessories?.[`accessory_${accId}`] || defaultPos;
        features.push({
          id: `accessory_${accId}`,
          type: 'accessory',
          style: style,
          emoji: accItem.emoji,
          x: pos.x,
          y: pos.y,
          scale: pos.scale,
          rotation: pos.rotation,
        });
      }
    });
    
    setDraggableFeatures(features);
  };

  const handleSave = async () => {
    if (!user || !config) return;

    setSaving(true);
    haptics.medium();

    try {
      // Build positions object from draggable features
      // Store as percentages of canvas size for proper scaling
      const positions: any = {};
      
      draggableFeatures.forEach(feature => {
        const posData = {
          x: feature.x,
          y: feature.y,
          scale: feature.scale,
          rotation: feature.rotation,
          canvasSize: CANVAS_SIZE, // Store canvas size for scaling reference
        };
        
        if (feature.id === 'eyes') {
          positions.eyes = posData;
        } else if (feature.id === 'mouth') {
          positions.mouth = posData;
        } else if (feature.id === 'hair') {
          positions.hair = posData;
        } else if (feature.id.startsWith('accessory_')) {
          if (!positions.accessories) positions.accessories = {};
          positions.accessories[feature.id] = posData;
        }
      });

      const configWithPositions = {
        ...config,
        positions,
      };

      console.log('💾 Saving avatar config:', {
        skin: config.skin,
        eyes: config.eyes,
        mouth: config.mouth,
        hair: config.hair,
        accessories: config.accessories,
        background: config.background,
        hasPositions: !!positions,
      });
      
      await avatarService.updateAvatarConfig(user.uid, configWithPositions);
      haptics.success();
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save avatar:', error);
      haptics.error();
      Alert.alert('Error', 'Failed to save avatar');
    } finally {
      setSaving(false);
    }
  };

  // Set Save button in navigation header
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{ marginRight: 15, opacity: saving ? 0.5 : 1 }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, saving, handleSave]);

  const handleItemSelect = (category: AvatarCategory, itemId: string) => {
    if (!config) return;

    console.log(`🎨 Selecting ${category}: ${itemId}`);
    haptics.light();

    const newConfig = { ...config };
    const newFeatures = [...draggableFeatures];

    switch (category) {
      case 'skin':
        newConfig.skin = itemId;
        break;
        
      case 'eyes':
        newConfig.eyes = itemId;
        const eyesItem = DEFAULT_EYES.find(e => e.id === itemId);
        const eyesIndex = newFeatures.findIndex(f => f.id === 'eyes');
        if (eyesItem) {
          if (eyesIndex >= 0) {
            newFeatures[eyesIndex].emoji = eyesItem.emoji;
            newFeatures[eyesIndex].style = getStyleFromId(itemId);
          } else {
            newFeatures.push({
              id: 'eyes',
              type: 'eyes',
              style: getStyleFromId(itemId),
              emoji: eyesItem.emoji,
              x: AVATAR_SIZE / 2 - 25,
              y: AVATAR_SIZE / 2 - 20,
              scale: 1,
              rotation: 0,
            });
          }
        }
        break;
        
      case 'mouth':
        newConfig.mouth = itemId;
        const mouthItem = DEFAULT_MOUTHS.find(m => m.id === itemId);
        const mouthIndex = newFeatures.findIndex(f => f.id === 'mouth');
        if (mouthItem) {
          if (mouthIndex >= 0) {
            newFeatures[mouthIndex].emoji = mouthItem.emoji;
            newFeatures[mouthIndex].style = getStyleFromId(itemId);
          } else {
            newFeatures.push({
              id: 'mouth',
              type: 'mouth',
              style: getStyleFromId(itemId),
              emoji: mouthItem.emoji,
              x: AVATAR_SIZE / 2 - 20,
              y: AVATAR_SIZE / 2 + 30,
              scale: 1,
              rotation: 0,
            });
          }
        }
        break;
        
      case 'hair':
        newConfig.hair = itemId;
        const hairItem = DEFAULT_HAIR_STYLES.find(h => h.id === itemId);
        const hairIndex = newFeatures.findIndex(f => f.id === 'hair');
        if (hairItem) {
          if (hairIndex >= 0) {
            newFeatures[hairIndex].emoji = hairItem.emoji;
            newFeatures[hairIndex].style = getStyleFromId(itemId);
            newFeatures[hairIndex].color = getHairColor(itemId); // Update color when changing hair
          } else {
            newFeatures.push({
              id: 'hair',
              type: 'hair',
              style: getStyleFromId(itemId),
              emoji: hairItem.emoji,
              x: AVATAR_SIZE / 2 - 30,
              y: 20,
              scale: 1.2,
              rotation: 0,
              color: getHairColor(itemId), // Extract color from hair ID
            });
          }
        }
        break;
        
      case 'accessories':
        if (newConfig.accessories.includes(itemId)) {
          newConfig.accessories = newConfig.accessories.filter(id => id !== itemId);
          const accIndex = newFeatures.findIndex(f => f.id === `accessory_${itemId}`);
          if (accIndex >= 0) {
            newFeatures.splice(accIndex, 1);
          }
        } else {
          newConfig.accessories = [...newConfig.accessories, itemId];
          const accItem = DEFAULT_ACCESSORIES.find(a => a.id === itemId);
          if (accItem) {
            newFeatures.push({
              id: `accessory_${itemId}`,
              type: 'accessory',
              style: getStyleFromId(itemId),
              emoji: accItem.emoji,
              x: AVATAR_SIZE / 2 - 30,
              y: AVATAR_SIZE / 2 - 10,
              scale: 1.1,
              rotation: 0,
            });
          }
        }
        break;
        
      case 'background':
        newConfig.background = itemId;
        break;
    }

    console.log(`✅ Updated config`);
    setConfig(newConfig);
    setDraggableFeatures(newFeatures);
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
      default:
        return [];
    }
  };

  const isItemSelected = (category: AvatarCategory, itemId: string): boolean => {
    if (!config) return false;

    switch (category) {
      case 'accessories':
        return config.accessories.includes(itemId);
      default:
        return config[category] === itemId;
    }
  };

  const categories: { id: AvatarCategory; name: string; icon: string }[] = [
    { id: 'skin', name: 'Skin', icon: '🎨' },
    { id: 'eyes', name: 'Eyes', icon: '👀' },
    { id: 'mouth', name: 'Mouth', icon: '👄' },
    { id: 'hair', name: 'Hair', icon: '💇' },
    { id: 'accessories', name: 'Accessories', icon: '👓' },
    { id: 'background', name: 'Background', icon: '🌈' },
  ];

  if (loading || !config) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading avatar creator...</Text>
      </View>
    );
  }

  const bgItem = DEFAULT_BACKGROUNDS.find(b => b.id === config.background);
  const bgColor = bgItem?.color || bgItem?.gradient?.[0] || '#E0E7FF';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>

        {/* Avatar Canvas */}
        <View style={styles.canvasSection}>
          <Text style={styles.sectionTitle}>Your Avatar</Text>
          <Text style={styles.sectionSubtitle}>Tap features below to change, drag to reposition</Text>
          
          <View style={[styles.avatarCanvas, { backgroundColor: bgColor }]}>
            {/* Base Face - SVG Skin */}
            <View style={styles.baseFace}>
              <SkinBase 
                color={DEFAULT_SKIN_TONES.find(s => s.id === config.skin)?.color || '#FFE0BD'} 
                size={140} 
              />
            </View>
            
            {/* Draggable Features */}
            {draggableFeatures.map((feature) => (
              <DraggableFeature
                key={feature.id}
                feature={feature}
                isSelected={selectedFeatureId === feature.id}
                onSelect={() => setSelectedFeatureId(feature.id)}
                styles={styles}
                onPositionChange={(x, y) => {
                  setDraggableFeatures(prev =>
                    prev.map(f => f.id === feature.id ? { ...f, x, y } : f)
                  );
                }}
              />
            ))}
          </View>
          
          {selectedFeatureId && (() => {
            const selectedFeature = draggableFeatures.find(f => f.id === selectedFeatureId);
            let displayName = selectedFeatureId;
            
            if (selectedFeature) {
              // Get proper display name from the item lists
              if (selectedFeature.type === 'eyes') {
                const eyeItem = DEFAULT_EYES.find(e => e.id === `eyes_${selectedFeature.style}`);
                displayName = eyeItem?.name || selectedFeature.style;
              } else if (selectedFeature.type === 'mouth') {
                const mouthItem = DEFAULT_MOUTHS.find(m => m.id === `mouth_${selectedFeature.style}`);
                displayName = mouthItem?.name || selectedFeature.style;
              } else if (selectedFeature.type === 'hair') {
                const hairItem = DEFAULT_HAIR_STYLES.find(h => h.id === `hair_${selectedFeature.style}`);
                displayName = hairItem?.name || selectedFeature.style;
              } else if (selectedFeature.type === 'accessory') {
                const accItem = DEFAULT_ACCESSORIES.find(a => a.id === selectedFeature.style);
                displayName = accItem?.name || selectedFeature.style;
              }
            }
            
            return (
              <View style={styles.featureControls}>
                <View style={styles.controlsTextContainer}>
                  <Text style={styles.controlsLabel}>Selected Item</Text>
                  <Text style={styles.controlsTitle}>{displayName}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    setDraggableFeatures(prev => prev.filter(f => f.id !== selectedFeatureId));
                    setSelectedFeatureId(null);
                    haptics.success();
                  }}
                >
                  <Text style={styles.deleteButtonText}>🗑️ Remove</Text>
                </TouchableOpacity>
              </View>
            );
          })()}
        </View>

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

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.itemCard,
                    isSelected && styles.itemCardSelected,
                    !isUnlocked && styles.itemCardLocked,
                    selectedCategory === 'background' && item.color && { backgroundColor: item.color },
                  ]}
                  onPress={() => {
                    if (isUnlocked) {
                      handleItemSelect(selectedCategory, item.id);
                    } else {
                      haptics.warning();
                      Alert.alert('Locked', 'Purchase this item in the Avatar Shop!');
                    }
                  }}
                >
                  {selectedCategory === 'background' ? (
                    <View style={styles.backgroundPreview} />
                  ) : (
                    <Text style={styles.itemEmoji}>{item.emoji || '❓'}</Text>
                  )}
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {isSelected && <View style={styles.selectedBadge} />}
                  {!isUnlocked && (
                    <View style={styles.lockedOverlay}>
                      <Text style={styles.lockIcon}>🔒</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

// Draggable Feature Component
const DraggableFeature: React.FC<{
  feature: DraggableFeature;
  isSelected: boolean;
  onSelect: () => void;
  onPositionChange: (x: number, y: number) => void;
  styles: any;
}> = ({ feature, isSelected, onSelect, onPositionChange, styles }) => {
  const pan = useRef(new Animated.ValueXY({ x: feature.x, y: feature.y })).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        onSelect();
        haptics.light();
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        const x = (pan.x as any)._value;
        const y = (pan.y as any)._value;
        onPositionChange(x, y);
        haptics.medium();
      },
    })
  ).current;

  // Render SVG component based on feature type
  const renderFeature = () => {
    const size = 50;
    
    console.log(`🎨 Rendering feature: ${feature.id}, type: ${feature.type}, style: ${feature.style}`);
    
    if (feature.id === 'eyes') {
      const svgComponent = Eyes[feature.style as keyof typeof Eyes]?.(size);
      if (svgComponent) {
        console.log(`✅ Rendering SVG eyes: ${feature.style}`);
        return svgComponent;
      }
      console.log(`⚠️ No SVG for eyes style: ${feature.style}, using emoji`);
      return <Text style={{ fontSize: 40 }}>{feature.emoji}</Text>;
    } else if (feature.id === 'mouth') {
      const svgComponent = Mouths[feature.style as keyof typeof Mouths]?.(size);
      if (svgComponent) {
        console.log(`✅ Rendering SVG mouth: ${feature.style}`);
        return svgComponent;
      }
      console.log(`⚠️ No SVG for mouth style: ${feature.style}, using emoji`);
      return <Text style={{ fontSize: 40 }}>{feature.emoji}</Text>;
    } else if (feature.id === 'hair') {
      const svgComponent = Hair[feature.style as keyof typeof Hair]?.(size, feature.color || HAIR_COLORS.brown);
      if (svgComponent) {
        console.log(`✅ Rendering SVG hair: ${feature.style}`);
        return svgComponent;
      }
      console.log(`⚠️ No SVG for hair style: ${feature.style}, using emoji`);
      return <Text style={{ fontSize: 40 }}>{feature.emoji}</Text>;
    } else if (feature.id.startsWith('accessory_')) {
      const svgComponent = Accessories[feature.style as keyof typeof Accessories]?.(size);
      if (svgComponent) {
        console.log(`✅ Rendering SVG accessory: ${feature.style}`);
        return svgComponent;
      }
      console.log(`⚠️ No SVG for accessory style: ${feature.style}, using emoji`);
      return <Text style={{ fontSize: 40 }}>{feature.emoji}</Text>;
    }
    
    // Fallback to emoji
    console.log(`⚠️ Unknown feature type, using emoji`);
    return <Text style={{ fontSize: 40 }}>{feature.emoji}</Text>;
  };

  return (
    <Animated.View
      style={[
        styles.draggableFeature,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: feature.scale },
            { rotate: `${feature.rotation}deg` },
          ],
        },
        isSelected && styles.draggableFeatureSelected,
      ]}
      {...panResponder.panHandlers}
    >
      {renderFeature()}
    </Animated.View>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
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
  canvasSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  avatarCanvas: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: RADIUS.xl,
    alignSelf: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  baseFace: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -70 }, { translateY: -70 }],
  },
  baseFaceEmoji: {
    fontSize: 140,
  },
  draggableFeature: {
    position: 'absolute',
    padding: SPACING.xs,
  },
  draggableFeatureSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  featureEmoji: {
    fontSize: 50,
  },
  featureControls: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  controlsTextContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  controlsLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  controlsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  deleteButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.md,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  categoryTabs: {
    maxHeight: 80,
    marginVertical: SPACING.md,
  },
  categoryTabsContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  categoryTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    minWidth: 80,
  },
  categoryTabActive: {
    backgroundColor: COLORS.primary,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  categoryNameActive: {
    color: COLORS.text,
  },
  itemsContainer: {
    flex: 1,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg + tabletHorizontalPadding,
    paddingBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  itemCard: {
    width: (width - SPACING.lg * 2 - SPACING.sm * (avatarGridColumns - 1)) / avatarGridColumns,
    aspectRatio: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xs,
    position: 'relative',
  },
  itemCardSelected: {
    backgroundColor: COLORS.primary + '40',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  itemCardLocked: {
    opacity: 0.5,
  },
  itemEmoji: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  backgroundPreview: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  itemName: {
    fontSize: 10,
    color: COLORS.text,
    textAlign: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: {
    fontSize: 24,
  },
});

