/**
 * Friends Service
 * Handle friend requests, friend list, invites, and presence
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { ref, set, onValue, onDisconnect, serverTimestamp } from 'firebase/database';
import { firestore, realtimeDb } from './firebase';
import { Friend, FriendRequest, FriendInvite } from '../types/social';

// ==================== FRIEND REQUESTS ====================

/**
 * Send a friend request
 */
export const sendFriendRequest = async (
  fromUserId: string,
  fromUsername: string,
  toUserId: string,
  toUsername: string,
  message?: string
): Promise<string> => {
  // Check if already friends
  const existingFriendship = await checkFriendship(fromUserId, toUserId);
  if (existingFriendship) {
    throw new Error('Already friends');
  }

  // Check if request already exists
  const existingRequest = await getPendingRequest(fromUserId, toUserId);
  if (existingRequest) {
    throw new Error('Friend request already sent');
  }

  // Check for reverse request (they sent you a request)
  const reverseRequest = await getPendingRequest(toUserId, fromUserId);
  if (reverseRequest) {
    // Auto-accept if they already sent you a request. The reverse request's
    // recipient is the CURRENT user (fromUserId) — passing toUserId here made
    // acceptFriendRequest's ownership check throw 'Unauthorized' every time
    // two people added each other.
    await acceptFriendRequest(reverseRequest.id, fromUserId);
    return reverseRequest.id;
  }

  const requestData: any = {
    fromUserId,
    fromUsername,
    toUserId,
    toUsername,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  if (message) {
    requestData.message = message;
  }

  const docRef = await addDoc(collection(firestore, 'friendRequests'), requestData);
  
  // Create notification
  try {
    await createNotification(toUserId, 'friend_request', {
      title: 'New Friend Request',
      message: `${fromUsername} sent you a friend request`,
      fromUserId,
      requestId: docRef.id,
    });
  } catch (error) {
    console.warn('Failed to create notification:', error);
  }

  return docRef.id;
};

/**
 * Accept a friend request
 */
export const acceptFriendRequest = async (
  requestId: string,
  userId: string
): Promise<void> => {
  const requestRef = doc(firestore, 'friendRequests', requestId);
  const requestDoc = await getDoc(requestRef);

  if (!requestDoc.exists()) {
    throw new Error('Friend request not found');
  }

  const request = requestDoc.data() as FriendRequest;

  if (request.toUserId !== userId) {
    throw new Error('Unauthorized');
  }

  if (request.status !== 'pending') {
    throw new Error('Request already processed');
  }

  // Update request status
  await updateDoc(requestRef, {
    status: 'accepted',
    respondedAt: new Date().toISOString(),
  });

  // Create friendship for both users
  await createFriendship(request.fromUserId, request.toUserId);
  await createFriendship(request.toUserId, request.fromUserId);

  // Notify sender. Best-effort: the friendship is already created, so a
  // failure here must not surface as a failed acceptance to the user.
  try {
    await createNotification(request.fromUserId, 'friend_accepted', {
      title: 'Friend Request Accepted',
      message: `${request.toUsername} accepted your friend request`,
      fromUserId: request.toUserId,
    });
  } catch (error) {
    console.warn('Failed to create friend_accepted notification:', error);
  }
};

/**
 * Reject a friend request
 */
export const rejectFriendRequest = async (
  requestId: string,
  userId: string
): Promise<void> => {
  const requestRef = doc(firestore, 'friendRequests', requestId);
  const requestDoc = await getDoc(requestRef);

  if (!requestDoc.exists()) {
    throw new Error('Friend request not found');
  }

  const request = requestDoc.data() as FriendRequest;

  if (request.toUserId !== userId) {
    throw new Error('Unauthorized');
  }

  await updateDoc(requestRef, {
    status: 'rejected',
    respondedAt: new Date().toISOString(),
  });
};

/**
 * Cancel a sent friend request
 */
export const cancelFriendRequest = async (
  requestId: string,
  userId: string
): Promise<void> => {
  const requestRef = doc(firestore, 'friendRequests', requestId);
  const requestDoc = await getDoc(requestRef);

  if (!requestDoc.exists()) {
    throw new Error('Friend request not found');
  }

  const request = requestDoc.data() as FriendRequest;

  if (request.fromUserId !== userId) {
    throw new Error('Unauthorized');
  }

  await updateDoc(requestRef, {
    status: 'cancelled',
  });
};

// ==================== FRIENDS LIST ====================

/**
 * Get user's friends list
 */
export const getFriends = async (userId: string): Promise<Friend[]> => {
  try {
    const q = query(
      collection(firestore, 'friendships'),
      where('userId', '==', userId),
      orderBy('addedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const friends: Friend[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      // Guard each friend individually: a single deleted account (missing
      // users doc) must not blank the whole friends list.
      try {
        const friendData = await getUserData(data.friendId);
        const presence = await getUserPresence(data.friendId);

        friends.push({
          userId: data.friendId,
          username: friendData.username,
          avatar: friendData.avatar,
          rating: friendData.rating,
          rank: friendData.rank,
          isOnline: presence.isOnline,
          lastActive: presence.lastActive,
          addedAt: data.addedAt,
          gamesPlayedTogether: data.gamesPlayedTogether || 0,
          favorited: data.favorited || false,
        });
      } catch (error) {
        console.warn(`Skipping friend ${data.friendId} (profile unavailable):`, error);
      }
    }

    return friends;
  } catch (error) {
    console.warn('Friends collection not initialized yet, returning empty array');
    return [];
  }
};

/**
 * Get pending friend requests (received)
 */
export const getPendingRequests = async (userId: string): Promise<FriendRequest[]> => {
  try {
    const q = query(
      collection(firestore, 'friendRequests'),
      where('toUserId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));
  } catch (error) {
    console.warn('Friend requests collection not initialized yet, returning empty array');
    return [];
  }
};

/**
 * Get sent friend requests
 */
export const getSentRequests = async (userId: string): Promise<FriendRequest[]> => {
  try {
    const q = query(
      collection(firestore, 'friendRequests'),
      where('fromUserId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));
  } catch (error) {
    console.warn('Friend requests collection not initialized yet, returning empty array');
    return [];
  }
};

/**
 * Remove a friend
 */
export const removeFriend = async (userId: string, friendId: string): Promise<void> => {
  const q1 = query(
    collection(firestore, 'friendships'),
    where('userId', '==', userId),
    where('friendId', '==', friendId)
  );
  const q2 = query(
    collection(firestore, 'friendships'),
    where('userId', '==', friendId),
    where('friendId', '==', userId)
  );

  const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);

  // Delete our own direction first — this is the delete the security rules
  // guarantee (resource.data.userId == auth.uid). If this fails, the whole
  // operation genuinely failed and the error should propagate.
  await Promise.all(snapshot1.docs.map(doc => deleteDoc(doc.ref)));

  // Delete the reverse direction too — the rules allow deleting a friendship
  // doc where friendId == auth.uid, so a failure here is real (e.g. network)
  // and must propagate: swallowing it leaves the removed friend with a stale
  // one-sided friendship where you still appear in their list.
  await Promise.all(snapshot2.docs.map(reverseDoc => deleteDoc(reverseDoc.ref)));
};

/**
 * Toggle friend as favorite
 */
export const toggleFavoriteFriend = async (
  userId: string,
  friendId: string
): Promise<boolean> => {
  const q = query(
    collection(firestore, 'friendships'),
    where('userId', '==', userId),
    where('friendId', '==', friendId)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    throw new Error('Friendship not found');
  }

  const friendshipDoc = snapshot.docs[0];
  const currentFavorited = friendshipDoc.data().favorited || false;
  const newFavorited = !currentFavorited;

  await updateDoc(friendshipDoc.ref, {
    favorited: newFavorited,
  });

  return newFavorited;
};

// ==================== FRIEND INVITES ====================

/**
 * Send a game invite to a friend
 */
export const sendGameInvite = async (
  fromUserId: string,
  fromUsername: string,
  toUserId: string,
  roomId: string,
  roomName: string
): Promise<string> => {
  const inviteData: Omit<FriendInvite, 'id'> = {
    fromUserId,
    fromUsername,
    toUserId,
    roomId,
    roomName,
    status: 'pending',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
  };

  const docRef = await addDoc(collection(firestore, 'gameInvites'), inviteData);

  // Create notification
  await createNotification(toUserId, 'game_invite', {
    title: 'Game Invite',
    message: `${fromUsername} invited you to join ${roomName}`,
    roomId,
    inviteId: docRef.id,
  });

  return docRef.id;
};

/**
 * Accept a game invite
 */
export const acceptGameInvite = async (
  inviteId: string,
  userId: string
): Promise<string> => {
  const inviteRef = doc(firestore, 'gameInvites', inviteId);
  const inviteDoc = await getDoc(inviteRef);

  if (!inviteDoc.exists()) {
    throw new Error('Invite not found');
  }

  const invite = inviteDoc.data() as FriendInvite;

  if (invite.toUserId !== userId) {
    throw new Error('Unauthorized');
  }

  if (invite.status !== 'pending') {
    throw new Error('Invite already processed');
  }

  // Check if expired
  if (new Date(invite.expiresAt) < new Date()) {
    await updateDoc(inviteRef, { status: 'expired' });
    throw new Error('Invite expired');
  }

  await updateDoc(inviteRef, {
    status: 'accepted',
  });

  return invite.roomId;
};

/**
 * Decline a game invite
 */
export const declineGameInvite = async (
  inviteId: string,
  userId: string
): Promise<void> => {
  const inviteRef = doc(firestore, 'gameInvites', inviteId);
  const inviteDoc = await getDoc(inviteRef);

  if (!inviteDoc.exists()) {
    throw new Error('Invite not found');
  }

  const invite = inviteDoc.data() as FriendInvite;

  if (invite.toUserId !== userId) {
    throw new Error('Unauthorized');
  }

  await updateDoc(inviteRef, {
    status: 'declined',
  });
};

/**
 * Get pending game invites
 */
export const getPendingInvites = async (userId: string): Promise<FriendInvite[]> => {
  const q = query(
    collection(firestore, 'gameInvites'),
    where('toUserId', '==', userId),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc'),
    limit(10)
  );

  const snapshot = await getDocs(q);
  const invites = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendInvite));

  // Filter out expired invites
  const now = new Date();
  return invites.filter(invite => new Date(invite.expiresAt) > now);
};

// ==================== PRESENCE & ONLINE STATUS ====================

/**
 * Set user online status
 */
export const setUserOnline = async (userId: string): Promise<void> => {
  const presenceRef = ref(realtimeDb, `presence/${userId}`);
  
  await set(presenceRef, {
    isOnline: true,
    lastActive: serverTimestamp(),
  });

  // Set up disconnect handler
  onDisconnect(presenceRef).set({
    isOnline: false,
    lastActive: serverTimestamp(),
  });
};

/**
 * Set user offline status
 */
export const setUserOffline = async (userId: string): Promise<void> => {
  const presenceRef = ref(realtimeDb, `presence/${userId}`);
  
  await set(presenceRef, {
    isOnline: false,
    lastActive: serverTimestamp(),
  });
};

/**
 * Subscribe to friend's online status
 */
export const subscribeFriendPresence = (
  friendId: string,
  callback: (isOnline: boolean, lastActive: string) => void
): (() => void) => {
  const presenceRef = ref(realtimeDb, `presence/${friendId}`);
  
  const unsubscribe = onValue(presenceRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback(data.isOnline, data.lastActive);
    }
  });

  return unsubscribe;
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Check if two users are friends
 */
const checkFriendship = async (userId1: string, userId2: string): Promise<boolean> => {
  const q = query(
    collection(firestore, 'friendships'),
    where('userId', '==', userId1),
    where('friendId', '==', userId2)
  );

  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

/**
 * Get pending request between two users
 */
const getPendingRequest = async (
  fromUserId: string,
  toUserId: string
): Promise<FriendRequest | null> => {
  const q = query(
    collection(firestore, 'friendRequests'),
    where('fromUserId', '==', fromUserId),
    where('toUserId', '==', toUserId),
    where('status', '==', 'pending')
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as FriendRequest;
};

/**
 * Create friendship document
 */
const createFriendship = async (userId: string, friendId: string): Promise<void> => {
  await addDoc(collection(firestore, 'friendships'), {
    userId,
    friendId,
    addedAt: new Date().toISOString(),
    gamesPlayedTogether: 0,
    favorited: false,
  });
};

/**
 * Get user data
 */
const getUserData = async (userId: string): Promise<any> => {
  const userDoc = await getDoc(doc(firestore, 'users', userId));
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }
  return userDoc.data();
};

/**
 * Get user presence
 */
const getUserPresence = async (userId: string): Promise<any> => {
  return new Promise((resolve) => {
    const presenceRef = ref(realtimeDb, `presence/${userId}`);
    onValue(presenceRef, (snapshot) => {
      const data = snapshot.val();
      resolve(data || { isOnline: false, lastActive: new Date().toISOString() });
    }, { onlyOnce: true });
  });
};

/**
 * Create notification
 */
const createNotification = async (
  userId: string,
  type: string,
  data: any
): Promise<void> => {
  // Spread data first so payload fields can never override the recipient
  // (userId) or the type — a data.userId key previously rerouted the
  // friend_accepted notification back to the accepter.
  await addDoc(collection(firestore, 'notifications'), {
    ...data,
    userId,
    type,
    read: false,
    createdAt: new Date().toISOString(),
  });
};

/**
 * Search users by username
 */
export const searchUsers = async (searchTerm: string, currentUserId: string): Promise<any[]> => {
  try {
    const term = searchTerm.trim();
    if (!term) return [];

    const usersRef = collection(firestore, 'users');

    // Server-side prefix search on the indexed `username` field so ANY user
    // can be found, not just those in an arbitrary first page. Firestore range
    // queries are case-sensitive and there is no lowercased mirror field, so
    // run the common casing variants of the term and merge the results.
    const lower = term.toLowerCase();
    const variants = Array.from(
      new Set([
        term,
        lower,
        term.toUpperCase(),
        lower.charAt(0).toUpperCase() + lower.slice(1),
      ])
    );

    const snapshots = await Promise.all(
      variants.map(variant =>
        getDocs(
          query(
            usersRef,
            where('username', '>=', variant),
            where('username', '<=', variant + ''),
            limit(20)
          )
        )
      )
    );

    const seen = new Map<string, any>();
    for (const snapshot of snapshots) {
      for (const docSnap of snapshot.docs) {
        if (!seen.has(docSnap.id)) {
          seen.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
        }
      }
    }

    return Array.from(seen.values())
      .filter(
        user =>
          user.id !== currentUserId &&
          user.username?.toLowerCase().startsWith(lower)
      )
      .sort((a, b) => (a.username || '').localeCompare(b.username || ''))
      .slice(0, 20);
  } catch (error) {
    console.error('Search error:', error);
    throw new Error('Failed to search users');
  }
};
