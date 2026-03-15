/**
 * useForceUpdate
 * On mount, fetches /config/appConfig from Firestore and compares
 * minimumVersion against the installed app version.
 * Returns { updateRequired, minimumVersion, storeUrl } so the caller
 * can render a blocking update prompt.
 */

import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../services/firebase';

// Semantic version comparison: returns true if `installed` < `required`
const isVersionBehind = (installed: string, required: string): boolean => {
  const parse = (v: string) => v.split('.').map((n) => parseInt(n, 10) || 0);
  const a = parse(installed);
  const b = parse(required);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    if (ai < bi) return true;
    if (ai > bi) return false;
  }
  return false;
};

interface ForceUpdateState {
  checking: boolean;
  updateRequired: boolean;
  minimumVersion: string;
  storeUrl: string;
}

const IOS_STORE_URL = 'https://apps.apple.com/app/id6744508464';
const ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=com.wittsy.app';

export const useForceUpdate = (): ForceUpdateState => {
  const [state, setState] = useState<ForceUpdateState>({
    checking: true,
    updateRequired: false,
    minimumVersion: '0.0.0',
    storeUrl: Platform.OS === 'ios' ? IOS_STORE_URL : ANDROID_STORE_URL,
  });

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const snap = await getDoc(doc(firestore, 'config', 'appConfig'));
        if (cancelled) return;

        if (!snap.exists()) {
          // No config doc yet — don't block the user
          setState((s) => ({ ...s, checking: false }));
          return;
        }

        const data = snap.data();
        const minimumVersion: string = data?.minimumVersion ?? '0.0.0';
        const installedVersion: string =
          Constants.expoConfig?.version ?? '0.0.0';

        const updateRequired = isVersionBehind(installedVersion, minimumVersion);

        setState({
          checking: false,
          updateRequired,
          minimumVersion,
          storeUrl: Platform.OS === 'ios' ? IOS_STORE_URL : ANDROID_STORE_URL,
        });
      } catch (error) {
        // On error (offline, rules, etc.) don't block the user
        console.warn('Force update check failed:', error);
        if (!cancelled) setState((s) => ({ ...s, checking: false }));
      }
    };

    check();
    return () => { cancelled = true; };
  }, []);

  return state;
};
