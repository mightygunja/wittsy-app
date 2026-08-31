/**
 * AvatarDisplay Component
 * Renders a user's avatar based on their saved configuration
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AvatarConfig, DEFAULT_SKIN_TONES, DEFAULT_BACKGROUNDS, EXPANDED_BACKGROUNDS } from '../../types/avatar';
import { SkinBase, Eyes, Mouths, Hair, Accessories, HAIR_COLORS } from './AvatarFeatures';

interface AvatarDisplayProps {
  config: AvatarConfig;
  size?: number;
}

// Map avatar item IDs to SVG style names
const getStyleFromId = (id: string): string => {
  // Extract style from ID (e.g., 'eyes_happy' -> 'happy', 'hair_short_blue' -> 'short_blue')
  const parts = id.split('_');
  return parts.length > 1 ? parts.slice(1).join('_') : parts[0];
};

// Merged background catalog (defaults first, de-duped by id) — same order the
// creator uses, so an equipped background resolves identically everywhere.
const ALL_BACKGROUNDS = (() => {
  const seen = new Set(DEFAULT_BACKGROUNDS.map((bg) => bg.id));
  return [
    ...DEFAULT_BACKGROUNDS,
    ...EXPANDED_BACKGROUNDS.filter((bg) => !seen.has(bg.id)),
  ] as Array<{ id: string; color?: string; gradient?: string[]; animated?: boolean }>;
})();

// Resolve an equipped background id to renderable colors. Animated backgrounds
// without explicit colors get a static deep-space gradient fallback.
const resolveBackground = (
  backgroundId?: string
): { color?: string; gradient?: string[] } | null => {
  if (!backgroundId) return null;
  const bg = ALL_BACKGROUNDS.find((b) => b.id === backgroundId);
  if (!bg) return null;
  if (bg.gradient && bg.gradient.length >= 2) return { gradient: bg.gradient };
  if (bg.color) return { color: bg.color };
  if (bg.animated) return { gradient: ['#0F2027', '#203A43', '#2C5364'] };
  return null;
};

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({ config, size = 100 }) => {
  const styles = useMemo(() => createStyles(), []);

  const skinColor = DEFAULT_SKIN_TONES.find(s => s.id === config.skin)?.color || '#FFE0BD';
  const eyeStyle = getStyleFromId(config.eyes);
  const mouthStyle = getStyleFromId(config.mouth);
  const hairStyle = config.hair ? getStyleFromId(config.hair) : null;
  const background = resolveBackground(config.background);

  // Extract hair color from hair ID (e.g., 'hair_short_blue' -> 'blue', 'hair_pink' -> 'pink')
  const getHairColor = (hairId: string): string => {
    if (!hairId) return HAIR_COLORS.brown;

    // Check for color in the ID
    const colorMap: { [key: string]: string } = {
      'blue': HAIR_COLORS.blue,
      'pink': HAIR_COLORS.pink,
      'green': HAIR_COLORS.green,
      'purple': HAIR_COLORS.purple,
      'rainbow': HAIR_COLORS.pink, // Use pink as base for rainbow
      'galaxy': HAIR_COLORS.purple, // Use purple for galaxy
      'neon': HAIR_COLORS.green, // Use green for neon
      'cyber': HAIR_COLORS.blue, // Use blue for cyber
      'ice': '#B0E0E6', // Pale blue for ice
      'lava': '#FF4500', // Orange-red for lava
      'fire': '#FF4500', // Orange-red for fire
      'lightning': '#FFD700', // Gold for lightning
      'phoenix': '#FF6347', // Tomato red for phoenix
      'celestial': '#E6E6FA', // Lavender for celestial
      'void': '#2F4F4F', // Dark slate gray for void
      'founder_gold': HAIR_COLORS.blonde, // Gold for founder
      'champion': HAIR_COLORS.blonde, // Gold for champion
    };

    // Check each color keyword in the ID
    for (const [keyword, color] of Object.entries(colorMap)) {
      if (hairId.includes(keyword)) {
        return color;
      }
    }

    // Default to brown if no color found
    return HAIR_COLORS.brown;
  };

  const hairColor = config.hair ? getHairColor(config.hair) : HAIR_COLORS.brown;

  // Get saved positions or use defaults
  const positions = config.positions || {};

  // Get the saved canvas size from positions
  const savedCanvasSize = positions.eyes?.canvasSize || positions.mouth?.canvasSize || positions.hair?.canvasSize;

  // If we have saved positions, scale them proportionally
  let eyesPos, mouthPos, hairPos;

  if (savedCanvasSize && positions.eyes) {
    const scaleFactor = size / savedCanvasSize;

    eyesPos = {
      left: positions.eyes.x * scaleFactor,
      top: positions.eyes.y * scaleFactor
    };
    mouthPos = positions.mouth ? {
      left: positions.mouth.x * scaleFactor,
      top: positions.mouth.y * scaleFactor
    } : { left: size * 0.25, top: size * 0.55 };
    hairPos = positions.hair ? {
      left: positions.hair.x * scaleFactor,
      top: positions.hair.y * scaleFactor
    } : { left: size * 0.10, top: size * 0.05 };
  } else {
    // Use default centered positions
    eyesPos = { left: size * 0.20, top: size * 0.30 };
    mouthPos = { left: size * 0.25, top: size * 0.55 };
    hairPos = { left: size * 0.10, top: size * 0.05 };
  }

  // Base face size - in creator it's 140px on ~280px canvas = 50%
  const faceSize = size * 0.5;

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
        background?.color ? { backgroundColor: background.color } : null,
      ]}
    >
      {/* Equipped background (gradient variant) */}
      {background?.gradient && (
        <LinearGradient
          colors={background.gradient as any}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}

      {/* Base Face - centered like in creator */}
      <View style={[styles.baseLayer, {
        width: faceSize,
        height: faceSize,
        top: (size - faceSize) / 2,
        left: (size - faceSize) / 2,
      }]}>
        <SkinBase color={skinColor} size={faceSize} />
      </View>

      {/* Eyes - creator uses 50px on 280px canvas = 17.8% */}
      <View style={[styles.featureLayer, eyesPos]}>
        {Eyes[eyeStyle as keyof typeof Eyes]?.(size * 0.178) || null}
      </View>

      {/* Mouth - creator uses 50px on 280px canvas = 17.8% */}
      <View style={[styles.featureLayer, mouthPos]}>
        {Mouths[mouthStyle as keyof typeof Mouths]?.(size * 0.178) || null}
      </View>

      {/* Hair - creator uses 50px on 280px canvas = 17.8% */}
      {hairStyle && hairStyle !== 'none' && (
        <View style={[styles.featureLayer, hairPos]}>
          {Hair[hairStyle as keyof typeof Hair]?.(size * 0.178, hairColor) || null}
        </View>
      )}

      {/* Accessories */}
      {config.accessories?.filter(accId => accId && accId !== 'acc_none').map((accId, index) => {
        const accStyle = getStyleFromId(accId);
        if (accStyle === 'none') return null;

        const accPos = positions.accessories?.[`accessory_${accId}`];
        const scaleFactor = savedCanvasSize ? size / savedCanvasSize : 1;
        const position = accPos ? {
          left: accPos.x * scaleFactor,
          top: accPos.y * scaleFactor
        } : { left: size * 0.25, top: size * 0.30 };

        const accComponent = Accessories[accStyle as keyof typeof Accessories]?.(size * 0.178);

        return accComponent ? (
          <View key={`acc_${accId}_${index}`} style={[styles.featureLayer, position]}>
            {accComponent}
          </View>
        ) : null;
      })}
    </View>
  );
};

const createStyles = () => StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  baseLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureLayer: {
    position: 'absolute',
  },
});
