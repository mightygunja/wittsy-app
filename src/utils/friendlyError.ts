/**
 * Generic service-error → user-copy mapper.
 *
 * One implementation for every non-auth feature (groups, friends, events,
 * prompts, ...): Firebase infrastructure errors get actionable copy, messages
 * the app threw itself pass through verbatim (they are already written for
 * the user), and anything unrecognized falls back to the caller's message.
 * Auth flows keep their own mapper (utils/authErrors) for auth/* codes.
 */
export const friendlyServiceError = (error: any, fallback: string): string => {
  const code: string = error?.code || '';
  const message: string = String(error?.message || '');

  if (code === 'permission-denied' || message.includes('insufficient permissions')) {
    return "You don't have permission to do that. Refresh and try again.";
  }
  if (
    code === 'unavailable' ||
    code === 'deadline-exceeded' ||
    message.toLowerCase().includes('network')
  ) {
    return 'Network problem — check your connection and try again.';
  }
  // Errors we threw ourselves are already user-friendly; raw SDK errors
  // (which carry a code or mention Firebase internals) are not.
  if (!code && message && !message.includes('Firebase') && !message.toLowerCase().includes('firestore')) {
    return message;
  }
  return fallback;
};
