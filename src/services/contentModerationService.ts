/**
 * Content Moderation Service
 * Filters inappropriate content and manages moderation queue
 */

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { firestore } from './firebase';
import { analytics } from './analytics';

// Profanity filter - basic word list (expand as needed)
const PROFANITY_LIST = [
  'fuck', 'shit', 'damn', 'ass', 'bitch', 'bastard', 'crap', 'hell',
  'dick', 'cock', 'pussy', 'cunt', 'fag', 'nigger', 'retard',
  // Add more as needed
];

// Regex patterns for detecting inappropriate content
const PATTERNS = {
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  PHONE: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  URL: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
  EXCESSIVE_CAPS: /[A-Z]{10,}/g,
  REPEATED_CHARS: /(.)\1{5,}/g,
};

export interface ModerationResult {
  isClean: boolean;
  filteredContent: string;
  violations: string[];
  severity: 'none' | 'low' | 'medium' | 'high';
  requiresReview: boolean;
}

export interface ContentReport {
  id?: string;
  contentId: string;
  contentType: 'message' | 'prompt' | 'response' | 'username' | 'room_name';
  content: string;
  reportedBy: string;
  reportedByUsername: string;
  reason: string;
  category: 'profanity' | 'harassment' | 'spam' | 'inappropriate' | 'other';
  status: 'pending' | 'reviewed' | 'actioned' | 'dismissed';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  action?: 'none' | 'warning' | 'content_removed' | 'user_banned';
}

/**
 * Moderate content before allowing it to be posted
 */
export const moderateContent = async (
  content: string,
  contentType: 'message' | 'prompt' | 'response' | 'username' | 'room_name'
): Promise<ModerationResult> => {
  const violations: string[] = [];
  let filteredContent = content;
  let severity: 'none' | 'low' | 'medium' | 'high' = 'none';

  // 1. Check for profanity
  const profanityCheck = checkProfanity(content);
  if (profanityCheck.hasProfanity) {
    violations.push('Contains profanity');
    filteredContent = profanityCheck.filtered;
    severity = 'medium';
  }

  // 2. Check for personal information
  if (PATTERNS.EMAIL.test(content)) {
    violations.push('Contains email address');
    filteredContent = filteredContent.replace(PATTERNS.EMAIL, '[EMAIL REMOVED]');
    severity = 'low';
  }

  if (PATTERNS.PHONE.test(content)) {
    violations.push('Contains phone number');
    filteredContent = filteredContent.replace(PATTERNS.PHONE, '[PHONE REMOVED]');
    severity = 'low';
  }

  // 3. Check for URLs (may want to allow some)
  if (PATTERNS.URL.test(content)) {
    violations.push('Contains URL');
    filteredContent = filteredContent.replace(PATTERNS.URL, '[LINK REMOVED]');
    severity = 'low';
  }

  // 4. Check for spam patterns
  if (PATTERNS.EXCESSIVE_CAPS.test(content)) {
    violations.push('Excessive caps');
    severity = severity === 'none' ? 'low' : severity;
  }

  if (PATTERNS.REPEATED_CHARS.test(content)) {
    violations.push('Repeated characters');
    filteredContent = filteredContent.replace(PATTERNS.REPEATED_CHARS, '$1$1$1');
    severity = severity === 'none' ? 'low' : severity;
  }

  // 5. Check content length
  if (contentType === 'message' && content.length > 500) {
    violations.push('Message too long');
    filteredContent = filteredContent.substring(0, 500);
    severity = 'low';
  }

  if (contentType === 'username' && content.length > 20) {
    violations.push('Username too long');
    filteredContent = filteredContent.substring(0, 20);
    severity = 'low';
  }

  // 6. Check for hate speech patterns (basic)
  const hateCheck = checkHateSpeech(content);
  if (hateCheck.isHateSpeech) {
    violations.push('Potential hate speech');
    severity = 'high';
  }

  // Determine if requires manual review
  const requiresReview = severity === 'high' || violations.length >= 3;

  // If requires review, add to moderation queue
  if (requiresReview) {
    await addToModerationQueue({
      content,
      filteredContent,
      contentType,
      violations,
      severity,
      timestamp: new Date().toISOString(),
    });
  }

  // Track analytics
  if (violations.length > 0) {
    analytics.logEvent('content_moderated', {
      content_type: contentType,
      violations: violations.join(', '),
      severity,
      requires_review: requiresReview,
    });
  }

  return {
    isClean: violations.length === 0,
    filteredContent,
    violations,
    severity,
    requiresReview,
  };
};

/**
 * Check for profanity and filter it
 */
const checkProfanity = (text: string): { hasProfanity: boolean; filtered: string } => {
  let filtered = text;
  let hasProfanity = false;

  const lowerText = text.toLowerCase();

  for (const word of PROFANITY_LIST) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (regex.test(lowerText)) {
      hasProfanity = true;
      filtered = filtered.replace(regex, '*'.repeat(word.length));
    }
  }

  return { hasProfanity, filtered };
};

/**
 * Check for hate speech patterns
 */
const checkHateSpeech = (text: string): { isHateSpeech: boolean; reason?: string } => {
  const lowerText = text.toLowerCase();

  // Basic hate speech patterns (expand as needed)
  const hatePatterns = [
    /\b(kill|murder|die)\s+(all\s+)?(jews|muslims|blacks|whites|gays|trans)/i,
    /\b(hate|despise)\s+(all\s+)?(jews|muslims|blacks|whites|gays|trans)/i,
    /\bnazi\b/i,
    /\bgenocide\b/i,
  ];

  for (const pattern of hatePatterns) {
    if (pattern.test(lowerText)) {
      return { isHateSpeech: true, reason: 'Hate speech detected' };
    }
  }

  return { isHateSpeech: false };
};

