import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { useAuth } from './useAuth';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  fromUserId?: string;
  requestId?: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const notificationsRef = collection(firestore, 'notifications');
    const q = query(notificationsRef, where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification));

      // Sort by date, newest first
      notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const markAsRead = async (notificationId: string) => {
    try {
      const notifRef = doc(firestore, 'notifications', notificationId);
      await updateDoc(notifRef, { read: true });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifs.map(n => {
          const notifRef = doc(firestore, 'notifications', n.id);
          return updateDoc(notifRef, { read: true });
        })
      );
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  };
};
