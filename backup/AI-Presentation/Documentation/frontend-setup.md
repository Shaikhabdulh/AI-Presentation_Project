# Frontend Implementation - React + TypeScript + Tailwind CSS
# Done
## Step 1: Project Setup

```bash
# Create Vite project
npm create vite@latest inventory-frontend -- --template react-ts
cd inventory-frontend

# Install dependencies
npm install react-router-dom zustand axios socket.io-client
npm install -D tailwindcss postcss autoprefixer
npm install -D @types/node @types/react @types/react-dom typescript

# Setup Tailwind
npx tailwindcss init -p

# Install Shadcn/ui components
npm install @radix-ui/react-dialog @radix-ui/react-alert-dialog
npm install @radix-ui/react-dropdown-menu @radix-ui/react-label
npm install @radix-ui/react-slot clsx class-variance-authority
```

## Step 2: Tailwind Configuration

### `tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        danger: '#dc2626',
        success: '#10b981',
        warning: '#f59e0b',
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        }
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        spin: 'spin 1s linear infinite',
      }
    }
  },
  plugins: [],
}

export default config
```

### `postcss.config.js`
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  }
}
```

## Step 3: Type Definitions

### `src/types/index.ts`
```typescript
// User Types
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user' | 'vendor'
  createdAt: Date
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (name: string, email: string, password: string) => Promise<void>
}

// Inventory Types
export interface InventoryItem {
  id: string
  name: string
  quantity: number
  minThreshold: number
  unit: string
  category: string
  lastUpdated: Date
  isLowStock: boolean
}

export interface InventoryUpdate {
  id: string
  quantity: number
  reason: string
  timestamp: Date
  userId: string
}

// Vendor Types
export interface Vendor {
  id: string
  name: string
  email: string
  phone: string
  category: string
  address: string
  city: string
  rating: number
  isActive: boolean
}

export interface VendorContactRequest {
  id: string
  vendorId: string
  itemId: string
  quantity: number
  message: string
  status: 'pending' | 'responded' | 'fulfilled'
  createdAt: Date
}

// Notification Types
export interface Notification {
  id: string
  userId: string
  type: 'low_stock' | 'vendor_response' | 'order_update'
  message: string
  itemId?: string
  vendorId?: string
  read: boolean
  createdAt: Date
}

export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
```

## Step 4: Store Management (Zustand)

### `src/store/authStore.ts`
```typescript
import create from 'zustand'
import { User } from '../types'

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}') : null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  
  login: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)
    set({ user, token, isAuthenticated: true })
  },
  
  logout: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    set({ user: null, token: null, isAuthenticated: false })
  },
  
  setUser: (user) => set({ user })
}))
```

### `src/store/inventoryStore.ts`
```typescript
import create from 'zustand'
import { InventoryItem } from '../types'

interface InventoryStore {
  items: InventoryItem[]
  loading: boolean
  error: string | null
  setItems: (items: InventoryItem[]) => void
  addItem: (item: InventoryItem) => void
  updateItem: (id: string, item: Partial<InventoryItem>) => void
  removeItem: (id: string) => void
  getLowStockItems: () => InventoryItem[]
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  
  setItems: (items) => set({ items }),
  
  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  })),
  
  updateItem: (id, updates) => set((state) => ({
    items: state.items.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    )
  })),
  
  removeItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id)
  })),
  
  getLowStockItems: () => {
    const { items } = get()
    return items.filter((item) => item.quantity <= item.minThreshold)
  },
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error })
}))
```

### `src/store/notificationStore.ts`
```typescript
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
```

## Step 5: API Services

### `src/services/api.ts`
```typescript
import axios, { AxiosInstance, AxiosError } from 'axios'
import { useAuthStore } from '../store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Request interceptor to add token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  }
)

export default apiClient
```

### `src/services/authService.ts`
```typescript
import apiClient from './api'
import { User } from '../types'

interface LoginResponse {
  user: User
  token: string
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', {
      email,
      password
    })
    return data
  },

  register: async (name: string, email: string, password: string): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/register', {
      name,
      email,
      password
    })
    return data
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },

  verifyToken: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/auth/verify')
    return data
  }
}
```

