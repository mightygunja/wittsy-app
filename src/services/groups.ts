/**
 * Groups Service
 * Create and manage player groups, invite members, track group game stats
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch,
} from 'firebase/firestore';
import { Share, Alert } from 'react-native';
import { firestore } from './firebase';
import { Group, GroupMember, GroupMemberStats } from '../types/social';
import { DEEP_LINK_SCHEMES } from '../types/platform';
import { friendlyServiceError } from '../utils/friendlyError';

// ==================== HELPERS ====================

const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

/**
 * Map raw Firebase errors to copy a user can act on.
 * Our own thrown errors (e.g. "Only admins can remove members") pass through.
 */
// Shared implementation lives in utils/friendlyError — kept as a re-export
// so the three group screens don't need touching.
export const getGroupErrorMessage = friendlyServiceError;

// ==================== GROUP CRUD ====================

export const createGroup = async (
  createdBy: string,
  creatorUsername: string,
  name: string,
  description?: string
): Promise<string> => {
  const inviteCode = generateInviteCode();

  const groupData = {
    name: name.trim(),
    description: description?.trim() || '',
    createdBy,
    createdAt: Timestamp.now(),
    inviteCode,
    memberCount: 1,
    members: [createdBy],
  };

  const groupRef = doc(collection(firestore, 'groups'));
  const groupId = groupRef.id;

  // Step 1 (atomic): group doc + creator's userGroups index entry, so the group
  // always appears in the creator's list even if a later write fails.
  const batch = writeBatch(firestore);
  batch.set(groupRef, groupData);
  batch.set(
    doc(firestore, 'userGroups', createdBy, 'groups', groupId),
    { groupId, name: name.trim(), joinedAt: new Date().toISOString() }
  );
  await batch.commit();

  // Step 2: creator's roster doc. Security rules verify membership via get() on
  // the committed group doc, so this write cannot join step 1's batch.
  await setDoc(
    doc(firestore, 'groups', groupId, 'groupMembers', createdBy),
    {
      userId: createdBy,
      username: creatorUsername,
      role: 'admin',
      joinedAt: new Date().toISOString(),
    }
  );

  // Note: groupStats docs are created/settled exclusively by the endGame Cloud
  // Function (client writes to groupStats are denied by rules).

  return groupId;
};

