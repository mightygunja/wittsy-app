/**
 * Web layout helpers.
 *
 * The app renders three tiers:
 *  - native (iOS/Android): unchanged phone/tablet layouts
 *  - mobile web (< 1024px): phone layout in the browser
 *  - desktop web (>= 1024px): web chrome — top navbar instead of the phone
 *    bottom nav, hero welcome page, centered content canvas
 *
 * Evaluated at module load, same convention as responsive.ts. A browser
 * resize across the breakpoint requires a reload to re-tier — acceptable,
 * since real users almost never cross it mid-session.
 */

import { Dimensions, Platform } from 'react-native';

const width = Dimensions.get('window').width;

export const isWeb = Platform.OS === 'web';
export const isDesktopWeb = isWeb && width >= 1024;
export const isMobileWeb = isWeb && width < 1024;

/** Height of the fixed top navbar on desktop web. */
export const WEB_NAVBAR_HEIGHT = 64;

// The layout tier (phone / tablet / desktop) is baked in at module load —
// both here and in responsive.ts. On web the browser can resize across a
// tier boundary, which would leave every screen laid out for the wrong
// tier. Crossing a boundary is rare (dragging a window past 600/1024px),
// so the pragmatic fix is a one-shot reload once the resize settles.
if (isWeb) {
  const tierOf = (w: number) => (w >= 1024 ? 'desktop' : w >= 600 ? 'tablet' : 'phone');
  const initialTier = tierOf(width);
  let settleTimer: ReturnType<typeof setTimeout> | undefined;
  Dimensions.addEventListener('change', ({ window: win }) => {
    if (settleTimer) clearTimeout(settleTimer);
    // Hidden/backgrounded tabs can report a 0-width viewport — not a real tier change.
    if (win.width <= 0) return;
    if (tierOf(win.width) !== initialTier) {
      settleTimer = setTimeout(() => {
        (globalThis as any).location?.reload?.();
      }, 700);
    }
  });
}
