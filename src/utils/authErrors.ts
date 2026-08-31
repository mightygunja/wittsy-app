/**
 * Maps raw Firebase auth errors to copy a player can act on.
 * Raw messages look like "Firebase: Error (auth/invalid-credential)."
 */
export const friendlyAuthError = (raw?: string): string => {
  if (!raw) return 'Something went wrong. Please try again.';
  if (
    raw.includes('auth/invalid-credential') ||
    raw.includes('auth/invalid-login-credentials') ||
    raw.includes('auth/wrong-password') ||
    raw.includes('auth/user-not-found')
  ) {
    return 'Incorrect email or password. Please try again.';
  }
  if (raw.includes('auth/email-already-in-use')) {
    return 'That email is already registered. Try signing in instead.';
  }
  if (raw.includes('auth/weak-password')) {
    return 'That password is too weak. Use at least 6 characters.';
  }
  if (raw.includes('auth/too-many-requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (raw.includes('auth/network-request-failed')) {
    return 'Connection issue. Check your internet and try again.';
  }
  if (raw.includes('auth/user-disabled')) {
    return 'This account has been disabled. Contact support for help.';
  }
  if (raw.includes('auth/invalid-email')) {
    return 'That email address doesn’t look right.';
  }
  // Strip Firebase's wrapper if an unmapped code slips through; custom
  // service messages (e.g. "Username already taken") pass through untouched.
  const cleaned = raw.replace(/^Firebase:\s*/, '').replace(/\s*\(auth\/[^)]+\)\.?$/, '').trim();
  return cleaned || 'Something went wrong. Please try again.';
};
