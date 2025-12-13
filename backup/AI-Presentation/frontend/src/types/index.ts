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