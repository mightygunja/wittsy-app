/**
 * Guest Upgrade Hook
 * Manages when and how to prompt guest users to create accounts
 */

import { useState } from 'react';
import { useAuth } from './useAuth';
import { getGuestProgress, shouldShowUpgradePrompt } from '../services/guestAuth';

export const useGuestUpgrade = () => {
  const { user, isGuest: contextIsGuest, refreshUserProfile } = useAuth();
  // Firebase's onAuthStateChanged does not re-fire when an anonymous account is
  // linked to a permanent credential, so the context flag goes stale after a
  // successful upgrade. Track the upgrade locally so guest UI hides right away.
  const [upgradedThisSession, setUpgradedThisSession] = useState(false);
  const isGuest = contextIsGuest && !upgradedThisSession;
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

  const handleUpgradeSuccess = async () => {
    setShowUpgradeModal(false);
    setUpgradedThisSession(true);
    // Pull the updated username/email into the in-memory profile
    try {
      await refreshUserProfile();
    } catch {
      // Non-fatal: the profile will refresh on the next auth state change
    }
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