/**
 * Add content to moderation queue for manual review
 */
const addToModerationQueue = async (data: any): Promise<void> => {
  try {
    await addDoc(collection(firestore, 'moderationQueue'), {
      ...data,
      status: 'pending',
      addedAt: new Date().toISOString(),
    });
    console.log('✅ Content added to moderation queue');
  } catch (error) {
    console.error('Failed to add to moderation queue:', error);
  }
};

/**
 * Report inappropriate content
 */
export const reportContent = async (
  contentId: string,
  contentType: 'message' | 'prompt' | 'response' | 'username' | 'room_name',
  content: string,
  reportedBy: string,
  reportedByUsername: string,
  reason: string,
  category: 'profanity' | 'harassment' | 'spam' | 'inappropriate' | 'other'
): Promise<void> => {
  try {
    // Check if user has already reported this content
    const existingReports = query(
      collection(firestore, 'phraseReports'),
      where('contentId', '==', contentId),
      where('reportedBy', '==', reportedBy)
    );
    const snapshot = await getDocs(existingReports);

    if (!snapshot.empty) {
      throw new Error('You have already reported this content');
    }

    // Create report
    const report: Omit<ContentReport, 'id'> = {
      contentId,
      contentType,
      content,
      reportedBy,
      reportedByUsername,
      reason,
      category,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await addDoc(collection(firestore, 'phraseReports'), report);

    // Track analytics
    analytics.logEvent('content_reported', {
      content_type: contentType,
      category,
      reported_by: reportedBy,
    });

    console.log('✅ Content reported successfully');
  } catch (error) {
    console.error('Failed to report content:', error);
    throw error;
  }
};

/**
 * Get pending reports (admin only)
 */
export const getPendingReports = async (): Promise<ContentReport[]> => {
  try {
    const q = query(
      collection(firestore, 'phraseReports'),
      where('status', '==', 'pending')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as ContentReport));
  } catch (error) {
    console.error('Failed to get pending reports:', error);
    return [];
  }
};

/**
 * Review and action a report (admin only)
 */
export const reviewReport = async (
  reportId: string,
  reviewedBy: string,
  action: 'none' | 'warning' | 'content_removed' | 'user_banned',
  notes?: string
): Promise<void> => {
  try {
    const reportRef = doc(firestore, 'phraseReports', reportId);
    const reportDoc = await getDoc(reportRef);

    if (!reportDoc.exists()) {
      throw new Error('Report not found');
    }

    await updateDoc(reportRef, {
      status: 'reviewed',
      reviewedAt: new Date().toISOString(),
      reviewedBy,
      action,
      notes: notes || '',
    });

    // If action is content_removed or user_banned, take appropriate action
    if (action === 'content_removed') {
      // Delete the content (implementation depends on content type)
      // await deleteContent(reportDoc.data().contentId, reportDoc.data().contentType);
    }

    if (action === 'user_banned') {
      // Ban the user (implementation depends on your user management)
      // await banUser(reportDoc.data().reportedBy);
    }

    // Track analytics
    analytics.logEvent('report_reviewed', {
      report_id: reportId,
      action,
      reviewed_by: reviewedBy,
    });

    console.log('✅ Report reviewed and actioned');
  } catch (error) {
    console.error('Failed to review report:', error);
    throw error;
  }
};

/**
 * Check if user is banned
 */
export const isUserBanned = async (userId: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    if (!userDoc.exists()) return false;

    const userData = userDoc.data();
    return userData.banned === true || userData.status === 'banned';
  } catch (error) {
    console.error('Failed to check ban status:', error);
    return false;
  }
};

/**
 * Get user's report history
 */
export const getUserReportHistory = async (userId: string): Promise<ContentReport[]> => {
  try {
    const q = query(
      collection(firestore, 'phraseReports'),
      where('reportedBy', '==', userId)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as ContentReport));
  } catch (error) {
    console.error('Failed to get report history:', error);
    return [];
  }
};

/**
 * Validate username for inappropriate content
 */
export const validateUsername = async (username: string): Promise<{ valid: boolean; reason?: string }> => {
  const result = await moderateContent(username, 'username');

  if (!result.isClean) {
    return {
      valid: false,
      reason: result.violations.join(', '),
    };
  }

  // Additional username-specific checks
  if (username.length < 3) {
    return { valid: false, reason: 'Username too short (minimum 3 characters)' };
  }

  if (username.length > 20) {
    return { valid: false, reason: 'Username too long (maximum 20 characters)' };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, reason: 'Username can only contain letters, numbers, and underscores' };
  }

  return { valid: true };
};

/**
 * Validate room name for inappropriate content
 */
export const validateRoomName = async (roomName: string): Promise<{ valid: boolean; reason?: string }> => {
  const result = await moderateContent(roomName, 'room_name');

  if (!result.isClean) {
    return {
      valid: false,
      reason: result.violations.join(', '),
    };
  }

  if (roomName.length < 1) {
    return { valid: false, reason: 'Room name cannot be empty' };
  }

  if (roomName.length > 50) {
    return { valid: false, reason: 'Room name too long (maximum 50 characters)' };
  }

  return { valid: true };
};
