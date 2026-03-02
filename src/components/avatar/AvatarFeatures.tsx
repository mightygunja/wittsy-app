/**
 * Avatar Feature Components
 * Individual SVG-based features (not emojis) that can be composed
 */

import React from 'react';
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
  
  star: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 60 20">
      <G>
        {/* Left star eye */}
        <Path d="M 15 5 L 17 10 L 22 10 L 18 13 L 20 18 L 15 15 L 10 18 L 12 13 L 8 10 L 13 10 Z" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
        {/* Right star eye */}
        <Path d="M 45 5 L 47 10 L 52 10 L 48 13 L 50 18 L 45 15 L 40 18 L 42 13 L 38 10 L 43 10 Z" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
      </G>
    </Svg>
  ),
  
  heart: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 60 20">
      <G>
        {/* Left heart eye */}
        <Path d="M 15 8 C 15 5 12 3 10 5 C 8 3 5 5 5 8 C 5 12 15 17 15 17 C 15 17 25 12 25 8 C 25 5 22 3 20 5 C 18 3 15 5 15 8 Z" fill="#FF1493" />
        {/* Right heart eye */}
        <Path d="M 45 8 C 45 5 42 3 40 5 C 38 3 35 5 35 8 C 35 12 45 17 45 17 C 45 17 55 12 55 8 C 55 5 52 3 50 5 C 48 3 45 5 45 8 Z" fill="#FF1493" />
      </G>
    </Svg>
  ),
  
  money: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 60 20">
      <G>
        {/* Left dollar sign eye */}
        <Circle cx="15" cy="10" r="8" fill="#00AA00" />
        <Path d="M 15 4 L 15 16 M 12 7 Q 15 5 18 7 Q 18 10 15 10 Q 12 10 12 13 Q 15 15 18 13" stroke="#FFD700" strokeWidth="2" fill="none" />
        {/* Right dollar sign eye */}
        <Circle cx="45" cy="10" r="8" fill="#00AA00" />
        <Path d="M 45 4 L 45 16 M 42 7 Q 45 5 48 7 Q 48 10 45 10 Q 42 10 42 13 Q 45 15 48 13" stroke="#FFD700" strokeWidth="2" fill="none" />
      </G>
    </Svg>
  ),
  
  fire: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 60 20">
      <G>
        {/* Left fire eye */}
        <Path d="M 15 18 Q 10 15 10 10 Q 10 5 15 2 Q 18 5 18 8 Q 20 5 20 10 Q 20 15 15 18 Z" fill="#FF4500" />
        <Path d="M 15 15 Q 12 13 12 10 Q 12 7 15 5 Q 17 7 17 10 Q 17 13 15 15 Z" fill="#FFD700" />
        {/* Right fire eye */}
        <Path d="M 45 18 Q 40 15 40 10 Q 40 5 45 2 Q 48 5 48 8 Q 50 5 50 10 Q 50 15 45 18 Z" fill="#FF4500" />
        <Path d="M 45 15 Q 42 13 42 10 Q 42 7 45 5 Q 47 7 47 10 Q 47 13 45 15 Z" fill="#FFD700" />
      </G>
    </Svg>
  ),
  
  crying: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 60 20">
      <G>
        {/* Left eye */}
        <Ellipse cx="15" cy="8" rx="7" ry="9" fill="#000" />
        <Circle cx="17" cy="6" r="2" fill="#fff" />
        {/* Left tear */}
        <Path d="M 15 17 Q 13 20 15 22 Q 17 20 15 17 Z" fill="#4A90E2" />
        {/* Right eye */}
        <Ellipse cx="45" cy="8" rx="7" ry="9" fill="#000" />
        <Circle cx="47" cy="6" r="2" fill="#fff" />
        {/* Right tear */}
        <Path d="M 45 17 Q 43 20 45 22 Q 47 20 45 17 Z" fill="#4A90E2" />
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
  
  tongue: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 60 30">
      <G>
        {/* Mouth */}
        <Path d="M 10 10 Q 30 25 50 10" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Tongue */}
        <Ellipse cx="30" cy="20" rx="8" ry="6" fill="#FF6B9D" />
      </G>
    </Svg>
  ),
  
  kiss: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 60 30">
      <G>
        {/* Lips */}
        <Ellipse cx="30" cy="15" rx="12" ry="8" fill="#FF1493" />
        <Path d="M 18 15 Q 30 10 42 15" stroke="#C71585" strokeWidth="2" fill="none" />
        {/* Heart */}
        <Path d="M 50 8 C 50 6 48 5 47 6 C 46 5 44 6 44 8 C 44 10 50 14 50 14 C 50 14 56 10 56 8 C 56 6 54 5 53 6 C 52 5 50 6 50 8 Z" fill="#FF69B4" />
      </G>
    </Svg>
  ),
  
  fire: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 60 30">
      <G>
        {/* Open mouth */}
        <Ellipse cx="30" cy="15" rx="15" ry="10" fill="#000" />
        {/* Fire coming out */}
        <Path d="M 25 15 Q 20 10 20 5 Q 20 2 25 0 Q 28 3 28 6 Q 30 3 30 5 Q 30 10 25 15 Z" fill="#FF4500" />
        <Path d="M 35 15 Q 30 10 30 5 Q 30 2 35 0 Q 38 3 38 6 Q 40 3 40 5 Q 40 10 35 15 Z" fill="#FF4500" />
        <Path d="M 30 12 Q 27 9 27 6 Q 27 4 30 3 Q 32 5 32 6 Q 32 9 30 12 Z" fill="#FFD700" />
      </G>
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
