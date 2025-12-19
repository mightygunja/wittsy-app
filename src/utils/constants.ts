// App Constants

export const APP_NAME = 'Wittsy';
export const APP_VERSION = '1.0.0';

// Game Settings
export const DEFAULT_SUBMISSION_TIME = 25; // seconds
export const DEFAULT_VOTING_TIME = 10; // seconds
export const DEFAULT_WINNING_SCORE = 10; // rounds
export const MAX_PLAYERS = 12;
export const MIN_PLAYERS = 3;
export const STAR_THRESHOLD = 6; // votes needed for star
export const PHRASE_MAX_LENGTH = 200;

// Wild Rift-Inspired Design System
// High-energy, competitive gaming aesthetic with bold gradients and glows

export const COLORS = {
  // Primary - Vibrant Purple/Blue (Energy & Competition)
  primary: '#A855F7',
  primaryDark: '#7C3AED',
  primaryLight: '#C084FC',
  primaryGlow: 'rgba(168, 85, 247, 0.5)',
  
  // Secondary - Gold Accent (Victory & Achievement)
  gold: '#F59E0B',
  goldLight: '#FCD34D',
  goldDark: '#D97706',
  goldShine: '#FEF3C7',
  goldGlow: 'rgba(245, 158, 11, 0.6)',
  
  // Tertiary - Cyan (Energy & Speed)
  cyan: '#06B6D4',
  cyanLight: '#22D3EE',
  cyanGlow: 'rgba(6, 182, 212, 0.5)',
  
  // Backgrounds - Deep, Layered Gaming
  background: '#0A0E1A',
  backgroundLight: '#0F1420',
  backgroundElevated: '#151B2B',
  backgroundPanel: '#1A2035',
  
  // Surfaces - Glass & Elevation
  surface: '#1E293B',
  surfaceHover: '#293548',
  surfaceActive: '#334155',
  surfaceGlass: 'rgba(30, 41, 59, 0.7)',
  surfaceGlassBorder: 'rgba(255, 255, 255, 0.1)',
  
  // Text Hierarchy
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',
  textMuted: '#64748B',
  textDisabled: '#475569',
  
  // Semantic Colors - Bold & Clear
  success: '#10B981',
  successGlow: 'rgba(16, 185, 129, 0.5)',
  error: '#EF4444',
  errorGlow: 'rgba(239, 68, 68, 0.5)',
  warning: '#F59E0B',
  warningGlow: 'rgba(245, 158, 11, 0.5)',
  info: '#3B82F6',
  infoGlow: 'rgba(59, 130, 246, 0.5)',
  
  // Rank Colors
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  platinum: '#E5E4E2',
  diamond: '#B9F2FF',
  master: '#FF6B9D',
  legend: '#FFD700',
  
  // Borders & Dividers
  border: '#2A3350',
  borderLight: '#334155',
  borderGlow: 'rgba(168, 85, 247, 0.3)',
  divider: 'rgba(255, 255, 255, 0.08)',
  
  // Overlay & Modal
  overlay: 'rgba(0, 0, 0, 0.85)',
  modalBackdrop: 'rgba(10, 14, 26, 0.95)',
  
  // Gradients - Define as arrays for LinearGradient
  gradientPrimary: ['#A855F7', '#7C3AED', '#6366F1'],
  gradientGold: ['#FCD34D', '#F59E0B', '#D97706'],
  gradientCyan: ['#22D3EE', '#06B6D4', '#0891B2'],
  gradientSuccess: ['#34D399', '#10B981', '#059669'],
  gradientDanger: ['#F87171', '#EF4444', '#DC2626'],
  gradientPanel: ['#1E293B', '#1A2035', '#151B2B'],
};

// Typography - Bold & Impactful
export const TYPOGRAPHY = {
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const,
  },
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
    '6xl': 48,
    huge: 64,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Spacing System (4px base for tighter control)
export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

// Border Radius - Sharp & Angular
export const RADIUS = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

// Shadows & Glows - Dramatic Depth
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  glow: {
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  glowGold: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  glowCyan: {
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
};

// Animation Timings - Snappy & Responsive
export const ANIMATION = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 400,
  slower: 600,
  slowest: 800,
};

// Animation Easings
export const EASING = {
  bounce: [0.68, -0.55, 0.265, 1.55],
  elastic: [0.175, 0.885, 0.32, 1.275],
  smooth: [0.4, 0.0, 0.2, 1],
  sharp: [0.4, 0.0, 0.6, 1],
};

// Z-Index System
export const Z_INDEX = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
  notification: 1700,
};

// Rank Tiers
export const RANK_TIERS = [
  { name: 'Bronze', min: 0, max: 999 },
  { name: 'Silver', min: 1000, max: 1399 },
  { name: 'Gold', min: 1400, max: 1799 },
  { name: 'Platinum', min: 1800, max: 2199 },
  { name: 'Diamond', min: 2200, max: 2599 },
  { name: 'Master', min: 2600, max: 2999 },
  { name: 'Legend', min: 3000, max: Infinity }
];

// XP Rewards
export const XP_REWARDS = {
  roundParticipation: 10,
  roundWin: 25,
  gameWin: 100,
  starAchievement: 50,
  firstGameOfDay: 20,
  votingParticipation: 5
};

// Level Thresholds
export const LEVEL_XP = [
  100, 100, 100, 100, 100, 100, 100, 100, 100, 100, // 1-10
  250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, // 11-25
  500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500 // 26-50
];
