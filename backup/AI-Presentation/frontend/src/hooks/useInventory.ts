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