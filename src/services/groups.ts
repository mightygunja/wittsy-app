/**
 * Groups Service
 * Create and manage player groups, invite members, track group game stats
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { firestore } from './firebase';
import { Group, GroupMember, GroupMemberStats } from '../types/social';

// ==================== HELPERS ====================

const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

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

  const groupRef = await addDoc(collection(firestore, 'groups'), groupData);
  const groupId = groupRef.id;

  // Add creator as admin member
  await setDoc(
    doc(firestore, 'groups', groupId, 'groupMembers', createdBy),
    {
      userId: createdBy,
      username: creatorUsername,
      role: 'admin',
      joinedAt: new Date().toISOString(),
    }
  );

  // Add to userGroups index for cheap HomeScreen queries
  await setDoc(
    doc(firestore, 'userGroups', createdBy, 'groups', groupId),
    { groupId, name: name.trim(), joinedAt: new Date().toISOString() }
  );

  // Initialize creator stats
  await setDoc(
    doc(firestore, 'groups', groupId, 'groupStats', createdBy),
    {
      userId: createdBy,
      username: creatorUsername,
      gamesPlayed: 0,
      wins: 0,
      totalPoints: 0,
      placements: {},
    }
  );

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
      console.log('No groups access for user (likely no groups yet)');
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

    // Check if already a member
    if (groupData.members?.includes(userId)) {
      return { success: true, groupId }; // Already in group — just navigate
    }

    // Add member
    await setDoc(
      doc(firestore, 'groups', groupId, 'groupMembers', userId),
      {
        userId,
        username,
        avatar: avatar || null,
        role: 'member',
        joinedAt: new Date().toISOString(),
      }
    );

    // Update group members array + count
    await updateDoc(doc(firestore, 'groups', groupId), {
      members: arrayUnion(userId),
      memberCount: increment(1),
    });

    // Add to userGroups index
    await setDoc(
      doc(firestore, 'userGroups', userId, 'groups', groupId),
      { groupId, name: groupData.name, joinedAt: new Date().toISOString() }
    );

    // Initialize member stats
    await setDoc(
      doc(firestore, 'groups', groupId, 'groupStats', userId),
      {
        userId,
        username,
        gamesPlayed: 0,
        wins: 0,
        totalPoints: 0,
        placements: {},
      }
    );

    return { success: true, groupId };
  } catch (error: any) {
    console.error('joinGroupViaInviteCode error:', error);
    return { success: false, error: error.message || 'Failed to join group' };
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

  await setDoc(
    doc(firestore, 'groups', groupId, 'groupMembers', userId),
    {
      userId,
      username,
      avatar: avatar || null,
      role: 'member',
      joinedAt: new Date().toISOString(),
    }
  );

  await updateDoc(doc(firestore, 'groups', groupId), {
    members: arrayUnion(userId),
    memberCount: increment(1),
  });

  await setDoc(
    doc(firestore, 'userGroups', userId, 'groups', groupId),
    { groupId, name: group.name, joinedAt: new Date().toISOString() }
  );

  await setDoc(
    doc(firestore, 'groups', groupId, 'groupStats', userId),
    {
      userId,
      username,
      gamesPlayed: 0,
      wins: 0,
      totalPoints: 0,
      placements: {},
    }
  );
};

export const leaveGroup = async (groupId: string, userId: string): Promise<void> => {
  await deleteDoc(doc(firestore, 'groups', groupId, 'groupMembers', userId));
  await updateDoc(doc(firestore, 'groups', groupId), {
    members: arrayRemove(userId),
    memberCount: increment(-1),
  });
  await deleteDoc(doc(firestore, 'userGroups', userId, 'groups', groupId));
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

export const updateGroupStats = async (
  groupId: string,
  results: { userId: string; username: string; place: number; points: number }[]
): Promise<void> => {
  const batch = results.map(async ({ userId, username, place, points }) => {
    const statsRef = doc(firestore, 'groups', groupId, 'groupStats', userId);

    // Ensure doc exists before incrementing
    const snap = await getDoc(statsRef);
    if (!snap.exists()) {
      await setDoc(statsRef, {
        userId,
        username,
        gamesPlayed: 0,
        wins: 0,
        totalPoints: 0,
        placements: {},
      });
    }

    const placementKey = `placements.${place}`;
    await updateDoc(statsRef, {
      gamesPlayed: increment(1),
      wins: place === 1 ? increment(1) : increment(0),
      totalPoints: increment(points),
      [placementKey]: increment(1),
    });
  });
  await Promise.all(batch);
};

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
  return `https://wittz.app/group/${inviteCode}`;
};

export const shareGroupInviteLink = async (
  groupName: string,
  inviteCode: string
): Promise<void> => {
  const url = buildGroupInviteLink(inviteCode);
  const message = `Join my Wittz group "${groupName}"! Use code ${inviteCode} in the app or tap: ${url}`;
  try {
    const { Share } = await import('react-native');
    await Share.share({ message });
  } catch (error: any) {
    console.error('Failed to share group invite:', error);
    const { Alert } = await import('react-native');
    Alert.alert(
      'Invite Code',
      `Share your group invite code:\n\n${inviteCode}\n\nOr share this link:\n${url}`,
      [{ text: 'OK' }]
    );
  }
};
