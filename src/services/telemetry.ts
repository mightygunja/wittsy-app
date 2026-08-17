/**
 * First-party telemetry pipeline — works identically on iOS, Android, and web.
 *
 * Design:
 *  - Every analytics event (from analytics.ts's vocabulary) is buffered here
 *    and flushed as ONE Firestore document per batch to `analyticsEvents`
 *    (max ~25 events/doc) — write costs stay tiny even at high event volume.
 *  - A session starts at app launch (sessionId = random), ends when the app
 *    backgrounds; duration and screens-viewed ride on the session_end event.
 *  - Device / user context (platform, app version, device model, OS, locale,
 *    timezone, country guess) is captured once per session, attached to every
 *    flush doc, and merged onto users/{uid}.analytics for per-user analysis.
 *  - Location is derived from device locale/timezone — no GPS, no permission
 *    prompts, nothing to disclose beyond "coarse location" in privacy labels.
 *  - The dailyAnalyticsRollup Cloud Function aggregates these docs into
 *    analyticsDaily/{date} for dashboards (DAU, sessions, platform/country
 *    splits, gameplay funnels).
 */

import { AppState, AppStateStatus, Platform } from 'react-native';
import { firestore } from './firebase';
import { collection, addDoc, doc, setDoc, Timestamp } from 'firebase/firestore';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

export interface TelemetryEvent {
  name: string;
  params?: Record<string, unknown>;
  ts: number;
}

const FLUSH_INTERVAL_MS = 20000;
const MAX_BUFFER = 25;

const randomId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

function detectLocale(): string {
  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      return navigator.language || 'unknown';
    }
    return Intl.DateTimeFormat().resolvedOptions().locale || 'unknown';
  } catch {
    return 'unknown';
  }
}

function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';
  } catch {
    return 'unknown';
  }
}

/** Coarse country guess from the locale region subtag (en-US → US). */
function guessCountry(locale: string): string {
  const match = locale.match(/[-_]([A-Z]{2})\b/);
  return match ? match[1] : 'unknown';
}

class Telemetry {
  private buffer: TelemetryEvent[] = [];
  private sessionId = randomId();
  private sessionStart = Date.now();
  private sessionEnded = false;
  private screensViewed = 0;
  private lastScreen = '';
  private userId: string | null = null;
  private started = false;

  // Local dev traffic must not pollute production analytics.
  private readonly disabled =
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    /^(localhost|127\.0\.0\.1)$/.test(window.location?.hostname || '');

  private readonly context = {
    platform: Platform.OS,
    appVersion: Constants.expoConfig?.version || 'unknown',
    deviceModel: Device.modelName || 'unknown',
    osName: Device.osName || Platform.OS,
    osVersion: Device.osVersion || 'unknown',
    locale: detectLocale(),
    timezone: detectTimezone(),
    country: guessCountry(detectLocale()),
  };

  start() {
    if (this.started) return;
    this.started = true;

    this.track('session_start');
    setInterval(() => this.flush(), FLUSH_INTERVAL_MS);

    AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background' || state === 'inactive') {
        this.endSession();
      } else if (state === 'active' && Date.now() - this.sessionStart > 30 * 60 * 1000) {
        // Coming back after 30+ minutes counts as a new session
        this.sessionId = randomId();
        this.sessionStart = Date.now();
        this.sessionEnded = false;
        this.screensViewed = 0;
        this.track('session_start');
      }
    });

    // Web: browsers kill the page without a background transition
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.endSession());
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') this.endSession();
      });
    }
  }

  setUser(userId: string | null) {
    this.userId = userId;
    if (userId) {
      // Merge device/user context onto the profile for per-user analysis
      setDoc(
        doc(firestore, 'users', userId),
        {
          analytics: {
            ...this.context,
            lastActive: Timestamp.now(),
            lastSessionId: this.sessionId,
          },
        },
        { merge: true }
      ).catch(() => {});
    }
  }

  trackScreen(screenName: string) {
    if (screenName === this.lastScreen) return; // dedupe re-renders
    this.lastScreen = screenName;
    this.screensViewed++;
    this.track('screen_view', { screen: screenName });
  }

  track(name: string, params?: Record<string, unknown>) {
    this.buffer.push({ name, params: sanitize(params), ts: Date.now() });
    if (this.buffer.length >= MAX_BUFFER) this.flush();
  }

  private endSession() {
    // One end per session — tab switches on web would otherwise fire dozens.
    if (this.sessionEnded) return;
    this.sessionEnded = true;
    this.track('session_end', {
      durationSec: Math.round((Date.now() - this.sessionStart) / 1000),
      screensViewed: this.screensViewed,
    });
    this.flush();
  }

  async flush() {
    if (this.disabled || this.buffer.length === 0) return;
    const events = this.buffer.splice(0, this.buffer.length);
    try {
      await addDoc(collection(firestore, 'analyticsEvents'), {
        userId: this.userId,
        sessionId: this.sessionId,
        ...this.context,
        events,
        eventCount: events.length,
        flushedAt: Timestamp.now(),
      });
    } catch {
      // Most failures are pre-auth writes rejected by rules (visitor hasn't
      // tapped Play yet). Re-queue so the batch lands after sign-in; cap the
      // buffer so a persistent failure can't grow it unbounded.
      this.buffer = [...events, ...this.buffer].slice(0, MAX_BUFFER * 3);
    }
  }
}

/** Firestore rejects undefined values — strip them and clamp param size. */
function sanitize(params?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!params) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    out[k] = typeof v === 'string' && v.length > 200 ? v.slice(0, 200) : v;
  }
  return out;
}

declare const window: any;
declare const document: any;

export const telemetry = new Telemetry();
