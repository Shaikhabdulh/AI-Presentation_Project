import { useEffect } from 'react'
import { useNotificationStore } from '../store/notificationStore'
import { notificationService } from '../services/notificationService'
import { io } from 'socket.io-client'

export const useNotifications = () => {
  const { notifications, addNotification, markAsRead, setNotifications } = useNotificationStore()

  useEffect(() => {
    fetchNotifications()
    setupWebSocket()
  }, [])

  const fetchNotifications = async () => {
    try {
      const notifs = await notificationService.getAll()
      setNotifications(notifs)
    } catch (error) {
      console.error('Failed to fetch notifications', error)
    }
  }

  const setupWebSocket = () => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001')
    
    socket.on('new_notification', (notification) => {
      addNotification(notification)
    })

    return () => socket.disconnect()
  }

  return {
    notifications,
    addNotification,
    markAsRead,
    fetchNotifications
  }
}