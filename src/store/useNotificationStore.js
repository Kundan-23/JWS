import { create } from 'zustand';
import { notificationAPI } from '../services/api';
import supabase from '../config/supabase';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  realtimeSubscription: null,

  fetchNotifications: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await notificationAPI.getAll();
      if (data.success) {
        set({
          notifications: data.data,
          unreadCount: data.data.filter((n) => !n.is_read).length,
        });
      }
    } catch (error) {
      set({ error: error.message || 'Failed to fetch notifications' });
    } finally {
      set({ loading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      const res = await notificationAPI.markAsRead(id);
      if (res.data.success) {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, is_read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      const res = await notificationAPI.markAllAsRead();
      if (res.data.success) {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
          unreadCount: 0,
        }));
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  },

  deleteNotification: async (id) => {
    try {
      const res = await notificationAPI.delete(id);
      if (res.data.success) {
        set((state) => {
          const notif = state.notifications.find(n => n.id === id);
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: (notif && !notif.is_read) ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          };
        });
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  },

  subscribeToRealtime: (userId, userType) => {
    // Unsubscribe from existing if any
    const existing = get().realtimeSubscription;
    if (existing) {
      supabase.removeChannel(existing);
    }

    if (!userId || !userType) return;

    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`, // Since Supabase filters support simple eq. 
          // Wait, multiple filters are not officially supported natively in one channel string.
          // The index covers user_id, user_type. Just filtering by user_id is enough because uuid is unique across tables anyway.
        },
        (payload) => {
          const newNotif = payload.new;
          // Ensure it matches userType just in case
          if (newNotif.user_type === userType) {
            set((state) => ({
              notifications: [newNotif, ...state.notifications],
              unreadCount: state.unreadCount + 1,
            }));
          }
        }
      )
      .subscribe();

    set({ realtimeSubscription: channel });
  },

  unsubscribeRealtime: () => {
    const existing = get().realtimeSubscription;
    if (existing) {
      supabase.removeChannel(existing);
      set({ realtimeSubscription: null });
    }
  },
}));
