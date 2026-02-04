/**
 * Admin Check Utility
 * Determines if a user has admin privileges
 */

const ADMIN_EMAILS = [
  'mightygunja@gmail.com',
  'noshir2@gmail.com',
];

/**
 * Check if user is an admin based on email
 */
export const isAdmin = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

/**
 * Check if user is an admin based on user object
 */
export const isUserAdmin = (user: { email?: string | null } | null | undefined): boolean => {
  if (!user?.email) return false;
  return isAdmin(user.email);
};
