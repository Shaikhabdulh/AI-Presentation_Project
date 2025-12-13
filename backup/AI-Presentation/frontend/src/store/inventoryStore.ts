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