### `src/services/inventoryService.ts`
```typescript
import apiClient from './api'
import { InventoryItem, PaginationParams } from '../types'

export const inventoryService = {
  getAll: async (params?: PaginationParams) => {
    const { data } = await apiClient.get<InventoryItem[]>('/inventory', { params })
    return data
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<InventoryItem>(`/inventory/${id}`)
    return data
  },

  create: async (item: Omit<InventoryItem, 'id' | 'lastUpdated' | 'isLowStock'>) => {
    const { data } = await apiClient.post<InventoryItem>('/inventory', item)
    return data
  },

  update: async (id: string, updates: Partial<InventoryItem>) => {
    const { data } = await apiClient.patch<InventoryItem>(`/inventory/${id}`, updates)
    return data
  },

  delete: async (id: string) => {
    await apiClient.delete(`/inventory/${id}`)
  },

  getLowStock: async () => {
    const { data } = await apiClient.get<InventoryItem[]>('/inventory/low-stock')
    return data
  }
}
```

### `src/services/vendorService.ts`
```typescript
import apiClient from './api'
import { Vendor, VendorContactRequest } from '../types'

export const vendorService = {
  register: async (vendor: Omit<Vendor, 'id' | 'rating' | 'isActive'>) => {
    const { data } = await apiClient.post<Vendor>('/vendors/register', vendor)
    return data
  },

  getAll: async () => {
    const { data } = await apiClient.get<Vendor[]>('/vendors')
    return data
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<Vendor>(`/vendors/${id}`)
    return data
  },

  getByCategory: async (category: string) => {
    const { data } = await apiClient.get<Vendor[]>(`/vendors/category/${category}`)
    return data
  },

  contactVendor: async (vendorId: string, request: Omit<VendorContactRequest, 'id' | 'createdAt' | 'status'>) => {
    const { data } = await apiClient.post<VendorContactRequest>(`/vendors/${vendorId}/contact`, request)
    return data
  },

  getContactRequests: async () => {
    const { data } = await apiClient.get<VendorContactRequest[]>('/vendors/requests')
    return data
  }
}
```

### `src/services/notificationService.ts`
```typescript
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
```

## Step 6: Custom Hooks

### `src/hooks/useAuth.ts`
```typescript
import { useAuthStore } from '../store/authStore'
import { authService } from '../services/authService'

export const useAuth = () => {
  const { user, isAuthenticated, login: setLogin, logout: setLogout } = useAuthStore()

  const login = async (email: string, password: string) => {
    try {
      const { user, token } = await authService.login(email, password)
      setLogin(user, token)
      return { success: true }
    } catch (error) {
      return { success: false, error }
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      const { user, token } = await authService.register(name, email, password)
      setLogin(user, token)
      return { success: true }
    } catch (error) {
      return { success: false, error }
    }
  }

  const logout = () => {
    setLogout()
  }

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout
  }
}
```

### `src/hooks/useInventory.ts`
```typescript
import { useEffect } from 'react'
import { useInventoryStore } from '../store/inventoryStore'
import { inventoryService } from '../services/inventoryService'

export const useInventory = () => {
  const { items, loading, error, setItems, setLoading, setError } = useInventoryStore()

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const items = await inventoryService.getAll()
      setItems(items)
    } catch (err) {
      setError('Failed to fetch inventory')
    } finally {
      setLoading(false)
    }
  }

  const updateItem = async (id: string, quantity: number) => {
    try {
      await inventoryService.update(id, { quantity })
      await fetchItems()
    } catch (err) {
      setError('Failed to update item')
    }
  }

  return {
    items,
    loading,
    error,
    fetchItems,
    updateItem
  }
}
```

### `src/hooks/useNotifications.ts`
```typescript
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
```

---

**Note**: These services and stores provide the foundation for all pages and components. They follow SOLID principles with clear separation of concerns and dependency injection patterns.

