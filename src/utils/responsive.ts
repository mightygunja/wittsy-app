/**
 * Responsive Layout Utilities
 * Ensures proper formatting on both phones and iPads
 */

import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Whether the device is a tablet (iPad or large Android tablet)
 * Threshold: 600dp width is the standard tablet breakpoint
 */
export const isTablet = SCREEN_WIDTH >= 600;

/**
 * Whether the device is a large tablet (12.9" iPad Pro, etc.)
 */
export const isLargeTablet = SCREEN_WIDTH >= 1000;

/**
 * Maximum content width for layouts on tablets.
 * On phones, this returns the full screen width.
 * On tablets, content uses most of the screen with comfortable margins.
 */
export const MAX_CONTENT_WIDTH = isLargeTablet ? 900 : isTablet ? 700 : SCREEN_WIDTH;

/**
 * The effective content width to use for layout calculations.
 * On phones: full screen width
 * On tablets: uses most of the screen with comfortable side margins
 */
export const contentWidth = Math.min(SCREEN_WIDTH, MAX_CONTENT_WIDTH);

/**
 * The raw screen width (uncapped). Use sparingly for things
 * that genuinely need full-screen coverage (backgrounds, shimmer, etc.)
 */
export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;

/**
 * Number of grid columns for item grids on tablets vs phones
 */
export const gridColumns = isLargeTablet ? 4 : isTablet ? 3 : 2;

/**
 * Avatar display size - capped for tablets
 */
export const avatarDisplaySize = isLargeTablet ? 400 : isTablet ? 320 : SCREEN_WIDTH * 0.7;

/**
 * Number of columns for avatar item picker grids
 */
export const avatarGridColumns = isLargeTablet ? 8 : isTablet ? 6 : 4;

/**
 * Calculate item card width for a grid with N columns and given padding/gap
 */
export const getGridItemWidth = (
  columns: number,
  horizontalPadding: number,
  gap: number,
): number => {
  const availableWidth = contentWidth - horizontalPadding * 2 - gap * (columns - 1);
  return availableWidth / columns;
};

/**
 * Modal width - capped for tablets
 */
export const modalWidth = isTablet ? Math.min(SCREEN_WIDTH * 0.6, 500) : SCREEN_WIDTH - 40;

/**
 * Style helper: centers content on tablets with maxWidth constraint
 */
export const tabletContentStyle = isTablet
  ? {
      maxWidth: MAX_CONTENT_WIDTH,
      alignSelf: 'center' as const,
      width: '100%' as const,
    }
  : {};

/**
 * Style helper for ScrollView contentContainerStyle on tablets
 */
export const tabletScrollContentStyle = isTablet
  ? {
      maxWidth: MAX_CONTENT_WIDTH,
      alignSelf: 'center' as const,
      width: '100%' as const,
    }
  : {};

/**
 * Horizontal padding to add on tablets to center content.
 * On phones this is 0. On tablets it's calculated to center MAX_CONTENT_WIDTH.
 */
export const tabletHorizontalPadding = isTablet
  ? Math.max((SCREEN_WIDTH - MAX_CONTENT_WIDTH) / 2, 0)
  : 0;

/**
 * Responsive font scaling for accessibility and different screen sizes
 * Scales text based on screen width AND system font size settings
 * Respects user's accessibility preferences while maintaining layout integrity
 */
export const scaleFontSize = (baseSize: number): number => {
  // Get system font scale (1.0 = normal, >1.0 = enlarged)
  const systemFontScale = PixelRatio.getFontScale();
  
  // Base scale factor for different device sizes
  const deviceScaleFactor = isLargeTablet ? 1.3 : isTablet ? 1.15 : 1.0;
  
  // Combine system font scale with device scale
  // Use a dampening factor to prevent extreme scaling that breaks layouts
  const dampenedSystemScale = 1 + (systemFontScale - 1) * 0.7;
  const combinedScale = baseSize * deviceScaleFactor * dampenedSystemScale;
  
  // Cap maximum size to prevent breaking layouts (2x base size max)
  const maxSize = baseSize * 2.0;
  return Math.min(combinedScale, maxSize);
};

/**
 * Scale icon sizes responsively
 */
export const scaleIconSize = (baseSize: number): number => {
  const scaleFactor = isLargeTablet ? 1.4 : isTablet ? 1.2 : 1.0;
  return baseSize * scaleFactor;
};

/**
 * Get responsive line height based on font size
 * Ensures text doesn't wrap awkwardly and respects scaled fonts
 */
export const getLineHeight = (fontSize: number): number => {
  // Use 1.4 multiplier for better readability with scaled fonts
  return Math.ceil(fontSize * 1.4);
};

/**
 * Get current system font scale
 * Returns 1.0 for normal, >1.0 for enlarged fonts
 */
export const getSystemFontScale = (): number => {
  return PixelRatio.getFontScale();
};

/**
 * Check if user has enlarged fonts enabled
 */
export const hasEnlargedFonts = (): boolean => {
  return PixelRatio.getFontScale() > 1.0;
};
