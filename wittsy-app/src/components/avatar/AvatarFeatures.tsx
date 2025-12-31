/**
 * Avatar Feature Components
 * Individual SVG-based features (not emojis) that can be composed
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Ellipse, G, Rect } from 'react-native-svg';

// SKIN TONES
export const SkinBase: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Circle cx="50" cy="50" r="45" fill={color} />
  </Svg>
);

// EYES
export const Eyes = {
  normal: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 60 20">
      <G>
        {/* Left eye */}
        <Circle cx="15" cy="10" r="7" fill="#000" />
        <Circle cx="17" cy="8" r="2" fill="#fff" />
        {/* Right eye */}
        <Circle cx="45" cy="10" r="7" fill="#000" />
        <Circle cx="47" cy="8" r="2" fill="#fff" />
      </G>
    </Svg>
  ),
  
  happy: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 60 20">
      <G>
        {/* Left eye */}
        <Ellipse cx="15" cy="10" rx="8" ry="10" fill="#000" />
        <Circle cx="17" cy="8" r="3" fill="#fff" />
        {/* Right eye */}
        <Ellipse cx="45" cy="10" rx="8" ry="10" fill="#000" />
        <Circle cx="47" cy="8" r="3" fill="#fff" />
      </G>
    </Svg>
  ),
  
  wink: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 60 20">
      <G>
        {/* Left eye (closed) */}
        <Path d="M 10 10 Q 15 15 20 10" stroke="#000" strokeWidth="2" fill="none" />
        {/* Right eye */}
        <Ellipse cx="45" cy="10" rx="8" ry="10" fill="#000" />
        <Circle cx="47" cy="8" r="3" fill="#fff" />
      </G>
    </Svg>
  ),
  
  surprised: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 60 20">
      <G>
        {/* Left eye */}
        <Circle cx="15" cy="10" r="8" fill="#000" />
        <Circle cx="17" cy="8" r="3" fill="#fff" />
        {/* Right eye */}
        <Circle cx="45" cy="10" r="8" fill="#000" />
        <Circle cx="47" cy="8" r="3" fill="#fff" />
      </G>
    </Svg>
  ),
  
  sleepy: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 60 20">
      <G>
        {/* Left eye */}
        <Ellipse cx="15" cy="10" rx="8" ry="5" fill="#000" />
        {/* Right eye */}
        <Ellipse cx="45" cy="10" rx="8" ry="5" fill="#000" />
      </G>
    </Svg>
  ),
  
  angry: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 60 20">
      <G>
        {/* Left eyebrow */}
        <Path d="M 8 5 L 22 8" stroke="#000" strokeWidth="3" />
        {/* Left eye */}
        <Ellipse cx="15" cy="12" rx="7" ry="8" fill="#000" />
        {/* Right eyebrow */}
        <Path d="M 52 5 L 38 8" stroke="#000" strokeWidth="3" />
        {/* Right eye */}
        <Ellipse cx="45" cy="12" rx="7" ry="8" fill="#000" />
      </G>
    </Svg>
  ),
};

// MOUTHS
export const Mouths = {
  smile: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 60 30">
      <Path
        d="M 10 10 Q 30 25 50 10"
        stroke="#000"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  ),
  
  grin: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 60 30">
      <G>
        <Path
          d="M 10 10 Q 30 25 50 10"
          stroke="#000"
          strokeWidth="3"
          fill="#fff"
          strokeLinecap="round"
        />
        {/* Teeth */}
        <Rect x="18" y="12" width="4" height="8" fill="#fff" />
        <Rect x="24" y="12" width="4" height="8" fill="#fff" />
        <Rect x="30" y="12" width="4" height="8" fill="#fff" />
        <Rect x="36" y="12" width="4" height="8" fill="#fff" />
      </G>
    </Svg>
  ),
  
  laugh: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 60 30">
      <G>
        <Ellipse cx="30" cy="15" rx="20" ry="12" fill="#000" />
        <Ellipse cx="30" cy="13" rx="18" ry="8" fill="#ff6b9d" />
      </G>
    </Svg>
  ),
  
  sad: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 60 30">
      <Path
        d="M 10 20 Q 30 5 50 20"
        stroke="#000"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  ),
  
  neutral: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 60 30">
      <Path
        d="M 10 15 L 50 15"
        stroke="#000"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </Svg>
  ),
  
  surprised: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 60 30">
      <Circle cx="30" cy="15" r="12" fill="#000" />
      <Circle cx="30" cy="15" r="8" fill="#ff6b9d" />
    </Svg>
  ),
  
  smirk: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 60 30">
      <Path
        d="M 10 15 Q 20 20 30 15 Q 40 10 50 15"
        stroke="#000"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  ),
};

