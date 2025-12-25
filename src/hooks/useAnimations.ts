/**
 * Hook for handling animations based on user settings
 */

import { useSettings } from '../contexts/SettingsContext';

export const useAnimations = () => {
  const { settings } = useSettings();
  
  const animationsEnabled = settings.gameplay.animationsEnabled;
  const reducedMotion = settings.gameplay.reducedMotion;
  
  // Determine if animations should play
  const shouldAnimate = animationsEnabled && !reducedMotion;
  
  // Get animation duration (reduced if reduced motion is on)
  const getAnimationDuration = (normalDuration: number): number => {
    if (!animationsEnabled) return 0;
    if (reducedMotion) return normalDuration * 0.3; // 70% faster
    return normalDuration;
  };
  
  // Get animation config for Animated API
  const getAnimationConfig = (config: any) => {
    if (!animationsEnabled) {
      return { ...config, duration: 0 };
    }
    if (reducedMotion && config.duration) {
      return { ...config, duration: config.duration * 0.3 };
    }
    return config;
  };
  
  return {
    shouldAnimate,
    animationsEnabled,
    reducedMotion,
    getAnimationDuration,
    getAnimationConfig,
  };
};
