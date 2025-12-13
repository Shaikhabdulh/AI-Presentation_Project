import create from 'zustand'
import { Notification } from '../types'

interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Notification) => void
  markAsRead: (id: string) => void
  removeNotification: (id: string) => void
  setNotifications: (notifications: Notification[]) => void
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + (notification.read ? 0 : 1)
  })),
  
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    ),
    unreadCount: Math.max(0, state.unreadCount - 1)
  })),
  
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id)
  })),
  
  setNotifications: (notifications) => set({
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length
  })
}))