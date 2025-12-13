import apiClient from './api'
import { Notification } from '../types'

export const notificationService = {
  getAll: async () => {
    const { data } = await apiClient.get<Notification[]>('/notifications')
    return data
  },

  markAsRead: async (id: string) => {
    await apiClient.patch(`/notifications/${id}/read`)
  },

  delete: async (id: string) => {
    await apiClient.delete(`/notifications/${id}`)
  },

  subscribeToUpdates: (callback: (notification: Notification) => void) => {
    // WebSocket implementation in main component
    return () => {}
  }
}