// HAIR STYLES
export const Hair = {
  short: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 60">
      <Path
        d="M 10 50 Q 10 10 50 5 Q 90 10 90 50"
        fill={color}
        stroke={color}
        strokeWidth="2"
      />
    </Svg>
  ),
  
  long: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 80">
      <Path
        d="M 10 50 Q 10 10 50 5 Q 90 10 90 50 L 85 75 Q 50 80 15 75 Z"
        fill={color}
        stroke={color}
        strokeWidth="2"
      />
    </Svg>
  ),
  
  curly: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 60">
      <G>
        <Circle cx="20" cy="30" r="15" fill={color} />
        <Circle cx="35" cy="20" r="15" fill={color} />
        <Circle cx="50" cy="15" r="15" fill={color} />
        <Circle cx="65" cy="20" r="15" fill={color} />
        <Circle cx="80" cy="30" r="15" fill={color} />
      </G>
    </Svg>
  ),
  
  spiky: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 60">
      <Path
        d="M 15 50 L 20 10 L 25 50 L 30 5 L 35 50 L 40 15 L 45 50 L 50 5 L 55 50 L 60 15 L 65 50 L 70 5 L 75 50 L 80 10 L 85 50"
        fill={color}
        stroke={color}
        strokeWidth="2"
      />
    </Svg>
  ),
  
  bald: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 60">
      {/* No hair - just returns empty */}
      <G />
    </Svg>
  ),
};

// ACCESSORIES
export const Accessories = {
  glasses: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 80 30">
      <G>
        {/* Left lens */}
        <Circle cx="20" cy="15" r="12" fill="none" stroke="#000" strokeWidth="2" />
        <Circle cx="20" cy="15" r="10" fill="rgba(100,200,255,0.3)" />
        {/* Bridge */}
        <Path d="M 32 15 L 48 15" stroke="#000" strokeWidth="2" />
        {/* Right lens */}
        <Circle cx="60" cy="15" r="12" fill="none" stroke="#000" strokeWidth="2" />
        <Circle cx="60" cy="15" r="10" fill="rgba(100,200,255,0.3)" />
      </G>
    </Svg>
  ),
  
  sunglasses: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 80 30">
      <G>
        {/* Left lens */}
        <Circle cx="20" cy="15" r="12" fill="#000" stroke="#000" strokeWidth="2" />
        {/* Bridge */}
        <Path d="M 32 15 L 48 15" stroke="#000" strokeWidth="2" />
        {/* Right lens */}
        <Circle cx="60" cy="15" r="12" fill="#000" stroke="#000" strokeWidth="2" />
      </G>
    </Svg>
  ),
  
  hat: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 40">
      <G>
        {/* Brim */}
        <Ellipse cx="50" cy="30" rx="45" ry="8" fill="#d32f2f" />
        {/* Crown */}
        <Rect x="25" y="10" width="50" height="20" rx="5" fill="#f44336" />
      </G>
    </Svg>
  ),
  
  crown: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 40">
      <Path
        d="M 10 30 L 20 10 L 30 25 L 50 5 L 70 25 L 80 10 L 90 30 Z"
        fill="#FFD700"
        stroke="#FFA500"
        strokeWidth="2"
      />
    </Svg>
  ),
  
  headphones: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 80">
      <G>
        {/* Band */}
        <Path d="M 20 40 Q 50 10 80 40" stroke="#000" strokeWidth="4" fill="none" />
        {/* Left cup */}
        <Rect x="10" y="40" width="15" height="25" rx="5" fill="#000" />
        {/* Right cup */}
        <Rect x="75" y="40" width="15" height="25" rx="5" fill="#000" />
      </G>
    </Svg>
  ),
};

export const SKIN_COLORS = {
  light: '#FFE0BD',
  medium: '#D4A574',
  tan: '#C68642',
  dark: '#8D5524',
  pale: '#FFF5E1',
};

export const HAIR_COLORS = {
  black: '#000000',
  brown: '#654321',
  blonde: '#FFD700',
  red: '#8B0000',
  gray: '#808080',
  white: '#FFFFFF',
  blue: '#0000FF',
  pink: '#FF69B4',
  green: '#00FF00',
  purple: '#800080',
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