export const getGroup = async (groupId: string): Promise<Group | null> => {
  const snap = await getDoc(doc(firestore, 'groups', groupId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Group;
};

export const getUserGroups = async (userId: string): Promise<Group[]> => {
  try {
    const snap = await getDocs(collection(firestore, 'userGroups', userId, 'groups'));
    if (snap.empty) return [];

    const groups: Group[] = [];
    for (const entry of snap.docs) {
      const group = await getGroup(entry.data().groupId);
      if (group) groups.push(group);
    }
    return groups;
  } catch (error: any) {
    // If permission denied, user likely has no groups yet or auth not ready
    if (error?.code === 'permission-denied') {
      return [];
    }
    throw error;
  }
};

export const subscribeToUserGroups = (
  userId: string,
  onUpdate: (groups: Group[]) => void
): (() => void) => {
  return onSnapshot(
    collection(firestore, 'userGroups', userId, 'groups'),
    async (snap) => {
      const groups: Group[] = [];
      for (const entry of snap.docs) {
        const group = await getGroup(entry.data().groupId);
        if (group) groups.push(group);
      }
      onUpdate(groups);
    }
  );
};

// ==================== MEMBERSHIP ====================

export const joinGroupViaInviteCode = async (
  inviteCode: string,
  userId: string,
  username: string,
  avatar?: any
): Promise<{ success: boolean; groupId?: string; error?: string }> => {
  try {
    // Find group by invite code
    const q = query(
      collection(firestore, 'groups'),
      where('inviteCode', '==', inviteCode.toUpperCase())
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      return { success: false, error: 'Invalid invite code' };
    }

    const groupDoc = snap.docs[0];
    const groupId = groupDoc.id;
    const groupData = groupDoc.data() as Group;

    const memberDocRef = doc(firestore, 'groups', groupId, 'groupMembers', userId);
    const indexDocRef = doc(firestore, 'userGroups', userId, 'groups', groupId);

    // Already a member — self-heal roster/index docs in case an earlier join
    // was interrupted partway, then navigate.
    if (groupData.members?.includes(userId)) {
      try {
        const existing = await getDoc(memberDocRef);
        const healBatch = writeBatch(firestore);
        if (!existing.exists()) {
          healBatch.set(memberDocRef, {
            userId,
            username,
            avatar: avatar || null,
            role: 'member',
            joinedAt: new Date().toISOString(),
          });
        }
        healBatch.set(
          indexDocRef,
          { groupId, name: groupData.name, joinedAt: new Date().toISOString() },
          { merge: true }
        );
        await healBatch.commit();
      } catch {
        // Best effort — membership itself is already established
      }
      return { success: true, groupId };
    }

    // Step 1: append self to the group's member list. Rules only permit a
    // non-member to change exactly members(+self) and memberCount(+1).
    await updateDoc(doc(firestore, 'groups', groupId), {
      members: arrayUnion(userId),
      memberCount: increment(1),
    });

    // Step 2 (atomic): roster doc + userGroups index together. Rules check
    // membership via get() on the committed group doc, so this must follow
    // step 1 and cannot share its batch.
    try {
      const batch = writeBatch(firestore);
      batch.set(memberDocRef, {
        userId,
        username,
        avatar: avatar || null,
        role: 'member',
        joinedAt: new Date().toISOString(),
      });
      batch.set(indexDocRef, {
        groupId,
        name: groupData.name,
        joinedAt: new Date().toISOString(),
      });
      await batch.commit();
    } catch (error: any) {
      // Membership was granted but roster/index writes failed. Re-entering the
      // invite code hits the self-heal branch above and completes the join.
      console.error('joinGroupViaInviteCode roster write failed:', error);
      return {
        success: false,
        error: 'We hit a problem partway through joining. Enter the invite code again to finish.',
      };
    }

    // Note: groupStats docs are created/settled exclusively by the endGame
    // Cloud Function (client writes to groupStats are denied by rules).

    return { success: true, groupId };
  } catch (error: any) {
    console.error('joinGroupViaInviteCode error:', error);
    return { success: false, error: getGroupErrorMessage(error, 'Failed to join group') };
  }
};

export const addMemberFromFriends = async (
  groupId: string,
  userId: string,
  username: string,
  avatar?: any
): Promise<void> => {
  const group = await getGroup(groupId);
  if (!group) throw new Error('Group not found');
  if (group.members?.includes(userId)) return; // already a member

  // Single atomic batch — the caller (an existing member) satisfies the
  // membership checks in rules for every write here.
  const batch = writeBatch(firestore);
  batch.set(doc(firestore, 'groups', groupId, 'groupMembers', userId), {
    userId,
    username,
    avatar: avatar || null,
    role: 'member',
    joinedAt: new Date().toISOString(),
  });
  batch.update(doc(firestore, 'groups', groupId), {
    members: arrayUnion(userId),
    memberCount: increment(1),
  });
  batch.set(doc(firestore, 'userGroups', userId, 'groups', groupId), {
    groupId,
    name: group.name,
    joinedAt: new Date().toISOString(),
  });
  await batch.commit();
};

export const leaveGroup = async (groupId: string, userId: string): Promise<void> => {
  // Single atomic batch so membership state can never end up half-removed.
  const batch = writeBatch(firestore);
  batch.delete(doc(firestore, 'groups', groupId, 'groupMembers', userId));
  batch.update(doc(firestore, 'groups', groupId), {
    members: arrayRemove(userId),
    memberCount: increment(-1),
  });
  batch.delete(doc(firestore, 'userGroups', userId, 'groups', groupId));
  await batch.commit();
};

export const removeMember = async (
  groupId: string,
  adminId: string,
  targetUserId: string
): Promise<void> => {
  // Verify caller is admin
  const adminDoc = await getDoc(doc(firestore, 'groups', groupId, 'groupMembers', adminId));
  if (!adminDoc.exists() || adminDoc.data()?.role !== 'admin') {
    throw new Error('Only admins can remove members');
  }
  await leaveGroup(groupId, targetUserId);
};

export const promoteMember = async (
  groupId: string,
  adminId: string,
  targetUserId: string
): Promise<void> => {
  // Verify caller is admin
  const adminDoc = await getDoc(doc(firestore, 'groups', groupId, 'groupMembers', adminId));
  if (!adminDoc.exists() || adminDoc.data()?.role !== 'admin') {
    throw new Error('Only admins can promote members');
  }
  await updateDoc(doc(firestore, 'groups', groupId, 'groupMembers', targetUserId), {
    role: 'admin',
  });
};

/**
 * Delete a group entirely (creator only, enforced by security rules).
 * Removes every member's roster doc and userGroups index entry plus the group
 * doc itself in one atomic batch, so the invite code stops resolving.
 * groupStats docs are server-owned and become unreachable once the group doc
 * is gone (their read rule depends on the group doc existing).
 */
export const deleteGroup = async (groupId: string, userId: string): Promise<void> => {
  const group = await getGroup(groupId);
  if (!group) return; // already gone
  // The creator can always delete; a sole remaining member can too (rules
  // allow it) — otherwise the last non-creator leaver would orphan the group
  // with a live invite code.
  const isSoleMember = (group.members || []).length === 1 && group.members[0] === userId;
  if (group.createdBy !== userId && !isSoleMember) {
    throw new Error('Only the group creator can delete the group');
  }

  const membersSnap = await getDocs(collection(firestore, 'groups', groupId, 'groupMembers'));
  const memberIds = new Set<string>(group.members || []);
  membersSnap.docs.forEach((d) => memberIds.add(d.id));

  const batch = writeBatch(firestore);
  membersSnap.docs.forEach((d) => batch.delete(d.ref));
  memberIds.forEach((uid) =>
    batch.delete(doc(firestore, 'userGroups', uid, 'groups', groupId))
  );
  batch.delete(doc(firestore, 'groups', groupId));
  await batch.commit();
};

// ==================== MEMBERS & STATS ====================

export const getGroupMembers = async (groupId: string): Promise<GroupMember[]> => {
  const snap = await getDocs(collection(firestore, 'groups', groupId, 'groupMembers'));
  return snap.docs.map((d) => d.data() as GroupMember);
};

export const subscribeToGroupMembers = (
  groupId: string,
  onUpdate: (members: GroupMember[]) => void
): (() => void) => {
  return onSnapshot(
    collection(firestore, 'groups', groupId, 'groupMembers'),
    (snap) => onUpdate(snap.docs.map((d) => d.data() as GroupMember))
  );
};

export const getGroupStandings = async (groupId: string): Promise<GroupMemberStats[]> => {
  const snap = await getDocs(
    query(
      collection(firestore, 'groups', groupId, 'groupStats'),
      orderBy('totalPoints', 'desc')
    )
  );
  return snap.docs.map((d) => d.data() as GroupMemberStats);
};

// Note: group stats are settled exclusively by the endGame Cloud Function
// (client writes to groups/{id}/groupStats are denied by security rules).

// ==================== GROUP GAMES ====================

export const subscribeToGroupActiveRooms = (
  groupId: string,
  onUpdate: (rooms: any[]) => void
): (() => void) => {
  const q = query(
    collection(firestore, 'rooms'),
    where('groupId', '==', groupId),
    where('status', 'in', ['waiting', 'active'])
  );
  return onSnapshot(q, (snap) => {
    onUpdate(snap.docs.map((d) => ({ roomId: d.id, ...d.data() })));
  }, (error) => {
    console.error('subscribeToGroupActiveRooms error:', error);
    onUpdate([]);
  });
};

// ==================== INVITE LINKS ====================

export const regenerateInviteCode = async (
  groupId: string,
  adminId: string
): Promise<string> => {
  const adminDoc = await getDoc(doc(firestore, 'groups', groupId, 'groupMembers', adminId));
  if (!adminDoc.exists() || adminDoc.data()?.role !== 'admin') {
    throw new Error('Only admins can regenerate the invite code');
  }
  const newCode = generateInviteCode();
  await updateDoc(doc(firestore, 'groups', groupId), { inviteCode: newCode });
  return newCode;
};

export const buildGroupInviteLink = (inviteCode: string): string => {
  // Universal link, same as game-room shares: opens the app when installed and
  // falls back to the website otherwise. The custom wittsy:// scheme shows an
  // error dialog on iOS when the app is not installed (see deepLinking.ts).
  // deepLinking's urlToConfig already parses /group/{code}.
  return `${DEEP_LINK_SCHEMES.universal}/group/${inviteCode}`;
};

export const shareGroupInviteLink = async (
  groupName: string,
  inviteCode: string
): Promise<void> => {
  const url = buildGroupInviteLink(inviteCode);
  const message = `Join my Wittz group "${groupName}"! Use code ${inviteCode} in the app or tap: ${url}`;
  try {
    await Share.share({ message });
  } catch (error: any) {
    console.error('Failed to share group invite:', error);
    Alert.alert(
      'Invite Code',
      `Share your group invite code:\n\n${inviteCode}\n\nOr share this link:\n${url}`,
      [{ text: 'OK' }]
    );
  }
};
