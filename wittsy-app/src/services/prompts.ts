/**
 * Prompt Management Service
 * Handles prompt fetching, filtering, community submissions, and moderation
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  updateDoc,
  query, 
  where, 
  orderBy, 
  limit,
  increment,
  Timestamp,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { firestore } from './firebase';
import { 
  Prompt, 
  PromptPack, 
  PromptSubmission, 
  PhraseReport,
  PromptCategory,
  PromptDifficulty,
  UserPromptPreferences 
} from '../types/prompts';

// Profanity filter words (basic list - expand as needed)
const PROFANITY_LIST = [
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'hell', 'crap',
  'bastard', 'dick', 'pussy', 'cock', 'slut', 'whore'
];

/**
 * Get random prompt based on user preferences
 */
export const getRandomPrompt = async (
  userId?: string,
  roomSettings?: { categories?: PromptCategory[], difficulty?: PromptDifficulty }
): Promise<Prompt | null> => {
  try {
    let preferences: UserPromptPreferences | null = null;
    
    if (userId) {
      preferences = await getUserPromptPreferences(userId);
    }
    
    // Build query constraints
    const constraints: any[] = [where('status', '==', 'active')];
    
    // Filter by categories
    const allowedCategories = roomSettings?.categories || 
      preferences?.enabledCategories || 
      ['general', 'pop-culture', 'food', 'technology'];
    
    if (allowedCategories.length > 0) {
      constraints.push(where('category', 'in', allowedCategories.slice(0, 10))); // Firestore limit
    }
    
    // Filter by difficulty
    if (roomSettings?.difficulty) {
      constraints.push(where('difficulty', '==', roomSettings.difficulty));
    }
    
    // Filter premium content
    if (!preferences?.ownedPacks?.length) {
      constraints.push(where('isPremium', '==', false));
    }
    
    // Filter NSFW
    if (!preferences?.nsfwContent) {
      constraints.push(where('category', '!=', 'nsfw'));
    }
    
    const q = query(collection(firestore, 'prompts'), ...constraints, limit(50));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.warn('No prompts found, using fallback');
      return getFallbackPrompt();
    }
    
    // Get random prompt from results
    const prompts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prompt));
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    
    // Increment usage count
    await updateDoc(doc(firestore, 'prompts', randomPrompt.id), {
      timesUsed: increment(1)
    });
    
    return randomPrompt;
  } catch (error) {
    console.error('Error getting random prompt:', error);
    return getFallbackPrompt();
  }
};

/**
 * Fallback prompt if database fails
 */
const getFallbackPrompt = (): Prompt => ({
  id: 'fallback',
  text: 'The best thing about weekends',
  category: 'general',
  difficulty: 'easy',
  tags: ['general', 'fun'],
  status: 'active',
  createdAt: new Date().toISOString(),
  isOfficial: true,
  isPremium: false,
  timesUsed: 0,
  averageRating: 0,
  reportCount: 0,
});

/**
 * Get prompts by category
 */
export const getPromptsByCategory = async (
  category: PromptCategory,
  limitCount: number = 20
): Promise<Prompt[]> => {
  try {
    const q = query(
      collection(firestore, 'prompts'),
      where('category', '==', category),
      where('status', '==', 'active'),
      orderBy('timesUsed', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prompt));
  } catch (error) {
    console.error('Error getting prompts by category:', error);
    return [];
  }
};

/**
 * Get all prompt packs
 */
export const getPromptPacks = async (includeExpired: boolean = false): Promise<PromptPack[]> => {
  try {
    const constraints: any[] = [];
    
    if (!includeExpired) {
      const now = new Date().toISOString();
      constraints.push(where('availableUntil', '>=', now));
    }
    
    const q = query(collection(firestore, 'promptPacks'), ...constraints, orderBy('downloadCount', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromptPack));
  } catch (error) {
    console.error('Error getting prompt packs:', error);
    return [];
  }
};

/**
 * Get user's prompt preferences
 */
export const getUserPromptPreferences = async (userId: string): Promise<UserPromptPreferences | null> => {
  try {
    const docRef = doc(firestore, 'userPromptPreferences', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserPromptPreferences;
    }
    
    // Return defaults
    return {
      userId,
      enabledCategories: ['general', 'pop-culture', 'food', 'technology', 'movies', 'music'],
      disabledCategories: ['nsfw'],
      difficulty: ['easy', 'medium', 'hard'],
      profanityFilter: true,
      nsfwContent: false,
      ownedPacks: [],
      favoritePacks: [],
    };
  } catch (error) {
    console.error('Error getting user prompt preferences:', error);
    return null;
  }
};

/**
 * Update user's prompt preferences
 */
export const updateUserPromptPreferences = async (
  userId: string,
  preferences: Partial<UserPromptPreferences>
): Promise<void> => {
  try {
    const docRef = doc(firestore, 'userPromptPreferences', userId);
    await setDoc(docRef, { userId, ...preferences }, { merge: true });
  } catch (error) {
    console.error('Error updating prompt preferences:', error);
    throw error;
  }
};

/**
 * Submit a community prompt
 */
