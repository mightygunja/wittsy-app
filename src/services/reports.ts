/**
 * Content reporting (Apple UGC requirement).
 * Users can flag community content; reports land in the `reports` collection
 * for review in the Firebase console.
 */

import { firestore } from './firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export type ReportableContentType = 'starredPhrase';

export const reportContent = async (params: {
  contentType: ReportableContentType;
  contentId: string;
  reporterId: string;
  reportedUserId?: string;
  contentText?: string;
  reason?: string;
}): Promise<void> => {
  await addDoc(collection(firestore, 'reports'), {
    contentType: params.contentType,
    contentId: params.contentId,
    reporterId: params.reporterId,
    reportedUserId: params.reportedUserId || null,
    contentText: params.contentText || '',
    reason: params.reason || 'inappropriate',
    status: 'pending',
    createdAt: Timestamp.now(),
  });
};
