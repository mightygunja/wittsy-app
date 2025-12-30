/**
 * Prompt Admin Service
 * Admin functions for reviewing and approving community-submitted prompts
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  updateDoc,
  query, 
  where, 
  orderBy,
  addDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { firestore } from './firebase';
import { PromptSubmission, Prompt, PromptCategory, PromptDifficulty } from '../types/prompts';

/**
 * Get all pending prompt submissions
 */
export const getPendingPromptSubmissions = async (): Promise<PromptSubmission[]> => {
  try {
    const q = query(
      collection(firestore, 'promptSubmissions'),
      where('status', '==', 'pending'),
      orderBy('submittedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PromptSubmission));
  } catch (error) {
    console.error('Error fetching pending submissions:', error);
    throw error;
  }
};

/**
 * Approve a prompt submission and add it to the active prompts
 */
export const approvePromptSubmission = async (
  submissionId: string,
  adminId: string,
  finalDifficulty?: PromptDifficulty
): Promise<string> => {
  try {
    // Get the submission
    const submissionRef = doc(firestore, 'promptSubmissions', submissionId);
    const submissionDoc = await getDoc(submissionRef);
    
    if (!submissionDoc.exists()) {
      throw new Error('Submission not found');
    }
    
    const submission = submissionDoc.data() as PromptSubmission;
    
    // Create the approved prompt
    const newPrompt: Omit<Prompt, 'id'> = {
      text: submission.text,
      category: submission.category,
      difficulty: finalDifficulty || submission.suggestedDifficulty,
      tags: submission.tags || [],
      status: 'active',
      isPremium: false,
      timesUsed: 0,
      rating: 0,
      ratingCount: 0,
      createdBy: submission.submittedBy,
      createdAt: new Date().toISOString(),
      lastUsed: null,
    };
    
    // Add to prompts collection
    const promptRef = await addDoc(collection(firestore, 'prompts'), newPrompt);
    
    // Update submission status
    await updateDoc(submissionRef, {
      status: 'approved',
      reviewedBy: adminId,
      reviewedAt: new Date().toISOString(),
      promptId: promptRef.id,
    });
    
    return promptRef.id;
  } catch (error) {
    console.error('Error approving prompt:', error);
    throw error;
  }
};

/**
 * Reject a prompt submission
 */
export const rejectPromptSubmission = async (
  submissionId: string,
  adminId: string,
  reason: string
): Promise<void> => {
  try {
    const submissionRef = doc(firestore, 'promptSubmissions', submissionId);
    
    await updateDoc(submissionRef, {
      status: 'rejected',
      reviewedBy: adminId,
      reviewedAt: new Date().toISOString(),
      rejectionReason: reason,
    });
  } catch (error) {
    console.error('Error rejecting prompt:', error);
    throw error;
  }
};

/**
 * Delete a prompt submission
 */
export const deletePromptSubmission = async (submissionId: string): Promise<void> => {
  try {
    await deleteDoc(doc(firestore, 'promptSubmissions', submissionId));
  } catch (error) {
    console.error('Error deleting submission:', error);
    throw error;
  }
};

/**
 * Get submission statistics
 */
export const getSubmissionStats = async (): Promise<{
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}> => {
  try {
    const allSubmissions = await getDocs(collection(firestore, 'promptSubmissions'));
    
    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: allSubmissions.size,
    };
    
    allSubmissions.forEach(doc => {
      const status = doc.data().status;
      if (status === 'pending') stats.pending++;
      else if (status === 'approved') stats.approved++;
      else if (status === 'rejected') stats.rejected++;
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting submission stats:', error);
    throw error;
  }
};