export const submitPrompt = async (
  userId: string,
  promptText: string,
  category: PromptCategory,
  difficulty: PromptDifficulty,
  tags: string[]
): Promise<string> => {
  try {
    // Check for profanity
    if (containsProfanity(promptText)) {
      throw new Error('Prompt contains inappropriate language');
    }
    
    const submission: Omit<PromptSubmission, 'id'> = {
      text: promptText.trim(),
      category,
      suggestedDifficulty: difficulty,
      tags,
      submittedBy: userId,
      submittedAt: new Date().toISOString(),
      status: 'pending',
      upvotes: 0,
      downvotes: 0,
      reportCount: 0,
    };
    
    const docRef = await addDoc(collection(firestore, 'promptSubmissions'), submission);
    return docRef.id;
  } catch (error) {
    console.error('Error submitting prompt:', error);
    throw error;
  }
};

/**
 * Vote on a prompt submission
 */
export const voteOnPromptSubmission = async (
  submissionId: string,
  userId: string,
  isUpvote: boolean
): Promise<void> => {
  try {
    const docRef = doc(firestore, 'promptSubmissions', submissionId);
    const field = isUpvote ? 'upvotes' : 'downvotes';
    
    await updateDoc(docRef, {
      [field]: increment(1)
    });
  } catch (error) {
    console.error('Error voting on prompt submission:', error);
    throw error;
  }
};

/**
 * Report a phrase
 */
export const reportPhrase = async (
  phraseText: string,
  promptId: string,
  roomId: string,
  reportedUserId: string,
  reportedUsername: string,
  reportedBy: string,
  reason: 'offensive' | 'spam' | 'inappropriate' | 'other',
  details?: string
): Promise<string> => {
  try {
    const report: Omit<PhraseReport, 'id'> = {
      phraseText,
      promptId,
      roomId,
      reportedBy,
      reportedAt: new Date().toISOString(),
      reason,
      details,
      userId: reportedUserId,
      username: reportedUsername,
      status: 'pending',
    };
    
    const docRef = await addDoc(collection(firestore, 'phraseReports'), report);
    
    // Increment report count on prompt
    await updateDoc(doc(firestore, 'prompts', promptId), {
      reportCount: increment(1)
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error reporting phrase:', error);
    throw error;
  }
};

/**
 * Check if text contains profanity
 */
export const containsProfanity = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return PROFANITY_LIST.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerText);
  });
};

/**
 * Filter profanity from text
 */
export const filterProfanity = (text: string): string => {
  let filtered = text;
  PROFANITY_LIST.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  });
  return filtered;
};

/**
 * Get pending prompt submissions (admin only)
 */
export const getPendingSubmissions = async (limitCount: number = 50): Promise<PromptSubmission[]> => {
  try {
    const q = query(
      collection(firestore, 'promptSubmissions'),
      where('status', '==', 'pending'),
      orderBy('submittedAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromptSubmission));
  } catch (error) {
    console.error('Error getting pending submissions:', error);
    return [];
  }
};

/**
 * Approve prompt submission (admin only)
 */
export const approvePromptSubmission = async (
  submissionId: string,
  adminUserId: string
): Promise<void> => {
  try {
    const submissionRef = doc(firestore, 'promptSubmissions', submissionId);
    const submissionSnap = await getDoc(submissionRef);
    
    if (!submissionSnap.exists()) {
      throw new Error('Submission not found');
    }
    
    const submission = submissionSnap.data() as PromptSubmission;
    
    // Create official prompt
    const prompt: Omit<Prompt, 'id'> = {
      text: submission.text,
      category: submission.category,
      difficulty: submission.suggestedDifficulty,
      tags: submission.tags,
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: submission.submittedBy,
      isOfficial: false,
      isPremium: false,
      timesUsed: 0,
      averageRating: 0,
      reportCount: 0,
      moderatedBy: adminUserId,
      moderatedAt: new Date().toISOString(),
    };
    
    await addDoc(collection(firestore, 'prompts'), prompt);
    
    // Update submission status
    await updateDoc(submissionRef, {
      status: 'approved',
      reviewedBy: adminUserId,
      reviewedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error approving prompt submission:', error);
    throw error;
  }
};

/**
 * Reject prompt submission (admin only)
 */
export const rejectPromptSubmission = async (
  submissionId: string,
  adminUserId: string,
  reason: string
): Promise<void> => {
  try {
    const submissionRef = doc(firestore, 'promptSubmissions', submissionId);
    await updateDoc(submissionRef, {
      status: 'rejected',
      reviewedBy: adminUserId,
      reviewedAt: new Date().toISOString(),
      reviewNotes: reason,
    });
  } catch (error) {
    console.error('Error rejecting prompt submission:', error);
    throw error;
  }
};

/**
 * Get pending phrase reports (admin only)
 */
export const getPendingReports = async (limitCount: number = 50): Promise<PhraseReport[]> => {
  try {
    const q = query(
      collection(firestore, 'phraseReports'),
      where('status', '==', 'pending'),
      orderBy('reportedAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PhraseReport));
  } catch (error) {
    console.error('Error getting pending reports:', error);
    return [];
  }
};

/**
 * Review phrase report (admin only)
 */
export const reviewPhraseReport = async (
  reportId: string,
  adminUserId: string,
  action: 'warning' | 'temp-ban' | 'permanent-ban' | 'none',
  notes: string
): Promise<void> => {
  try {
    const reportRef = doc(firestore, 'phraseReports', reportId);
    await updateDoc(reportRef, {
      status: 'reviewed',
      reviewedBy: adminUserId,
      reviewedAt: new Date().toISOString(),
      action,
      reviewNotes: notes,
    });
    
    // TODO: Implement actual user ban/warning system
  } catch (error) {
    console.error('Error reviewing phrase report:', error);
    throw error;
  }
};
