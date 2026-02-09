/**
 * Responsive Layout Utilities
 * Ensures proper formatting on both phones and iPads
 */

import { Dimensions, Platform } from 'react-native';

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
