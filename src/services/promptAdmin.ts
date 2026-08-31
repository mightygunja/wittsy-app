/**
 * Prompt Admin Service
 * Admin functions for reviewing and approving community-submitted prompts
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { firestore } from './firebase';
import { PromptSubmission, Prompt, PromptDifficulty } from '../types/prompts';

/**
 * Queue an in-app notification for a submitter inside an existing batch.
 * The notifications collection allows any signed-in user to create a doc
 * for another user (userId + type required; title <= 200, body <= 500).
 */
const queueSubmitterNotification = (
  batch: ReturnType<typeof writeBatch>,
  userId: string,
  type: 'prompt_approved' | 'prompt_rejected',
  title: string,
  message: string
): void => {
  const notificationRef = doc(collection(firestore, 'notifications'));
  batch.set(notificationRef, {
    userId,
    type,
    title: title.slice(0, 200),
    message: message.slice(0, 500),
    read: false,
    createdAt: new Date().toISOString(),
  });
};

/** Shorten prompt text for use inside a notification message. */
const previewText = (text: string, max: number = 80): string =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

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

    if (submission.status !== 'pending') {
      throw new Error('Submission has already been reviewed');
    }

    // Look up the submitter's username so the library can credit them
    let creatorName: string | null = null;
    try {
      const submitterDoc = await getDoc(doc(firestore, 'users', submission.submittedBy));
      creatorName = submitterDoc.exists() ? (submitterDoc.data().username || null) : null;
    } catch {
      // Credit is best-effort; approval proceeds without it
    }

    // Create the approved prompt
    const newPrompt: Omit<Prompt, 'id'> & { createdByName?: string } = {
      text: submission.text,
      category: submission.category,
      difficulty: finalDifficulty || submission.suggestedDifficulty,
      tags: submission.tags || [],
      status: 'active',
      isOfficial: false,
      isPremium: false,
      timesUsed: 0,
      averageRating: 0,
      reportCount: 0,
      createdBy: submission.submittedBy,
      ...(creatorName ? { createdByName: creatorName } : {}),
      createdAt: new Date().toISOString(),
      moderatedBy: adminId,
      moderatedAt: new Date().toISOString(),
    };

    // Atomically: create the prompt, mark the submission approved, and
    // notify the submitter. A single batch means a retry can never leave
    // a live prompt behind with the submission still pending.
    const batch = writeBatch(firestore);
    const promptRef = doc(collection(firestore, 'prompts'));
    batch.set(promptRef, newPrompt);
    batch.update(submissionRef, {
      status: 'approved',
      reviewedBy: adminId,
      reviewedAt: new Date().toISOString(),
      promptId: promptRef.id,
    });
    queueSubmitterNotification(
      batch,
      submission.submittedBy,
      'prompt_approved',
      'Prompt Approved! 🎉',
      `Your prompt "${previewText(submission.text)}" is now live in the Prompt Library, credited to you.`
    );
    await batch.commit();

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
    const submissionDoc = await getDoc(submissionRef);

    if (!submissionDoc.exists()) {
      throw new Error('Submission not found');
    }

    const submission = submissionDoc.data() as PromptSubmission;

    const batch = writeBatch(firestore);
    batch.update(submissionRef, {
      status: 'rejected',
      reviewedBy: adminId,
      reviewedAt: new Date().toISOString(),
      rejectionReason: reason,
    });
    queueSubmitterNotification(
      batch,
      submission.submittedBy,
      'prompt_rejected',
      'Prompt Not Approved',
      `Your prompt "${previewText(submission.text)}" wasn't approved this time. Check the submission guidelines and feel free to submit another!`
    );
    await batch.commit();
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
