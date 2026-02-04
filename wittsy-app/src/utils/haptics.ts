/**
 * Haptic Feedback Utilities
 * Wrapper around expo-haptics for consistent haptic feedback
 */

import * as Haptics from 'expo-haptics';

export const light = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export const medium = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

export const heavy = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
};

export const success = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

export const warning = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
};

export const error = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};

export const selection = () => {
  Haptics.selectionAsync();
};
