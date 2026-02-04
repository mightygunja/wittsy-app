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
      {hairStyle && (
        <View style={[styles.featureLayer, hairPos]}>
          {Hair[hairStyle as keyof typeof Hair]?.(size * 0.178, HAIR_COLORS.brown) || null}
        </View>
      )}

      {/* Accessories */}
      {accessoryStyles.map((accStyle, index) => {
        const accId = config.accessories[index];
        const accPos = positions.accessories?.[`accessory_${accId}`];
        const scaleFactor = savedCanvasSize ? size / savedCanvasSize : 1;
        const position = accPos ? {
          left: accPos.x * scaleFactor,
          top: accPos.y * scaleFactor
        } : { left: size * 0.25, top: size * 0.30 };
        
        console.log(`👓 Rendering accessory ${index}:`, { accStyle, accId, position });
        
        return (
          <View key={`acc_${index}`} style={[styles.featureLayer, position]}>
            {Accessories[accStyle as keyof typeof Accessories]?.(size * 0.178) || null}
          </View>
        );
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


