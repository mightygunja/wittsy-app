/**
 * AvatarDisplay Component
 * Renders a user's avatar based on their saved configuration
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { AvatarConfig, DEFAULT_SKIN_TONES } from '../../types/avatar';
import { SkinBase, Eyes, Mouths, Hair, Accessories, HAIR_COLORS } from './AvatarFeatures';
import { useTheme } from '../../hooks/useTheme';

interface AvatarDisplayProps {
  config: AvatarConfig;
  size?: number;
}

// Map avatar item IDs to SVG style names
const getStyleFromId = (id: string): string => {
  const parts = id.split('_');
  return parts.length > 1 ? parts[1] : parts[0];
};

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({ config, size = 100 }) => {
  const styles = useMemo(() => createStyles(), []);
  console.log('🎨 AvatarDisplay rendering:', { size, config });
  
  const skinColor = DEFAULT_SKIN_TONES.find(s => s.id === config.skin)?.color || '#FFE0BD';
  const eyeStyle = getStyleFromId(config.eyes);
  const mouthStyle = getStyleFromId(config.mouth);
  const hairStyle = config.hair ? getStyleFromId(config.hair) : null;
  const accessoryStyles = config.accessories?.map(accId => getStyleFromId(accId)).filter(style => style !== 'none') || [];
  
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
  
  console.log('🎨 Avatar features:', { skinColor, eyeStyle, mouthStyle, hairStyle, accessories: accessoryStyles });

  // Get saved positions or use defaults
  const positions = config.positions || {};
  
  // Get the saved canvas size from positions
  const savedCanvasSize = positions.eyes?.canvasSize || positions.mouth?.canvasSize || positions.hair?.canvasSize;
  
  console.log('📏 Saved canvas size:', savedCanvasSize, 'Display size:', size);
  
  // If we have saved positions, scale them proportionally
  let eyesPos, mouthPos, hairPos;
  
  if (savedCanvasSize && positions.eyes) {
    const scaleFactor = size / savedCanvasSize;
    console.log('🔢 Scale factor:', scaleFactor);
    
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
    <View style={[styles.container, { width: size, height: size }]}>
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
        {(() => {
          const eyeComponent = Eyes[eyeStyle as keyof typeof Eyes]?.(size * 0.178);
          console.log('👁️ Eyes rendering:', { eyeStyle, exists: !!eyeComponent, pos: eyesPos });
          return eyeComponent || null;
        })()}
      </View>

      {/* Mouth - creator uses 50px on 280px canvas = 17.8% */}
      <View style={[styles.featureLayer, mouthPos]}>
        {Mouths[mouthStyle as keyof typeof Mouths]?.(size * 0.178) || null}
      </View>

      {/* Hair - creator uses 50px on 280px canvas = 17.8% */}
      {hairStyle && hairStyle !== 'none' && (
        <View style={[styles.featureLayer, hairPos]}>
          {(() => {
            const hairComponent = Hair[hairStyle as keyof typeof Hair]?.(size * 0.178, hairColor);
            console.log('💇 Hair rendering:', { hairStyle, hairColor, exists: !!hairComponent, pos: hairPos });
            return hairComponent || null;
          })()}
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
        console.log(`👓 Rendering accessory ${index}:`, { accStyle, accId, exists: !!accComponent, position });
        
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


