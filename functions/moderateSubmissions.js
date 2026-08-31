/**
 * Server-side moderation for user-submitted prompts.
 *
 * The client runs a basic profanity check before submitting, but a modified
 * client bypasses it. This trigger is the enforcement point: every new
 * promptSubmissions doc is auto-checked (length + content filter). Failures
 * are rejected immediately with an in-app notification to the submitter;
 * passes are queued in moderationQueue for admin review (the rules already
 * reserve that collection for server-only writes).
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { isCleanForPublic } = require('./contentFilter');
const db = admin.firestore();

exports.moderatePromptSubmission = functions.firestore
  .document('promptSubmissions/{submissionId}')
  .onCreate(async (snap) => {
    const s = snap.data();
    if (!s) return null;
    const text = String(s.text || '').trim();

    let rejectReason = null;
    if (text.length < 10 || text.length > 200) {
      rejectReason = 'Prompts must be between 10 and 200 characters.';
    } else if (!isCleanForPublic(text)) {
      rejectReason = 'Your prompt didn\'t pass the content check. Keep it clean enough for the public gallery and try again.';
    }

    if (rejectReason) {
      await snap.ref.update({
        status: 'rejected',
        moderatedBy: 'auto',
        moderationReason: rejectReason,
        reviewedAt: admin.firestore.Timestamp.now(),
      });

      if (s.submittedBy) {
        await db.collection('notifications').add({
          userId: s.submittedBy,
          type: 'prompt_rejected',
          title: 'Prompt Not Approved',
          message: rejectReason,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
      return null;
    }

    // Passed auto-checks — queue for human review.
    await db.collection('moderationQueue').add({
      submissionId: snap.id,
      text,
      category: s.category || null,
      submittedBy: s.submittedBy || null,
      status: 'pending',
      createdAt: admin.firestore.Timestamp.now(),
    });
    return null;
  });
