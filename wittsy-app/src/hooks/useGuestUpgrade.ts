/**
 * Guest Upgrade Hook
 * Manages when and how to prompt guest users to create accounts
 */

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getGuestProgress, shouldShowUpgradePrompt } from '../services/guestAuth';

export const useGuestUpgrade = () => {
  const { user, isGuest } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');
  const [guestProgress, setGuestProgress] = useState({
    gamesPlayed: 0,
    level: 1,
    achievements: 0,
    stars: 0,
  });

  // Check if we should show upgrade prompt
  const checkUpgradePrompt = async () => {
    if (!user || !isGuest) return;

    const { shouldShow, reason } = await shouldShowUpgradePrompt(user.uid);
    
    if (shouldShow) {
      const progress = await getGuestProgress(user.uid);
      setGuestProgress(progress);
      setUpgradeReason(reason);
      setShowUpgradeModal(true);
    }
  };

  // Manually trigger upgrade prompt (e.g., from settings or profile)
  const promptUpgrade = async () => {
    if (!user || !isGuest) return;

    const progress = await getGuestProgress(user.uid);
    setGuestProgress(progress);
    setUpgradeReason('manual');
    setShowUpgradeModal(true);
  };

  const closeUpgradeModal = () => {
    setShowUpgradeModal(false);
  };

  const handleUpgradeSuccess = () => {
    setShowUpgradeModal(false);
    // User will be automatically refreshed by AuthContext
  };

  return {
    isGuest,
    showUpgradeModal,
    upgradeReason,
    guestProgress,
    checkUpgradePrompt,
    promptUpgrade,
    closeUpgradeModal,
    handleUpgradeSuccess,
  };
};
