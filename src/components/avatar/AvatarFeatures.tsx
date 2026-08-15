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
    <Svg width={size} height={size} viewBox="0 0 60 26">
      <G>
        {/* Left eye */}
        <Ellipse cx="15" cy="8" rx="7" ry="9" fill="#000" />
        <Circle cx="17" cy="6" r="2" fill="#fff" />
        {/* Left tear */}
        <Path d="M 15 17 Q 13 21 15 24 Q 17 21 15 17 Z" fill="#4A90E2" />
        {/* Right eye */}
        <Ellipse cx="45" cy="8" rx="7" ry="9" fill="#000" />
        <Circle cx="47" cy="6" r="2" fill="#fff" />
        {/* Right tear */}
        <Path d="M 45 17 Q 43 21 45 24 Q 47 21 45 17 Z" fill="#4A90E2" />
      </G>
    </Svg>
  ),
  
  laser: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 66 20">
      <G>
        {/* Left eye with laser beam */}
        <Circle cx="15" cy="10" r="7" fill="#FF0000" />
        <Circle cx="17" cy="8" r="3" fill="#FFFF00" />
        <Path d="M 22 10 L 30 10 L 32 8 L 32 12 Z" fill="#FF0000" opacity="0.8" />
        {/* Right eye with laser beam */}
        <Circle cx="45" cy="10" r="7" fill="#FF0000" />
        <Circle cx="47" cy="8" r="3" fill="#FFFF00" />
        <Path d="M 52 10 L 62 10 L 64 8 L 64 12 Z" fill="#FF0000" opacity="0.8" />
      </G>
    </Svg>
  ),
  
  galaxy: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 60 20">
      <G>
        {/* Left galaxy eye */}
        <Circle cx="15" cy="10" r="8" fill="#4A00E0" />
        <Circle cx="13" cy="8" r="2" fill="#FFFFFF" opacity="0.8" />
        <Circle cx="17" cy="11" r="1" fill="#FFFFFF" opacity="0.6" />
        <Circle cx="15" cy="13" r="1.5" fill="#8E2DE2" opacity="0.7" />
        {/* Right galaxy eye */}
        <Circle cx="45" cy="10" r="8" fill="#4A00E0" />
        <Circle cx="43" cy="8" r="2" fill="#FFFFFF" opacity="0.8" />
        <Circle cx="47" cy="11" r="1" fill="#FFFFFF" opacity="0.6" />
        <Circle cx="45" cy="13" r="1.5" fill="#8E2DE2" opacity="0.7" />
      </G>
    </Svg>
  ),
  
  rainbow: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 60 20">
      <G>
        {/* Left rainbow eye */}
        <Circle cx="15" cy="10" r="8" fill="#FF0000" />
        <Circle cx="15" cy="10" r="6" fill="#FFA500" />
        <Circle cx="15" cy="10" r="4" fill="#FFFF00" />
        <Circle cx="15" cy="10" r="2" fill="#00FF00" />
        {/* Right rainbow eye */}
        <Circle cx="45" cy="10" r="8" fill="#FF0000" />
        <Circle cx="45" cy="10" r="6" fill="#FFA500" />
        <Circle cx="45" cy="10" r="4" fill="#FFFF00" />
        <Circle cx="45" cy="10" r="2" fill="#00FF00" />
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
  
  thinking: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 60 30">
      <G>
        {/* Mouth */}
        <Path d="M 15 15 Q 25 18 35 15" stroke="#000" strokeWidth="2" fill="none" />
        {/* Thought bubble */}
        <Circle cx="50" cy="8" r="4" fill="#E0E0E0" stroke="#000" strokeWidth="1" />
        <Circle cx="46" cy="14" r="2" fill="#E0E0E0" stroke="#000" strokeWidth="1" />
        <Circle cx="43" cy="18" r="1.5" fill="#E0E0E0" stroke="#000" strokeWidth="1" />
      </G>
    </Svg>
  ),
  
  yawn: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 60 30">
      <G>
        {/* Wide open yawning mouth */}
        <Ellipse cx="30" cy="18" rx="18" ry="12" fill="#000" />
        <Ellipse cx="30" cy="16" rx="16" ry="9" fill="#FF6B9D" />
        {/* Uvula */}
        <Ellipse cx="30" cy="12" rx="3" ry="6" fill="#FF1493" />
      </G>
    </Svg>
  ),
  
  whistle: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 60 30">
      <G>
        {/* Puckered lips */}
        <Ellipse cx="25" cy="15" rx="8" ry="6" fill="#FF6B9D" />
        {/* Musical notes */}
        <Circle cx="40" cy="10" r="3" fill="#000" />
        <Path d="M 43 10 L 43 5" stroke="#000" strokeWidth="2" />
        <Circle cx="48" cy="8" r="2.5" fill="#000" />
        <Path d="M 50.5 8 L 50.5 4" stroke="#000" strokeWidth="1.5" />
      </G>
    </Svg>
  ),
  
  vampire: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 60 30">
      <G>
        {/* Mouth with fangs */}
        <Path d="M 10 12 Q 30 22 50 12" stroke="#000" strokeWidth="3" fill="none" />
        {/* Left fang */}
        <Path d="M 20 12 L 18 20 L 22 12 Z" fill="#FFFFFF" stroke="#000" strokeWidth="1" />
        {/* Right fang */}
        <Path d="M 40 12 L 38 20 L 42 12 Z" fill="#FFFFFF" stroke="#000" strokeWidth="1" />
      </G>
    </Svg>
  ),
  
  zipper: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 60 30">
      <G>
        {/* Zipper line */}
        <Path d="M 15 15 L 45 15" stroke="#000" strokeWidth="3" />
        {/* Zipper teeth */}
        <Rect x="18" y="13" width="3" height="4" fill="#C0C0C0" />
        <Rect x="23" y="13" width="3" height="4" fill="#C0C0C0" />
        <Rect x="28" y="13" width="3" height="4" fill="#C0C0C0" />
        <Rect x="33" y="13" width="3" height="4" fill="#C0C0C0" />
        <Rect x="38" y="13" width="3" height="4" fill="#C0C0C0" />
        {/* Zipper pull */}
        <Circle cx="48" cy="15" r="4" fill="#FFD700" stroke="#000" strokeWidth="1" />
      </G>
    </Svg>
  ),
  
  robot: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 60 30">
      <G>
        {/* Robot grill */}
        <Rect x="15" y="10" width="30" height="12" fill="#C0C0C0" stroke="#000" strokeWidth="2" rx="2" />
        {/* Grill lines */}
        <Path d="M 20 12 L 20 20" stroke="#000" strokeWidth="1" />
        <Path d="M 25 12 L 25 20" stroke="#000" strokeWidth="1" />
        <Path d="M 30 12 L 30 20" stroke="#000" strokeWidth="1" />
        <Path d="M 35 12 L 35 20" stroke="#000" strokeWidth="1" />
        <Path d="M 40 12 L 40 20" stroke="#000" strokeWidth="1" />
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
        d="M 15 50 L 20 10 L 25 50 L 30 5 L 35 50 L 40 15 L 45 50 L 50 5 L 55 50 L 60 15 L 65 50 L 70 5 L 75 50 L 80 10 L 85 50 Z"
        fill={color}
        stroke={color}
        strokeWidth="1"
      />
    </Svg>
  ),
  
  bald: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 60">
      {/* No hair - just returns empty */}
      <G />
    </Svg>
  ),
  
  pixie: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 60">
      <Path
        d="M 15 50 Q 15 15 50 10 Q 85 15 85 50"
        fill={color}
        stroke={color}
        strokeWidth="2"
      />
    </Svg>
  ),
  
  bob: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 70">
      <Path
        d="M 10 50 Q 10 10 50 5 Q 90 10 90 50 L 85 65 Q 50 70 15 65 Z"
        fill={color}
        stroke={color}
        strokeWidth="2"
      />
    </Svg>
  ),
  
  mohawk: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 60">
      <Path
        d="M 40 50 L 45 5 L 50 0 L 55 5 L 60 50"
        fill={color}
        stroke={color}
        strokeWidth="3"
      />
    </Svg>
  ),
  
  afro: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 80">
      <Circle cx="50" cy="40" r="40" fill={color} />
    </Svg>
  ),
  
  ponytail: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 80">
      <G>
        <Path d="M 10 50 Q 10 10 50 5 Q 90 10 90 50" fill={color} stroke={color} strokeWidth="2" />
        <Ellipse cx="50" cy="10" rx="15" ry="25" fill={color} />
      </G>
    </Svg>
  ),
  
  braids: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 80">
      <G>
        <Path d="M 10 50 Q 10 10 50 5 Q 90 10 90 50" fill={color} stroke={color} strokeWidth="2" />
        <Path d="M 25 50 Q 20 60 25 70" stroke={color} strokeWidth="8" fill="none" />
        <Path d="M 75 50 Q 80 60 75 70" stroke={color} strokeWidth="8" fill="none" />
      </G>
    </Svg>
  ),
  
  dreadlocks: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 90">
      <G>
        <Path d="M 12 52 Q 12 12 50 6 Q 88 12 88 52" fill={color} />
        <Path d="M 20 50 L 14 76" stroke={color} strokeWidth="7" strokeLinecap="round" />
        <Path d="M 34 52 L 29 78" stroke={color} strokeWidth="7" strokeLinecap="round" />
        <Path d="M 50 52 L 50 80" stroke={color} strokeWidth="7" strokeLinecap="round" />
        <Path d="M 66 52 L 71 78" stroke={color} strokeWidth="7" strokeLinecap="round" />
        <Path d="M 80 50 L 86 76" stroke={color} strokeWidth="7" strokeLinecap="round" />
      </G>
    </Svg>
  ),

  // ── COMMON (additional) ──────────────────────────────────────────────────

  crew: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 58">
      <G>
        <Path d="M 12 52 Q 12 18 50 11 Q 88 18 88 52" fill={color} />
        {/* Flat-top fade detail */}
        <Path d="M 28 14 Q 50 8 72 14" stroke={color} strokeWidth="7" fill="none" strokeLinecap="round" />
      </G>
    </Svg>
  ),

  buzz: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 55">
      {/* Ultra-close crop — thin band hugging the skull */}
      <Path d="M 14 50 Q 14 20 50 14 Q 86 20 86 50" fill={color} fillOpacity="0.85" />
      <Path d="M 14 50 Q 14 20 50 14 Q 86 20 86 50" fill="none" stroke={color} strokeWidth="5" />
    </Svg>
  ),

  shoulder: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 90">
      <Path d="M 12 55 Q 12 10 50 5 Q 88 10 88 55 L 85 82 Q 50 90 15 82 Z" fill={color} />
    </Svg>
  ),

  wavy: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 95">
      <G>
        <Path d="M 12 52 Q 12 10 50 5 Q 88 10 88 52" fill={color} />
        {/* Left wavy side */}
        <Path d="M 12 52 Q 6 62 12 72 Q 18 82 12 90" stroke={color} strokeWidth="11" fill="none" strokeLinecap="round" />
        {/* Right wavy side */}
        <Path d="M 88 52 Q 94 62 88 72 Q 82 82 88 90" stroke={color} strokeWidth="11" fill="none" strokeLinecap="round" />
        {/* Inner wave texture */}
        <Path d="M 20 54 Q 16 62 20 70 Q 24 78 20 85" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.6" />
        <Path d="M 80 54 Q 84 62 80 70 Q 76 78 80 85" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.6" />
      </G>
    </Svg>
  ),

  straight: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 92">
      <G>
        <Path d="M 14 55 Q 14 10 50 5 Q 86 10 86 55 L 86 85 Q 50 92 14 85 Z" fill={color} />
        {/* Center part line */}
        <Path d="M 50 5 L 50 20" stroke="#00000030" strokeWidth="2" />
      </G>
    </Svg>
  ),

  messy: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 72">
      <G>
        {/* Irregular lumpy top dome */}
        <Path
          d="M 12 52 Q 10 35 14 24 L 18 14 L 16 25 L 24 8 L 28 22 Q 34 9 50 6 Q 66 9 72 22 L 76 8 L 80 25 L 78 14 L 86 24 Q 90 35 88 52 Z"
          fill={color}
        />
        {/* Stray tufts */}
        <Path d="M 32 12 Q 30 5 35 8" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
        <Path d="M 68 12 Q 70 5 65 8" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
      </G>
    </Svg>
  ),

  side_part: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 65">
      <G>
        {/* Full hair body */}
        <Path d="M 12 55 Q 12 12 50 7 Q 88 12 88 55 Z" fill={color} />
        {/* Swept-over left section */}
        <Path d="M 32 10 Q 22 8 14 20 Q 20 12 35 12 Q 48 10 55 14" fill={color} />
        {/* Part line */}
        <Path d="M 32 10 L 32 22" stroke="#00000035" strokeWidth="2" />
      </G>
    </Svg>
  ),

  middle_part: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 88">
      <G>
        <Path d="M 12 55 Q 12 10 50 5 Q 88 10 88 55 L 85 80 Q 50 88 15 80 Z" fill={color} />
        {/* Center part */}
        <Path d="M 50 5 L 50 22" stroke="#00000040" strokeWidth="2.5" />
        {/* Left flow hint */}
        <Path d="M 50 16 Q 36 18 22 24" stroke="#00000025" strokeWidth="1.5" fill="none" />
        {/* Right flow hint */}
        <Path d="M 50 16 Q 64 18 78 24" stroke="#00000025" strokeWidth="1.5" fill="none" />
      </G>
    </Svg>
  ),

  slicked: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 60">
      <G>
        {/* Smooth swept-back dome */}
        <Path d="M 14 54 Q 14 18 50 11 Q 82 18 88 54" fill={color} />
        {/* Slick highlight stripes */}
        <Path d="M 28 18 Q 56 12 80 22" stroke="#ffffff30" strokeWidth="2.5" fill="none" />
        <Path d="M 22 30 Q 52 20 82 32" stroke="#ffffff18" strokeWidth="1.5" fill="none" />
      </G>
    </Svg>
  ),

  // ── COLOR VARIANTS (shape + color injected by getHairColor) ─────────────

  // hair_short_blue → extracted style "short_blue" → spiky-ish electric blue cut
  short_blue: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 58">
      <G>
        <Path d="M 14 52 Q 14 16 50 10 Q 86 16 86 52" fill={color} />
        {/* Slight spiky top */}
        <Path d="M 35 12 L 33 4 L 40 10" fill={color} />
        <Path d="M 50 10 L 48 2 L 55 8" fill={color} />
        <Path d="M 65 12 L 63 4 L 70 10" fill={color} />
      </G>
    </Svg>
  ),

  // hair_pink → bubblegum pink — medium bob silhouette
  pink: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 72">
      <Path d="M 10 52 Q 10 10 50 5 Q 90 10 90 52 L 86 66 Q 50 73 14 66 Z" fill={color} />
    </Svg>
  ),

  // hair_green → toxic green — spiky punk
  green: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 60">
      <Path
        d="M 15 50 L 20 10 L 25 50 L 30 5 L 35 50 L 40 15 L 45 50 L 50 5 L 55 50 L 60 15 L 65 50 L 70 5 L 75 50 L 80 10 L 85 50 Z"
        fill={color}
        stroke={color}
        strokeWidth="1"
      />
    </Svg>
  ),

  // hair_purple → royal purple — long curly
  purple: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 88">
      <G>
        <Circle cx="20" cy="32" r="16" fill={color} />
        <Circle cx="35" cy="20" r="16" fill={color} />
        <Circle cx="50" cy="16" r="16" fill={color} />
        <Circle cx="65" cy="20" r="16" fill={color} />
        <Circle cx="80" cy="32" r="16" fill={color} />
        {/* Lower flowing sections */}
        <Path d="M 12 48 Q 8 62 12 76 Q 16 88 12 88" stroke={color} strokeWidth="10" fill="none" strokeLinecap="round" />
        <Path d="M 88 48 Q 92 62 88 76 Q 84 88 88 88" stroke={color} strokeWidth="10" fill="none" strokeLinecap="round" />
      </G>
    </Svg>
  ),

  // ── RARE ────────────────────────────────────────────────────────────────

  bun: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 72">
      <G>
        {/* Tight base */}
        <Path d="M 22 52 Q 22 22 50 16 Q 78 22 78 52" fill={color} />
        {/* Bun circle */}
        <Circle cx="50" cy="13" r="14" fill={color} />
        {/* Bun highlight */}
        <Circle cx="44" cy="8" r="4" fill="#ffffff25" />
        {/* Elastic band */}
        <Ellipse cx="50" cy="19" rx="13" ry="3" fill="#00000035" />
      </G>
    </Svg>
  ),

  space_buns: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 72">
      <G>
        {/* Narrow centre base */}
        <Path d="M 30 52 Q 30 26 50 20 Q 70 26 70 52" fill={color} />
        {/* Left bun */}
        <Circle cx="22" cy="22" r="14" fill={color} />
        <Circle cx="17" cy="17" r="3.5" fill="#ffffff25" />
        <Ellipse cx="22" cy="28" rx="12" ry="3" fill="#00000035" />
        {/* Right bun */}
        <Circle cx="78" cy="22" r="14" fill={color} />
        <Circle cx="73" cy="17" r="3.5" fill="#ffffff25" />
        <Ellipse cx="78" cy="28" rx="12" ry="3" fill="#00000035" />
      </G>
    </Svg>
  ),

  cornrows: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 65">
      <G>
        {/* Base dome */}
        <Path d="M 12 54 Q 12 12 50 7 Q 88 12 88 54" fill={color} />
        {/* Row ridges — concentric arcs */}
        <Path d="M 26 52 Q 26 20 50 14 Q 74 20 74 52" stroke="#00000050" strokeWidth="3" fill="none" />
        <Path d="M 34 52 Q 34 18 50 13 Q 66 18 66 52" stroke="#00000040" strokeWidth="2.5" fill="none" />
        <Path d="M 42 52 Q 42 16 50 12 Q 58 16 58 52" stroke="#00000030" strokeWidth="2" fill="none" />
      </G>
    </Svg>
  ),

  undercut: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 68">
      <G>
        {/* Shaved sides — thin strokes only */}
        <Path d="M 12 56 Q 12 36 26 24" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" />
        <Path d="M 88 56 Q 88 36 74 24" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" />
        {/* Longer top block */}
        <Path d="M 26 24 Q 26 6 50 4 Q 74 6 74 24 L 70 36 Q 50 44 30 36 Z" fill={color} />
      </G>
    </Svg>
  ),

  pompadour: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 78">
      <G>
        {/* Base sides */}
        <Path d="M 12 54 Q 12 22 50 16 Q 88 22 88 54" fill={color} />
        {/* Pompadour wave */}
        <Path d="M 24 20 Q 30 4 50 0 Q 70 4 76 20 Q 64 8 50 6 Q 36 8 24 20 Z" fill={color} />
        {/* Wave shadow for depth */}
        <Path d="M 30 18 Q 38 8 50 6 Q 62 8 70 18 Q 58 12 50 10 Q 42 12 30 18" fill="#00000020" />
      </G>
    </Svg>
  ),

  quiff: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 66">
      <G>
        {/* Base */}
        <Path d="M 12 54 Q 12 24 50 16 Q 88 24 88 54" fill={color} />
        {/* Quiff rise — smaller than pompadour */}
        <Path d="M 30 20 Q 36 8 50 5 Q 64 8 70 20 Q 60 10 50 8 Q 40 10 30 20 Z" fill={color} />
        {/* Sweep line */}
        <Path d="M 36 12 Q 50 7 64 12" stroke="#ffffff28" strokeWidth="2" fill="none" />
      </G>
    </Svg>
  ),

  shag: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 90">
      <G>
        {/* Main body */}
        <Path d="M 12 56 Q 12 10 50 5 Q 88 10 88 56 L 85 72 Q 50 80 15 72 Z" fill={color} />
        {/* Ragged ends */}
        <Path d="M 15 68 Q 12 76 15 82" stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" />
        <Path d="M 30 72 Q 28 80 31 86" stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" />
        <Path d="M 50 74 Q 49 82 51 88" stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" />
        <Path d="M 70 72 Q 72 80 69 86" stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" />
        <Path d="M 85 68 Q 88 76 85 82" stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" />
        {/* Fringe chunks */}
        <Path d="M 26 22 Q 22 30 26 34" fill={color} />
        <Path d="M 40 15 Q 37 22 40 27" fill={color} />
      </G>
    </Svg>
  ),

  wolf_cut: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 94">
      <G>
        {/* Body */}
        <Path d="M 14 56 Q 14 10 50 5 Q 86 10 86 56 L 82 74 Q 50 82 18 74 Z" fill={color} />
        {/* Face-framing curtain pieces */}
        <Path d="M 14 48 Q 7 58 10 72 Q 7 64 5 74" stroke={color} strokeWidth="10" fill="none" strokeLinecap="round" />
        <Path d="M 86 48 Q 93 58 90 72 Q 93 64 95 74" stroke={color} strokeWidth="10" fill="none" strokeLinecap="round" />
        {/* Layer texture */}
        <Path d="M 20 30 Q 15 40 18 48" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.65" />
        <Path d="M 80 30 Q 85 40 82 48" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.65" />
        {/* Centre part */}
        <Path d="M 50 5 L 50 18" stroke="#00000035" strokeWidth="2" />
      </G>
    </Svg>
  ),

  mullet: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 105">
      <G>
        {/* Short front/top dome */}
        <Path d="M 18 52 Q 18 14 50 9 Q 82 14 82 52" fill={color} />
        {/* Long back — extends down */}
        <Path d="M 22 50 Q 18 68 20 100 Q 50 106 80 100 Q 82 68 78 50" fill={color} />
        {/* Business-front clean line */}
        <Path d="M 28 18 Q 50 12 72 18" stroke="#00000025" strokeWidth="2" fill="none" />
      </G>
    </Svg>
  ),

  french_braid: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 105">
      <G>
        {/* Base dome */}
        <Path d="M 15 52 Q 15 10 50 5 Q 85 10 85 52" fill={color} />
        {/* Braid centre body */}
        <Path
          d="M 43 50 Q 50 54 57 50 Q 50 58 43 54 Q 50 62 57 58 Q 50 66 43 62 Q 50 70 57 66 Q 50 74 43 70 Q 50 78 57 74 Q 50 84 43 80 Q 50 92 57 88"
          stroke={color} strokeWidth="8" fill="none" strokeLinecap="round"
        />
        {/* Braid shading weave */}
        <Path
          d="M 57 50 Q 50 54 43 50 Q 50 58 57 54 Q 50 62 43 58 Q 50 66 57 62 Q 50 70 43 66 Q 50 74 57 70 Q 50 78 43 74 Q 50 84 57 80 Q 50 92 43 88"
          stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.45"
        />
      </G>
    </Svg>
  ),

  // ── EPIC ─────────────────────────────────────────────────────────────────

  rainbow: (size: number, _color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 88">
      <G>
        {/* Stacked colour bands from outermost (violet) to innermost (red) */}
        <Path d="M 10 58 Q 10 8 50 3 Q 90 8 90 58 L 87 80 Q 50 88 13 80 Z" fill="#8B00FF" />
        <Path d="M 12 56 Q 12 10 50 5 Q 88 10 88 56 L 85 78 Q 50 86 15 78 Z" fill="#4B0082" />
        <Path d="M 14 54 Q 14 12 50 7 Q 86 12 86 54 L 83 75 Q 50 83 17 75 Z" fill="#0000CD" />
        <Path d="M 16 52 Q 16 14 50 9 Q 84 14 84 52 L 81 72 Q 50 80 19 72 Z" fill="#008000" />
        <Path d="M 18 50 Q 18 16 50 11 Q 82 16 82 50 L 79 69 Q 50 77 21 69 Z" fill="#FFD700" />
        <Path d="M 20 48 Q 20 18 50 13 Q 80 18 80 48 L 77 66 Q 50 74 23 66 Z" fill="#FF7F00" />
        <Path d="M 22 46 Q 22 20 50 15 Q 78 20 78 46 L 75 63 Q 50 71 25 63 Z" fill="#FF0000" />
      </G>
    </Svg>
  ),

  galaxy: (size: number, _color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 88">
      <G>
        {/* Deep space base */}
        <Path d="M 12 56 Q 12 10 50 5 Q 88 10 88 56 L 85 80 Q 50 88 15 80 Z" fill="#0d0020" />
        {/* Nebula colour washes */}
        <Path d="M 14 50 Q 20 22 50 14 Q 80 22 86 50 Q 68 32 50 26 Q 32 32 14 50 Z" fill="#4B0082" opacity="0.7" />
        <Path d="M 28 16 Q 50 8 72 16 Q 56 12 50 10 Q 44 12 28 16 Z" fill="#7B00CC" opacity="0.5" />
        {/* Stars */}
        <Circle cx="24" cy="26" r="1.5" fill="#FFFFFF" />
        <Circle cx="38" cy="15" r="1" fill="#FFFFFF" />
        <Circle cx="54" cy="20" r="2" fill="#FFFFFF" />
        <Circle cx="70" cy="15" r="1.5" fill="#FFFFFF" />
        <Circle cx="80" cy="28" r="1" fill="#FFFFFF" />
        <Circle cx="34" cy="36" r="1" fill="#FFFFFF" opacity="0.75" />
        <Circle cx="66" cy="36" r="1" fill="#FFFFFF" opacity="0.75" />
        <Circle cx="50" cy="30" r="1.5" fill="#8E2DE2" />
        <Circle cx="20" cy="42" r="1" fill="#FFFFFF" opacity="0.55" />
        <Circle cx="78" cy="42" r="1" fill="#FFFFFF" opacity="0.55" />
      </G>
    </Svg>
  ),

  neon: (size: number, _color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 84">
      <G>
        {/* Near-black base */}
        <Path d="M 12 54 Q 12 10 50 5 Q 88 10 88 54 L 85 74 Q 50 82 15 74 Z" fill="#030f03" />
        {/* Glow halos */}
        <Path d="M 14 52 Q 14 12 50 7 Q 86 12 86 52 L 83 72 Q 50 80 17 72 Z" fill="#39FF14" opacity="0.12" />
        <Path d="M 16 50 Q 16 14 50 9 Q 84 14 84 50 L 81 70 Q 50 78 19 70 Z" fill="#39FF14" opacity="0.20" />
        {/* Bright neon layer */}
        <Path d="M 18 48 Q 18 16 50 11 Q 82 16 82 48 L 79 67 Q 50 75 21 67 Z" fill="#39FF14" />
        {/* Shine streaks */}
        <Path d="M 28 18 Q 50 10 72 18" stroke="#CCFFCC" strokeWidth="2.5" fill="none" opacity="0.65" />
        <Path d="M 24 30 Q 50 20 76 30" stroke="#AAFFAA" strokeWidth="1.5" fill="none" opacity="0.45" />
        {/* Hot-spot dots */}
        <Circle cx="28" cy="20" r="2.5" fill="#FFFFFF" opacity="0.8" />
        <Circle cx="50" cy="12" r="3" fill="#FFFFFF" opacity="0.8" />
        <Circle cx="72" cy="20" r="2.5" fill="#FFFFFF" opacity="0.8" />
      </G>
    </Svg>
  ),

  cyber: (size: number, _color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 78">
      <G>
        {/* Shaved left side */}
        <Path d="M 12 56 Q 12 30 28 20" stroke="#1a1a1a" strokeWidth="6" fill="none" strokeLinecap="round" />
        {/* Full right side */}
        <Path d="M 74 20 Q 90 30 88 56 L 85 70 Q 66 78 52 72 L 46 54 Q 50 30 74 20 Z" fill="#111111" />
        {/* Top connecting bridge */}
        <Path d="M 28 20 Q 50 8 74 20 L 62 26 Q 50 14 38 20 Z" fill="#111111" />
        {/* Cyan neon stripe */}
        <Path d="M 74 20 Q 80 32 78 48" stroke="#00FFFF" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <Path d="M 74 20 Q 80 32 78 48" stroke="#00FFFF" strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.18" />
        {/* Shaved-side circuit lines */}
        <Path d="M 18 42 Q 24 46 20 52" stroke="#00FFFF" strokeWidth="1.5" fill="none" opacity="0.55" />
        <Path d="M 14 32 Q 22 36 18 42" stroke="#00FFFF" strokeWidth="1.2" fill="none" opacity="0.45" />
      </G>
    </Svg>
  ),

  ice: (size: number, _color: string) => (
    <Svg width={size} height={size} viewBox="0 -8 100 92">
      <G>
        {/* Icy pale-blue base */}
        <Path d="M 12 54 Q 12 10 50 5 Q 88 10 88 54 L 85 72 Q 50 80 15 72 Z" fill="#87CEEB" />
        {/* Ice spikes */}
        <Path d="M 20 16 L 16 2 L 22 12 L 26 -2 L 30 14 Z" fill="#B0E8FF" stroke="#7EC8E3" strokeWidth="1" />
        <Path d="M 38 10 L 35 -2 L 40 8 L 44 -4 L 47 9 Z" fill="#D0F0FF" stroke="#7EC8E3" strokeWidth="1" />
        <Path d="M 53 9 L 50 -4 L 55 7 L 59 -2 L 62 10 Z" fill="#D0F0FF" stroke="#7EC8E3" strokeWidth="1" />
        <Path d="M 70 10 L 67 -2 L 72 8 L 76 -4 L 80 16 Z" fill="#B0E8FF" stroke="#7EC8E3" strokeWidth="1" />
        {/* Crystal facets */}
        <Path d="M 24 26 L 28 20 L 32 26 L 28 32 Z" fill="#FFFFFF" opacity="0.5" />
        <Path d="M 68 26 L 72 20 L 76 26 L 72 32 Z" fill="#FFFFFF" opacity="0.5" />
        <Circle cx="50" cy="20" r="3.5" fill="#FFFFFF" opacity="0.65" />
        {/* Glitter */}
        <Circle cx="36" cy="32" r="1.5" fill="#FFFFFF" opacity="0.7" />
        <Circle cx="64" cy="32" r="1.5" fill="#FFFFFF" opacity="0.7" />
      </G>
    </Svg>
  ),

  lava: (size: number, _color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 84">
      <G>
        {/* Dark volcanic base */}
        <Path d="M 12 54 Q 12 10 50 5 Q 88 10 88 54 L 85 74 Q 50 82 15 74 Z" fill="#1a0800" />
        {/* Lava mid layer */}
        <Path d="M 14 52 Q 14 12 50 7 Q 86 12 86 52 L 83 72 Q 50 80 17 72 Z" fill="#8B1500" />
        {/* Hot surface */}
        <Path d="M 16 50 Q 16 14 50 9 Q 84 14 84 50 Q 68 32 50 26 Q 32 32 16 50 Z" fill="#CC2200" />
        {/* Glowing cracks */}
        <Path d="M 24 32 Q 34 24 46 32 Q 40 40 52 34 Q 62 26 72 34" stroke="#FF4500" strokeWidth="2" fill="none" opacity="0.85" />
        <Path d="M 28 44 Q 42 37 56 44 Q 66 37 76 44" stroke="#FF6600" strokeWidth="1.5" fill="none" opacity="0.7" />
        {/* Hotspot glows */}
        <Circle cx="30" cy="28" r="3" fill="#FF8C00" opacity="0.85" />
        <Circle cx="50" cy="22" r="4" fill="#FFA500" opacity="0.9" />
        <Circle cx="70" cy="28" r="3" fill="#FF8C00" opacity="0.85" />
        <Circle cx="40" cy="42" r="2" fill="#FFAA00" opacity="0.7" />
        <Circle cx="62" cy="42" r="2" fill="#FFAA00" opacity="0.7" />
      </G>
    </Svg>
  ),

  ocean: (size: number, _color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 94">
      <G>
        {/* Deep ocean base */}
        <Path d="M 12 56 Q 12 10 50 5 Q 88 10 88 56 L 85 82 Q 50 90 15 82 Z" fill="#00356B" />
        {/* Wave stripes */}
        <Path d="M 12 46 Q 25 36 38 46 Q 51 36 64 46 Q 77 36 88 46" stroke="#0066CC" strokeWidth="4.5" fill="none" />
        <Path d="M 12 56 Q 25 46 38 56 Q 51 46 64 56 Q 77 46 88 56" stroke="#0088FF" strokeWidth="3" fill="none" opacity="0.7" />
        <Path d="M 14 66 Q 27 56 40 66 Q 53 56 66 66 Q 79 56 86 66" stroke="#00AAFF" strokeWidth="2" fill="none" opacity="0.55" />
        {/* Foam highlights */}
        <Path d="M 18 40 Q 30 35 38 40" stroke="#FFFFFF" strokeWidth="1.5" fill="none" opacity="0.5" />
        <Path d="M 52 40 Q 64 35 72 40" stroke="#FFFFFF" strokeWidth="1.5" fill="none" opacity="0.5" />
        {/* Sparkle */}
        <Circle cx="28" cy="30" r="1.5" fill="#00CCFF" opacity="0.7" />
        <Circle cx="50" cy="22" r="2" fill="#AADDFF" opacity="0.65" />
        <Circle cx="72" cy="30" r="1.5" fill="#00CCFF" opacity="0.7" />
      </G>
    </Svg>
  ),

  sunset: (size: number, _color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 88">
      <G>
        {/* Bottom — deep magenta */}
        <Path d="M 12 56 Q 12 10 50 5 Q 88 10 88 56 L 85 80 Q 50 88 15 80 Z" fill="#C71585" />
        {/* Mid-low — warm red-orange */}
        <Path d="M 13 54 Q 13 12 50 7 Q 87 12 87 54 L 84 76 Q 50 84 16 76 Z" fill="#FF4500" />
        {/* Mid — amber */}
        <Path d="M 14 50 Q 14 14 50 9 Q 86 14 86 50 L 83 72 Q 50 80 17 72 Z" fill="#FF8C00" />
        {/* Upper — gold */}
        <Path d="M 16 44 Q 16 16 50 11 Q 84 16 84 44 Q 68 30 50 24 Q 32 30 16 44 Z" fill="#FFD700" />
        {/* Crown highlight */}
        <Path d="M 28 20 Q 50 12 72 20" stroke="#FFF8B0" strokeWidth="3" fill="none" opacity="0.6" />
      </G>
    </Svg>
  ),

  holographic: (size: number, _color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 88">
      <G>
        {/* Silver chrome base */}
        <Path d="M 12 56 Q 12 10 50 5 Q 88 10 88 56 L 85 80 Q 50 88 15 80 Z" fill="#C0C0C0" />
        {/* Iridescent colour bands */}
        <Path d="M 12 46 Q 30 36 50 40 Q 70 36 88 46 Q 70 42 50 46 Q 30 42 12 46 Z" fill="#FF69B4" opacity="0.42" />
        <Path d="M 13 36 Q 30 26 50 30 Q 70 26 87 36 Q 70 32 50 36 Q 30 32 13 36 Z" fill="#00FFFF" opacity="0.32" />
        <Path d="M 14 26 Q 30 16 50 20 Q 70 16 86 26 Q 70 22 50 26 Q 30 22 14 26 Z" fill="#FFD700" opacity="0.36" />
        <Path d="M 16 18 Q 32 10 50 13 Q 68 10 84 18 Q 68 15 50 18 Q 32 15 16 18 Z" fill="#9370DB" opacity="0.30" />
        {/* Chrome shine stripes */}
        <Path d="M 22 22 Q 36 16 52 18 Q 66 16 78 22" stroke="#FFFFFF" strokeWidth="2.5" fill="none" opacity="0.75" />
        <Path d="M 18 36 Q 36 28 52 31 Q 66 28 82 36" stroke="#FFFFFF" strokeWidth="1.5" fill="none" opacity="0.5" />
        {/* Sparkle dots */}
        <Circle cx="25" cy="28" r="2.5" fill="#FFFFFF" opacity="0.9" />
        <Circle cx="50" cy="14" r="3" fill="#FFFFFF" opacity="0.9" />
        <Circle cx="75" cy="28" r="2.5" fill="#FFFFFF" opacity="0.9" />
        <Circle cx="40" cy="42" r="1.5" fill="#FFFFFF" opacity="0.7" />
        <Circle cx="62" cy="42" r="1.5" fill="#FFFFFF" opacity="0.7" />
      </G>
    </Svg>
  ),

  crystal: (size: number, _color: string) => (
    <Svg width={size} height={size} viewBox="0 -10 100 92">
      <G>
        {/* Clear icy base */}
        <Path d="M 12 54 Q 12 12 50 7 Q 88 12 88 54 L 85 70 Q 50 78 15 70 Z" fill="#D6EAF8" stroke="#AED6F1" strokeWidth="1" />
        {/* Crystal spike formations */}
        <Path d="M 18 18 L 14 3 L 20 14 L 25 -2 L 30 16 Z" fill="#AED6F1" stroke="#7FB3D3" strokeWidth="1" />
        <Path d="M 37 10 L 34 -3 L 40 8 L 44 -5 L 47 9 Z" fill="#CCEEFF" stroke="#7FB3D3" strokeWidth="1" />
        <Path d="M 53 9 L 50 -5 L 55 7 L 59 -3 L 62 10 Z" fill="#CCEEFF" stroke="#7FB3D3" strokeWidth="1" />
        <Path d="M 70 10 L 67 -3 L 72 8 L 77 -5 L 80 18 Z" fill="#AED6F1" stroke="#7FB3D3" strokeWidth="1" />
        {/* Facet lines */}
        <Path d="M 24 22 L 35 14 L 46 22 L 50 12 L 54 22 L 65 14 L 76 22" stroke="#85C1E9" strokeWidth="1.5" fill="none" />
        <Path d="M 20 34 L 35 28 L 50 32 L 65 28 L 80 34" stroke="#AED6F1" strokeWidth="1" fill="none" opacity="0.7" />
        {/* Glow points */}
        <Circle cx="50" cy="14" r="4.5" fill="#FFFFFF" opacity="0.75" />
        <Circle cx="27" cy="22" r="3" fill="#FFFFFF" opacity="0.65" />
        <Circle cx="73" cy="22" r="3" fill="#FFFFFF" opacity="0.65" />
      </G>
    </Svg>
  ),

  // ── LEGENDARY ────────────────────────────────────────────────────────────

  fire: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 -20 100 100">
      <G>
        <Path d="M 12 52 Q 12 10 50 5 Q 88 10 88 52" fill={color} />
        {/* Outer fire flames — now above the viewBox top */}
        <Path d="M 24 10 Q 19 2 19 -6 Q 19 -12 24 -16 Q 27 -12 27 -8 Q 29 -12 29 -6 Q 29 2 24 10 Z" fill="#FF4500" />
        <Path d="M 50 5 Q 45 -3 45 -11 Q 45 -17 50 -20 Q 53 -16 53 -12 Q 55 -16 55 -11 Q 55 -3 50 5 Z" fill="#FF4500" />
        <Path d="M 76 10 Q 71 2 71 -6 Q 71 -12 76 -16 Q 79 -12 79 -8 Q 81 -12 81 -6 Q 81 2 76 10 Z" fill="#FF4500" />
        {/* Inner gold flames */}
        <Path d="M 36 8 Q 33 2 33 -2 Q 33 -5 36 -7 Q 38 -4 38 -2 Q 38 2 36 8 Z" fill="#FFD700" />
        <Path d="M 64 8 Q 61 2 61 -2 Q 61 -5 64 -7 Q 66 -4 66 -2 Q 66 2 64 8 Z" fill="#FFD700" />
        {/* White-hot tips */}
        <Circle cx="24" cy="-14" r="2.5" fill="#FFFF44" opacity="0.85" />
        <Circle cx="50" cy="-18" r="3" fill="#FFFF44" opacity="0.85" />
        <Circle cx="76" cy="-14" r="2.5" fill="#FFFF44" opacity="0.85" />
      </G>
    </Svg>
  ),

  lightning: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 -18 100 98">
      <G>
        <Path d="M 12 52 Q 12 10 50 5 Q 88 10 88 52" fill={color} />
        {/* Lightning bolts fully visible */}
        <Path d="M 30 6 L 25 19 L 33 17 L 28 33" stroke="#FFD700" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <Path d="M 30 6 L 25 19 L 33 17 L 28 33" stroke="#FFFFFF" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7" />
        <Path d="M 50 1 L 45 14 L 53 12 L 48 28" stroke="#FFD700" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <Path d="M 50 1 L 45 14 L 53 12 L 48 28" stroke="#FFFFFF" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7" />
        <Path d="M 70 6 L 65 19 L 73 17 L 68 33" stroke="#FFD700" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <Path d="M 70 6 L 65 19 L 73 17 L 68 33" stroke="#FFFFFF" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7" />
        <Circle cx="30" cy="4" r="3.5" fill="#FFFF44" opacity="0.5" />
        <Circle cx="50" cy="-1" r="4" fill="#FFFF44" opacity="0.5" />
        <Circle cx="70" cy="4" r="3.5" fill="#FFFF44" opacity="0.5" />
      </G>
    </Svg>
  ),

  phoenix: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 -22 100 102">
      <G>
        <Path d="M 12 52 Q 12 10 50 5 Q 88 10 88 52" fill={color} />
        {/* Phoenix flame feathers — tips fully visible */}
        <Path d="M 30 10 Q 25 0 30 -12 Q 35 -2 30 10" fill="#FF6347" />
        <Path d="M 30 10 Q 22 2 28 -10 Q 33 0 30 10" fill="#FF8C00" opacity="0.8" />
        <Path d="M 50 5 Q 45 -6 50 -19 Q 55 -8 50 5" fill="#FF6347" />
        <Path d="M 50 5 Q 42 -4 48 -16 Q 53 -6 50 5" fill="#FF8C00" opacity="0.8" />
        <Path d="M 70 10 Q 65 0 70 -12 Q 75 -2 70 10" fill="#FF6347" />
        <Path d="M 70 10 Q 62 2 68 -10 Q 73 0 70 10" fill="#FF8C00" opacity="0.8" />
        <Circle cx="30" cy="-12" r="3.5" fill="#FFD700" />
        <Circle cx="50" cy="-19" r="4" fill="#FFD700" />
        <Circle cx="70" cy="-12" r="3.5" fill="#FFD700" />
        <Circle cx="20" cy="-2" r="1.5" fill="#FF4500" opacity="0.7" />
        <Circle cx="80" cy="-2" r="1.5" fill="#FF4500" opacity="0.7" />
      </G>
    </Svg>
  ),

  celestial: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 80">
      <G>
        <Path d="M 12 52 Q 12 10 50 5 Q 88 10 88 52" fill={color} />
        {/* Stars sit above hairline, within viewBox */}
        <Path d="M 25 7 L 27 12 L 32 12 L 28 15 L 30 20 L 25 17 L 20 20 L 22 15 L 18 12 L 23 12 Z" fill="#E6E6FA" />
        <Path d="M 50 2 L 52 7 L 57 7 L 53 10 L 55 15 L 50 12 L 45 15 L 47 10 L 43 7 L 48 7 Z" fill="#FFFFFF" />
        <Path d="M 75 7 L 77 12 L 82 12 L 78 15 L 80 20 L 75 17 L 70 20 L 72 15 L 68 12 L 73 12 Z" fill="#E6E6FA" />
        <Circle cx="36" cy="17" r="2" fill="#FFFFFF" opacity="0.8" />
        <Circle cx="64" cy="17" r="2" fill="#FFFFFF" opacity="0.8" />
        <Circle cx="50" cy="22" r="1.5" fill="#C8B8FF" />
        <Circle cx="20" cy="26" r="1" fill="#FFFFFF" opacity="0.6" />
        <Circle cx="80" cy="26" r="1" fill="#FFFFFF" opacity="0.6" />
      </G>
    </Svg>
  ),

  void: (size: number, color: string) => (
    <Svg width={size} height={size} viewBox="0 -14 100 94">
      <G>
        <Path d="M 12 52 Q 12 10 50 5 Q 88 10 88 52" fill={color} />
        {/* Dark wisps rise above hairline — fully in viewBox */}
        <Path d="M 25 10 Q 20 3 25 -6 Q 30 3 25 10" fill="#1a1a2e" opacity="0.92" />
        <Path d="M 50 5 Q 45 -2 50 -12 Q 55 -2 50 5" fill="#1a1a2e" opacity="0.92" />
        <Path d="M 75 10 Q 70 3 75 -6 Q 80 3 75 10" fill="#1a1a2e" opacity="0.92" />
        <Circle cx="30" cy="8" r="2.5" fill="#000000" opacity="0.72" />
        <Circle cx="50" cy="3" r="3" fill="#080814" opacity="0.82" />
        <Circle cx="70" cy="8" r="2.5" fill="#000000" opacity="0.72" />
        <Circle cx="22" cy="2" r="1.5" fill="#6600CC" opacity="0.5" />
        <Circle cx="40" cy="-3" r="1.5" fill="#440088" opacity="0.5" />
        <Circle cx="60" cy="-3" r="1.5" fill="#440088" opacity="0.5" />
        <Circle cx="78" cy="2" r="1.5" fill="#6600CC" opacity="0.5" />
      </G>
    </Svg>
  ),

  // ── LEGENDARY (new) ──────────────────────────────────────────────────────

  aurora: (size: number, _color: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 90">
      <G>
        <Path d="M 12 54 Q 12 10 50 5 Q 88 10 88 54 L 85 72 Q 50 80 15 72 Z" fill="#080818" />
        <Path d="M 10 44 Q 28 28 50 34 Q 72 28 90 44 Q 72 38 50 44 Q 28 38 10 44 Z" fill="#00CED1" opacity="0.55" />
        <Path d="M 10 36 Q 28 20 50 26 Q 72 20 90 36 Q 72 30 50 36 Q 28 30 10 36 Z" fill="#20B2AA" opacity="0.45" />
        <Path d="M 12 28 Q 30 14 50 19 Q 70 14 88 28 Q 70 22 50 28 Q 30 22 12 28 Z" fill="#00FF7F" opacity="0.38" />
        <Path d="M 14 20 Q 32 8 50 12 Q 68 8 86 20 Q 68 15 50 20 Q 32 15 14 20 Z" fill="#9400D3" opacity="0.38" />
        <Path d="M 10 50 Q 28 38 50 43 Q 72 38 90 50 Q 72 45 50 50 Q 28 45 10 50 Z" fill="#FF69B4" opacity="0.32" />
        <Circle cx="20" cy="16" r="1.2" fill="#FFFFFF" />
        <Circle cx="36" cy="9" r="1.5" fill="#FFFFFF" />
        <Circle cx="50" cy="7" r="1.2" fill="#FFFFFF" />
        <Circle cx="64" cy="9" r="1.5" fill="#FFFFFF" />
        <Circle cx="80" cy="16" r="1.2" fill="#FFFFFF" />
        <Circle cx="43" cy="17" r="1" fill="#FFFFFF" opacity="0.7" />
        <Circle cx="57" cy="17" r="1" fill="#FFFFFF" opacity="0.7" />
      </G>
    </Svg>
  ),

  cosmic: (size: number, _color: string) => (
    <Svg width={size} height={size} viewBox="0 -16 100 96">
      <G>
        <Path d="M 12 54 Q 12 10 50 5 Q 88 10 88 54 L 85 72 Q 50 80 15 72 Z" fill="#030010" />
        <Path d="M 14 48 Q 30 26 50 32 Q 70 26 86 48 Q 66 36 50 42 Q 34 36 14 48 Z" fill="#7B2FBE" opacity="0.58" />
        <Path d="M 13 38 Q 30 16 50 22 Q 70 16 87 38 Q 66 26 50 32 Q 34 26 13 38 Z" fill="#5B0EC0" opacity="0.48" />
        <Path d="M 14 28 Q 32 10 50 14 Q 68 10 86 28 Q 66 18 50 24 Q 34 18 14 28 Z" fill="#9933FF" opacity="0.40" />
        <Circle cx="28" cy="20" r="9" fill="#FF00FF" opacity="0.13" />
        <Circle cx="72" cy="20" r="9" fill="#00FFFF" opacity="0.13" />
        <Circle cx="50" cy="12" r="11" fill="#9933FF" opacity="0.18" />
        <Circle cx="22" cy="18" r="2" fill="#FFFFFF" />
        <Circle cx="36" cy="10" r="1.5" fill="#FFFFFF" />
        <Circle cx="50" cy="8" r="2.5" fill="#FFFFFF" />
        <Circle cx="64" cy="10" r="1.5" fill="#FFFFFF" />
        <Circle cx="78" cy="18" r="2" fill="#FFFFFF" />
        <Path d="M 25 10 Q 22 3 25 -5" stroke="#9933FF" strokeWidth="2.5" fill="none" opacity="0.7" strokeLinecap="round" />
        <Path d="M 50 5 Q 48 -4 50 -14" stroke="#CC66FF" strokeWidth="3" fill="none" opacity="0.75" strokeLinecap="round" />
        <Path d="M 75 10 Q 78 3 75 -5" stroke="#9933FF" strokeWidth="2.5" fill="none" opacity="0.7" strokeLinecap="round" />
        <Circle cx="50" cy="-14" r="2.5" fill="#CC66FF" opacity="0.65" />
      </G>
    </Svg>
  ),

  // ── EXCLUSIVE ────────────────────────────────────────────────────────────

  founder_gold: (size: number, _color: string) => (
    <Svg width={size} height={size} viewBox="0 -12 100 94">
      <G>
        {/* Rich gold body */}
        <Path d="M 12 55 Q 12 10 50 5 Q 88 10 88 55 L 85 72 Q 50 80 15 72 Z" fill="#B8860B" />
        <Path d="M 14 52 Q 14 12 50 7 Q 86 12 86 52 L 83 70 Q 50 78 17 70 Z" fill="#DAA520" />
        <Path d="M 16 46 Q 16 14 50 9 Q 84 14 84 46 Q 68 30 50 24 Q 32 30 16 46 Z" fill="#FFD700" />
        {/* Ornate crown points */}
        <Path d="M 24 12 L 21 2 L 27 9 L 24 -1 L 27 7 L 24 12 Z" fill="#FFD700" stroke="#DAA520" strokeWidth="1" />
        <Path d="M 50 7 L 47 -3 L 53 4 L 50 -6 L 53 2 L 50 7 Z" fill="#FFD700" stroke="#DAA520" strokeWidth="1" />
        <Path d="M 76 12 L 73 2 L 79 9 L 76 -1 L 79 7 L 76 12 Z" fill="#FFD700" stroke="#DAA520" strokeWidth="1" />
        {/* Gem accents */}
        <Circle cx="24" cy="-1" r="3.5" fill="#FF1493" stroke="#FFD700" strokeWidth="1" />
        <Circle cx="50" cy="-6" r="4.5" fill="#4169E1" stroke="#FFD700" strokeWidth="1" />
        <Circle cx="76" cy="-1" r="3.5" fill="#FF1493" stroke="#FFD700" strokeWidth="1" />
        {/* Gold filigree */}
        <Path d="M 28 18 Q 38 12 50 14 Q 62 12 72 18" stroke="#B8860B" strokeWidth="1.5" fill="none" />
        <Path d="M 22 28 Q 36 22 50 24 Q 64 22 78 28" stroke="#B8860B" strokeWidth="1" fill="none" opacity="0.8" />
        {/* Shine */}
        <Path d="M 28 22 Q 42 15 57 18" stroke="#FFFACD" strokeWidth="2.5" fill="none" opacity="0.75" />
      </G>
    </Svg>
  ),

  champion: (size: number, _color: string) => (
    <Svg width={size} height={size} viewBox="0 -16 100 96">
      <G>
        {/* Trophy gold body */}
        <Path d="M 12 55 Q 12 10 50 5 Q 88 10 88 55 L 85 72 Q 50 80 15 72 Z" fill="#996515" />
        <Path d="M 14 52 Q 14 12 50 7 Q 86 12 86 52 L 83 70 Q 50 78 17 70 Z" fill="#C5881F" />
        <Path d="M 16 46 Q 16 14 50 9 Q 84 14 84 46 Q 68 30 50 24 Q 32 30 16 46 Z" fill="#F0B429" />
        {/* Champion laurel sprigs */}
        <Path d="M 18 16 Q 13 9 10 3 Q 16 6 20 11 Q 24 5 28 10 Q 26 15 22 18 Z" fill="#228B22" />
        <Path d="M 82 16 Q 87 9 90 3 Q 84 6 80 11 Q 76 5 72 10 Q 74 15 78 18 Z" fill="#228B22" />
        {/* Centre star */}
        <Path d="M 50 5 L 52 10 L 57 10 L 53 13 L 55 18 L 50 15 L 45 18 L 47 13 L 43 10 L 48 10 Z" fill="#FFFFFF" stroke="#FFD700" strokeWidth="1" />
        {/* Accent gems */}
        <Circle cx="28" cy="10" r="2.5" fill="#FFD700" stroke="#996515" strokeWidth="1" />
        <Circle cx="72" cy="10" r="2.5" fill="#FFD700" stroke="#996515" strokeWidth="1" />
        {/* Shine stripe */}
        <Path d="M 22 24 Q 38 16 57 18" stroke="#FFFACD" strokeWidth="2.5" fill="none" opacity="0.75" />
        {/* Score line */}
        <Path d="M 30 36 Q 50 30 70 36" stroke="#996515" strokeWidth="2" fill="none" />
      </G>
    </Svg>
  ),

  legend: (size: number, _color: string) => (
    <Svg width={size} height={size} viewBox="0 -22 100 102">
      <G>
        {/* Deep cosmic-gold body */}
        <Path d="M 12 55 Q 12 10 50 5 Q 88 10 88 55 L 85 72 Q 50 80 15 72 Z" fill="#1a0d00" />
        <Path d="M 14 52 Q 14 12 50 7 Q 86 12 86 52 L 83 70 Q 50 78 17 70 Z" fill="#4A2500" />
        <Path d="M 18 44 Q 18 16 50 11 Q 82 16 82 44 Q 66 30 50 24 Q 34 30 18 44 Z" fill="#FFD700" />
        {/* Elaborate crown — tall with many points */}
        <Path d="M 18 18 L 14 6 L 20 13 L 18 3 L 23 11 L 26 1 L 30 11 L 33 3 L 36 13 L 40 5 L 44 13" fill="#FFD700" stroke="#FF8C00" strokeWidth="1" />
        <Path d="M 56 13 L 60 5 L 63 13 L 66 3 L 70 11 L 74 1 L 77 11 L 80 3 L 82 13 L 86 6 L 82 18" fill="#FFD700" stroke="#FF8C00" strokeWidth="1" />
        {/* Centre pinnacle */}
        <Path d="M 44 13 L 47 3 L 50 -6 L 53 3 L 56 13 Z" fill="#FFD700" stroke="#FF8C00" strokeWidth="1" />
        {/* Premium gems */}
        <Circle cx="50" cy="-6" r="5.5" fill="#FF1493" stroke="#FFD700" strokeWidth="1.5" />
        <Circle cx="50" cy="-6" r="2.8" fill="#FF69B4" />
        <Circle cx="24" cy="4" r="4" fill="#4169E1" stroke="#FFD700" strokeWidth="1" />
        <Circle cx="76" cy="4" r="4" fill="#4169E1" stroke="#FFD700" strokeWidth="1" />
        <Circle cx="34" cy="-1" r="3" fill="#00CED1" stroke="#FFD700" strokeWidth="1" />
        <Circle cx="66" cy="-1" r="3" fill="#00CED1" stroke="#FFD700" strokeWidth="1" />
        {/* Aurora glow bands */}
        <Path d="M 14 22 Q 32 14 50 18 Q 68 14 86 22 Q 68 18 50 22 Q 32 18 14 22 Z" fill="#FF69B4" opacity="0.28" />
        <Path d="M 16 30 Q 34 22 50 26 Q 66 22 84 30 Q 66 26 50 30 Q 34 26 16 30 Z" fill="#9933FF" opacity="0.22" />
        {/* Sparkles */}
        <Circle cx="20" cy="-8" r="1.8" fill="#FFFF44" opacity="0.85" />
        <Circle cx="40" cy="-14" r="1.2" fill="#FFFFFF" opacity="0.9" />
        <Circle cx="60" cy="-14" r="1.2" fill="#FFFFFF" opacity="0.9" />
        <Circle cx="80" cy="-8" r="1.8" fill="#FFFF44" opacity="0.85" />
        {/* Shine */}
        <Path d="M 22 26 Q 38 18 57 20" stroke="#FFFACD" strokeWidth="2.5" fill="none" opacity="0.85" />
      </G>
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
  
  cap: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 40">
      <G>
        <Ellipse cx="50" cy="25" rx="40" ry="6" fill="#FF4757" />
        <Path d="M 20 25 Q 20 10 50 5 Q 80 10 80 25" fill="#FF6B6B" />
        <Ellipse cx="85" cy="25" rx="8" ry="4" fill="#FF4757" />
      </G>
    </Svg>
  ),
  
  beanie: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 40">
      <G>
        <Path d="M 15 30 Q 15 10 50 5 Q 85 10 85 30" fill="#4ECDC4" stroke="#45B7AF" strokeWidth="2" />
        <Circle cx="50" cy="5" r="4" fill="#45B7AF" />
      </G>
    </Svg>
  ),
  
  visor: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 30">
      <G>
        <Path d="M 20 15 Q 50 10 80 15" stroke="#000" strokeWidth="3" fill="none" />
        <Path d="M 15 15 Q 30 20 50 18 Q 70 20 85 15" fill="rgba(0,0,0,0.5)" />
      </G>
    </Svg>
  ),
  
  mask: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 40">
      <G>
        <Path d="M 20 20 Q 50 10 80 20 L 75 30 Q 50 35 25 30 Z" fill="#9B59B6" stroke="#8E44AD" strokeWidth="2" />
        <Ellipse cx="35" cy="20" rx="8" ry="6" fill="#000" />
        <Ellipse cx="65" cy="20" rx="8" ry="6" fill="#000" />
      </G>
    </Svg>
  ),
  
  earrings: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 40">
      <G>
        <Circle cx="20" cy="25" r="5" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
        <Circle cx="80" cy="25" r="5" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
      </G>
    </Svg>
  ),
  
  necklace: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 60">
      <G>
        <Path d="M 30 10 Q 50 20 70 10" stroke="#FFD700" strokeWidth="3" fill="none" />
        <Circle cx="50" cy="22" r="6" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
      </G>
    </Svg>
  ),
  
  scarf: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 60">
      <G>
        <Path d="M 20 20 Q 50 30 80 20 L 75 40 Q 50 50 25 40 Z" fill="#E74C3C" stroke="#C0392B" strokeWidth="2" />
        <Path d="M 30 25 L 70 25" stroke="#C0392B" strokeWidth="1" />
        <Path d="M 30 35 L 70 35" stroke="#C0392B" strokeWidth="1" />
      </G>
    </Svg>
  ),
  
  tiara: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 40">
      <G>
        <Path d="M 20 30 L 30 10 L 40 25 L 50 5 L 60 25 L 70 10 L 80 30" stroke="#FFD700" strokeWidth="3" fill="none" />
        <Circle cx="30" cy="10" r="3" fill="#FF69B4" />
        <Circle cx="50" cy="5" r="4" fill="#FF69B4" />
        <Circle cx="70" cy="10" r="3" fill="#FF69B4" />
      </G>
    </Svg>
  ),
  
  monocle: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 40">
      <G>
        <Circle cx="65" cy="20" r="12" fill="none" stroke="#FFD700" strokeWidth="2" />
        <Circle cx="65" cy="20" r="10" fill="rgba(255,255,255,0.2)" />
        <Path d="M 53 20 L 40 25" stroke="#FFD700" strokeWidth="2" />
      </G>
    </Svg>
  ),
  
  goggles: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 40">
      <G>
        <Circle cx="30" cy="20" r="14" fill="#8B4513" stroke="#654321" strokeWidth="2" />
        <Circle cx="30" cy="20" r="11" fill="rgba(139,69,19,0.5)" />
        <Path d="M 44 20 L 56 20" stroke="#654321" strokeWidth="3" />
        <Circle cx="70" cy="20" r="14" fill="#8B4513" stroke="#654321" strokeWidth="2" />
        <Circle cx="70" cy="20" r="11" fill="rgba(139,69,19,0.5)" />
      </G>
    </Svg>
  ),
  
  halo: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 30">
      <G>
        <Ellipse cx="50" cy="15" rx="30" ry="8" fill="none" stroke="#FFD700" strokeWidth="4" opacity="0.8" />
        <Ellipse cx="50" cy="15" rx="28" ry="6" fill="#FFFF00" opacity="0.3" />
      </G>
    </Svg>
  ),
  
  horns: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 40">
      <G>
        <Path d="M 25 30 Q 20 20 15 10 Q 12 5 10 10 Q 15 15 20 25 Q 23 30 25 30" fill="#8B0000" stroke="#660000" strokeWidth="2" />
        <Path d="M 75 30 Q 80 20 85 10 Q 88 5 90 10 Q 85 15 80 25 Q 77 30 75 30" fill="#8B0000" stroke="#660000" strokeWidth="2" />
      </G>
    </Svg>
  ),
  
  bandana: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 40">
      <G>
        <Path d="M 15 25 Q 50 15 85 25" fill="#FF6B6B" stroke="#FF4757" strokeWidth="2" />
        <Path d="M 85 25 L 95 20 L 90 30" fill="#FF4757" />
      </G>
    </Svg>
  ),
  
  bow: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 40">
      <G>
        <Path d="M 30 20 Q 25 10 20 15 Q 25 20 30 20" fill="#FF69B4" stroke="#FF1493" strokeWidth="1" />
        <Path d="M 70 20 Q 75 10 80 15 Q 75 20 70 20" fill="#FF69B4" stroke="#FF1493" strokeWidth="1" />
        <Circle cx="50" cy="20" r="6" fill="#FF1493" />
      </G>
    </Svg>
  ),
  
  // Epic accessories
  laurel: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 40">
      <G>
        <Path d="M 20 30 Q 15 20 20 10 Q 25 15 30 20 Q 35 15 40 10 Q 45 15 50 20 Q 55 15 60 10 Q 65 15 70 20 Q 75 15 80 10 Q 85 20 80 30" 
          fill="none" stroke="#228B22" strokeWidth="3" />
        <Circle cx="25" cy="15" r="3" fill="#FFD700" />
        <Circle cx="50" cy="15" r="3" fill="#FFD700" />
        <Circle cx="75" cy="15" r="3" fill="#FFD700" />
      </G>
    </Svg>
  ),
  
  // Legendary accessories
  wizard_hat: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 60">
      <G>
        <Path d="M 30 50 L 50 5 L 70 50 Z" fill="#4B0082" stroke="#2F004F" strokeWidth="2" />
        <Ellipse cx="50" cy="50" rx="25" ry="6" fill="#4B0082" stroke="#2F004F" strokeWidth="2" />
        <Path d="M 40 30 L 60 30" stroke="#FFD700" strokeWidth="2" />
        <Circle cx="35" cy="20" r="2" fill="#FFD700" />
        <Circle cx="50" cy="15" r="2" fill="#FFD700" />
        <Circle cx="65" cy="20" r="2" fill="#FFD700" />
      </G>
    </Svg>
  ),
  
  dragon_helm: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 60">
      <G>
        <Path d="M 20 40 Q 20 20 50 15 Q 80 20 80 40 L 75 50 Q 50 55 25 50 Z" fill="#8B0000" stroke="#660000" strokeWidth="2" />
        <Path d="M 50 15 L 55 5 L 60 15" fill="#FF4500" stroke="#8B0000" strokeWidth="1" />
        <Path d="M 40 15 L 45 5 L 50 15" fill="#FF4500" stroke="#8B0000" strokeWidth="1" />
        <Circle cx="35" cy="30" r="4" fill="#FFD700" />
        <Circle cx="65" cy="30" r="4" fill="#FFD700" />
      </G>
    </Svg>
  ),
  
  phoenix_crown: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 50">
      <G>
        <Path d="M 10 40 L 20 15 L 30 30 L 50 5 L 70 30 L 80 15 L 90 40 Z" fill="#FF6347" stroke="#FF4500" strokeWidth="2" />
        <Path d="M 50 5 Q 45 0 50 -5 Q 55 0 50 5" fill="#FFD700" />
        <Path d="M 30 15 Q 27 12 30 9 Q 33 12 30 15" fill="#FFD700" />
        <Path d="M 70 15 Q 67 12 70 9 Q 73 12 70 15" fill="#FFD700" />
        <Circle cx="50" cy="0" r="3" fill="#FFD700" />
      </G>
    </Svg>
  ),
  
  galaxy_visor: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 30">
      <G>
        <Path d="M 20 15 Q 50 10 80 15" stroke="#4A00E0" strokeWidth="3" fill="none" />
        <Path d="M 15 15 Q 30 20 50 18 Q 70 20 85 15" fill="#4A00E0" opacity="0.7" />
        <Circle cx="30" cy="17" r="1.5" fill="#FFFFFF" opacity="0.8" />
        <Circle cx="50" cy="16" r="2" fill="#FFFFFF" opacity="0.8" />
        <Circle cx="70" cy="17" r="1.5" fill="#FFFFFF" opacity="0.8" />
        <Circle cx="40" cy="18" r="1" fill="#8E2DE2" opacity="0.6" />
        <Circle cx="60" cy="18" r="1" fill="#8E2DE2" opacity="0.6" />
      </G>
    </Svg>
  ),
  
  lightning_bolt: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 60">
      <G>
        <Path d="M 50 5 L 40 25 L 50 25 L 45 45 L 65 20 L 55 20 L 60 5 Z" fill="#FFD700" stroke="#FFA500" strokeWidth="2" />
        <Path d="M 50 10 L 55 15" stroke="#FFFF00" strokeWidth="2" />
      </G>
    </Svg>
  ),
  
  // Exclusive accessories
  founder_crown: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 50">
      <G>
        <Path d="M 10 40 L 20 10 L 30 30 L 50 5 L 70 30 L 80 10 L 90 40 Z" fill="#FFD700" stroke="#FFA500" strokeWidth="3" />
        <Circle cx="20" cy="10" r="5" fill="#FF1493" stroke="#FFD700" strokeWidth="1" />
        <Circle cx="50" cy="5" r="6" fill="#FF1493" stroke="#FFD700" strokeWidth="1" />
        <Circle cx="80" cy="10" r="5" fill="#FF1493" stroke="#FFD700" strokeWidth="1" />
        <Path d="M 15 40 L 85 40" stroke="#FFA500" strokeWidth="4" />
      </G>
    </Svg>
  ),
  
  legend_halo: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 30">
      <G>
        <Ellipse cx="50" cy="15" rx="35" ry="10" fill="none" stroke="#FFD700" strokeWidth="5" opacity="0.9" />
        <Ellipse cx="50" cy="15" rx="32" ry="7" fill="#FFFF00" opacity="0.4" />
        <Circle cx="20" cy="15" r="3" fill="#FFFFFF" opacity="0.9" />
        <Circle cx="50" cy="10" r="3" fill="#FFFFFF" opacity="0.9" />
        <Circle cx="80" cy="15" r="3" fill="#FFFFFF" opacity="0.9" />
        <Path d="M 35 15 L 37 10 L 39 15" fill="#FFD700" />
        <Path d="M 61 15 L 63 10 L 65 15" fill="#FFD700" />
      </G>
    </Svg>
  ),
  
  ultimate_set: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 60">
      <G>
        {/* Crown */}
        <Path d="M 10 35 L 20 15 L 30 28 L 50 10 L 70 28 L 80 15 L 90 35 Z" fill="#FFD700" stroke="#FFA500" strokeWidth="2" />
        {/* Halo */}
        <Ellipse cx="50" cy="8" rx="25" ry="6" fill="none" stroke="#FFFFFF" strokeWidth="3" opacity="0.8" />
        {/* Stars */}
        <Path d="M 25 20 L 27 25 L 32 25 L 28 28 L 30 33 L 25 30 L 20 33 L 22 28 L 18 25 L 23 25 Z" fill="#FFFFFF" />
        <Path d="M 75 20 L 77 25 L 82 25 L 78 28 L 80 33 L 75 30 L 70 33 L 72 28 L 68 25 L 73 25 Z" fill="#FFFFFF" />
        {/* Gems */}
        <Circle cx="50" cy="10" r="4" fill="#FF1493" />
        <Circle cx="30" cy="18" r="3" fill="#00FFFF" />
        <Circle cx="70" cy="18" r="3" fill="#00FFFF" />
      </G>
    </Svg>
  ),

  // Common accessories
  hairclip: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 40">
      <G>
        {/* Left clip */}
        <Rect x="20" y="17" width="9" height="13" rx="2" fill="#FF69B4" stroke="#FF1493" strokeWidth="1.5" />
        <Path d="M 20 22 L 29 22" stroke="#FF1493" strokeWidth="1" />
        <Path d="M 20 27 L 29 27" stroke="#FF1493" strokeWidth="1" />
        {/* Right clip */}
        <Rect x="71" y="17" width="9" height="13" rx="2" fill="#FF69B4" stroke="#FF1493" strokeWidth="1.5" />
        <Path d="M 71 22 L 80 22" stroke="#FF1493" strokeWidth="1" />
        <Path d="M 71 27 L 80 27" stroke="#FF1493" strokeWidth="1" />
      </G>
    </Svg>
  ),

  headband: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 30">
      <G>
        <Path d="M 14 22 Q 50 5 86 22" stroke="#C0392B" strokeWidth="10" fill="none" strokeLinecap="round" />
        <Path d="M 14 22 Q 50 5 86 22" stroke="#E74C3C" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.7" />
        <Path d="M 14 22 Q 50 5 86 22" stroke="#FF6B6B" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
      </G>
    </Svg>
  ),

  simple_earrings: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 45">
      <G>
        {/* Left stud */}
        <Circle cx="17" cy="24" r="5" fill="#FFD700" stroke="#FFA500" strokeWidth="1.5" />
        <Circle cx="17" cy="24" r="2.5" fill="#FFFACD" opacity="0.6" />
        {/* Right stud */}
        <Circle cx="83" cy="24" r="5" fill="#FFD700" stroke="#FFA500" strokeWidth="1.5" />
        <Circle cx="83" cy="24" r="2.5" fill="#FFFACD" opacity="0.6" />
      </G>
    </Svg>
  ),

  watch: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 60">
      <G>
        {/* Band top */}
        <Rect x="12" y="24" width="16" height="6" rx="1" fill="#2C3E50" />
        {/* Watch body */}
        <Rect x="9" y="29" width="22" height="18" rx="4" fill="#2C3E50" stroke="#95A5A6" strokeWidth="1.5" />
        {/* Watch face */}
        <Rect x="12" y="32" width="16" height="12" rx="2" fill="#1ABC9C" />
        {/* Hour/minute hands */}
        <Path d="M 20 38 L 20 34" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M 20 38 L 24 40" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />
        <Circle cx="20" cy="38" r="1" fill="#FFFFFF" />
        {/* Band bottom */}
        <Rect x="12" y="47" width="16" height="6" rx="1" fill="#2C3E50" />
      </G>
    </Svg>
  ),

  aviators: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 40">
      <G>
        {/* Left teardrop lens */}
        <Path d="M 8 14 Q 8 7 18 7 Q 28 7 30 14 Q 32 22 22 26 Q 12 26 9 20 Z"
          fill="#8B6914" stroke="#5D4E37" strokeWidth="2" opacity="0.85" />
        <Path d="M 13 11 Q 19 9 24 12" stroke="#D4A017" strokeWidth="1" fill="none" opacity="0.5" />
        {/* Bridge */}
        <Path d="M 30 13 Q 37 11 43 13 Q 49 11 55 13" stroke="#5D4E37" strokeWidth="2" fill="none" />
        {/* Right teardrop lens */}
        <Path d="M 55 14 Q 55 7 65 7 Q 75 7 77 14 Q 79 22 69 26 Q 59 26 56 20 Z"
          fill="#8B6914" stroke="#5D4E37" strokeWidth="2" opacity="0.85" />
        <Path d="M 60 11 Q 66 9 71 12" stroke="#D4A017" strokeWidth="1" fill="none" opacity="0.5" />
        {/* Arms */}
        <Path d="M 7 13 L 1 15" stroke="#5D4E37" strokeWidth="2" strokeLinecap="round" />
        <Path d="M 77 13 L 84 15" stroke="#5D4E37" strokeWidth="2" strokeLinecap="round" />
      </G>
    </Svg>
  ),

  cat_ears: (size: number) => (
    <Svg width={size} height={size} viewBox="0 -30 100 80">
      <G>
        {/* Left ear outer */}
        <Path d="M 18 18 L 8 -22 L 40 8 Z" fill="#FF69B4" stroke="#FF1493" strokeWidth="2" />
        {/* Left ear inner */}
        <Path d="M 20 14 L 14 -10 L 36 9 Z" fill="#FFB6C1" />
        {/* Right ear outer */}
        <Path d="M 82 18 L 92 -22 L 60 8 Z" fill="#FF69B4" stroke="#FF1493" strokeWidth="2" />
        {/* Right ear inner */}
        <Path d="M 80 14 L 86 -10 L 64 9 Z" fill="#FFB6C1" />
      </G>
    </Svg>
  ),

  bunny_ears: (size: number) => (
    <Svg width={size} height={size} viewBox="0 -55 100 100">
      <G>
        {/* Left ear */}
        <Ellipse cx="32" cy="-22" rx="11" ry="30" fill="#F8F8FF" stroke="#D3D3D3" strokeWidth="2" />
        <Ellipse cx="32" cy="-22" rx="5.5" ry="23" fill="#FFB6C1" />
        {/* Right ear */}
        <Ellipse cx="68" cy="-22" rx="11" ry="30" fill="#F8F8FF" stroke="#D3D3D3" strokeWidth="2" />
        <Ellipse cx="68" cy="-22" rx="5.5" ry="23" fill="#FFB6C1" />
      </G>
    </Svg>
  ),

  flower_crown: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 38">
      <G>
        {/* Vine stem */}
        <Path d="M 14 28 Q 50 12 86 28" stroke="#228B22" strokeWidth="2.5" fill="none" />
        {/* Far-left flower */}
        <Circle cx="21" cy="23" r="5.5" fill="#FF69B4" />
        <Circle cx="21" cy="23" r="2.5" fill="#FFD700" />
        {/* Left flower */}
        <Circle cx="37" cy="16" r="5.5" fill="#FF4500" />
        <Circle cx="37" cy="16" r="2.5" fill="#FFD700" />
        {/* Center flower — larger */}
        <Circle cx="50" cy="13" r="7" fill="#FF69B4" />
        <Circle cx="50" cy="13" r="3" fill="#FFD700" />
        {/* Right flower */}
        <Circle cx="63" cy="16" r="5.5" fill="#9B59B6" />
        <Circle cx="63" cy="16" r="2.5" fill="#FFD700" />
        {/* Far-right flower */}
        <Circle cx="79" cy="23" r="5.5" fill="#FF4500" />
        <Circle cx="79" cy="23" r="2.5" fill="#FFD700" />
        {/* Leaf accents */}
        <Path d="M 29 19 Q 31 14 34 18" stroke="#228B22" strokeWidth="1.5" fill="none" />
        <Path d="M 67 18 Q 69 14 72 17" stroke="#228B22" strokeWidth="1.5" fill="none" />
      </G>
    </Svg>
  ),

  fedora: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 50">
      <G>
        {/* Brim */}
        <Ellipse cx="50" cy="37" rx="46" ry="7" fill="#4A3728" stroke="#2E1F12" strokeWidth="2" />
        {/* Crown */}
        <Path d="M 26 37 Q 26 20 32 14 Q 41 7 50 7 Q 59 7 68 14 Q 74 20 74 37"
          fill="#5C4A35" stroke="#2E1F12" strokeWidth="2" />
        {/* Crown pinch crease */}
        <Path d="M 34 16 Q 50 13 66 16" stroke="#2E1F12" strokeWidth="2" fill="none" />
        {/* Hat band */}
        <Path d="M 28 32 Q 50 29 72 32" stroke="#2E1F12" strokeWidth="3.5" fill="none" />
        {/* Brim underside shadow */}
        <Path d="M 10 37 Q 50 43 90 37" stroke="#2E1F12" strokeWidth="1" fill="none" opacity="0.4" />
      </G>
    </Svg>
  ),

  beret: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 40">
      <G>
        {/* Beret body — tilted right */}
        <Path d="M 22 30 Q 20 12 46 6 Q 74 3 82 16 Q 85 24 74 29 Q 55 34 22 30 Z"
          fill="#8B4513" stroke="#6B3410" strokeWidth="2" />
        {/* Highlight */}
        <Path d="M 36 13 Q 56 8 70 14" stroke="#A0522D" strokeWidth="2" fill="none" opacity="0.55" />
        {/* Band base */}
        <Path d="M 22 30 Q 55 36 74 29" stroke="#6B3410" strokeWidth="3" fill="none" />
        {/* Stem */}
        <Circle cx="64" cy="7" r="3.5" fill="#6B3410" />
      </G>
    </Svg>
  ),

  cowboy_hat: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 52">
      <G>
        {/* Brim */}
        <Path d="M 4 32 Q 50 40 96 32 Q 90 40 50 44 Q 10 40 4 32 Z"
          fill="#8B6914" stroke="#5D4E0A" strokeWidth="2" />
        {/* Crown */}
        <Path d="M 28 32 Q 27 17 34 11 Q 42 5 50 5 Q 58 5 66 11 Q 73 17 72 32"
          fill="#A0782A" stroke="#5D4E0A" strokeWidth="2" />
        {/* Crown centre crease */}
        <Path d="M 38 13 Q 50 10 62 13" stroke="#5D4E0A" strokeWidth="2" fill="none" />
        {/* Crown side dents */}
        <Path d="M 29 22 Q 33 19 37 22" stroke="#5D4E0A" strokeWidth="1.5" fill="none" />
        <Path d="M 63 22 Q 67 19 71 22" stroke="#5D4E0A" strokeWidth="1.5" fill="none" />
        {/* Hat band */}
        <Path d="M 30 29 Q 50 26 70 29" stroke="#5D4E0A" strokeWidth="3" fill="none" />
      </G>
    </Svg>
  ),

  vr_headset: (size: number) => (
    <Svg width={size} height={size} viewBox="0 0 100 45">
      <G>
        {/* Main body */}
        <Rect x="14" y="9" width="72" height="28" rx="8" fill="#2C3E50" stroke="#1A252F" strokeWidth="2" />
        {/* Left lens */}
        <Rect x="17" y="13" width="28" height="20" rx="4" fill="#00BCD4" opacity="0.75" stroke="#00ACC1" strokeWidth="1.5" />
        {/* Right lens */}
        <Rect x="55" y="13" width="28" height="20" rx="4" fill="#00BCD4" opacity="0.75" stroke="#00ACC1" strokeWidth="1.5" />
        {/* Nose bridge */}
        <Rect x="44" y="14" width="12" height="18" rx="2" fill="#1A252F" />
        {/* Left strap */}
        <Path d="M 14 17 L 4 15 L 4 31 L 14 33" stroke="#2C3E50" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        {/* Right strap */}
        <Path d="M 86 17 L 96 15 L 96 31 L 86 33" stroke="#2C3E50" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        {/* Lens glare */}
        <Path d="M 21 16 Q 27 14 33 16" stroke="#80DEEA" strokeWidth="1" fill="none" opacity="0.8" />
        <Path d="M 59 16 Q 65 14 71 16" stroke="#80DEEA" strokeWidth="1" fill="none" opacity="0.8" />
        {/* Power indicator */}
        <Circle cx="50" cy="7" r="2" fill="#4CAF50" />
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
