import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (user) {
      // Connect to WebSocket server
      const newSocket = io(process.env.REACT_APP_WS_URL || 'ws://localhost:3003', {
        auth: {
          token: localStorage.getItem('token'),
        },
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        console.log('Connected to WebSocket server');
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
        console.log('Disconnected from WebSocket server');
      });

      newSocket.on('notification', (data) => {
        addNotification(data);
      });

      newSocket.on('low-stock-alert', (data) => {
        console.log('Low stock alert received:', data);
        // Show a toast notification or alert
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Low Stock Alert', {
            body: data.message,
            icon: '/favicon.ico',
          });
        }
      });

      setSocket(newSocket);

      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      return () => {
        newSocket.close();
      };
    }
  }, [user, addNotification]);

  const value = {
    socket,
    isConnected,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};