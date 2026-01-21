'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import type { ItemCarritoLocal, Producto } from '@/lib/types/database.types'

interface CartContextType {
  items: ItemCarritoLocal[]
  itemCount: number
  subtotal: number
  addItem: (product: Producto, size: string, quantity?: number) => void
  removeItem: (productId: string, size: string) => void
  updateQuantity: (productId: string, size: string, quantity: number) => void
  clearCart: () => void
  isInCart: (productId: string, size: string) => boolean
  getItemQuantity: (productId: string, size: string) => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'softworks_cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ItemCarritoLocal[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Cargar carrito desde localStorage al iniciar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (stored) {
        const parsedItems = JSON.parse(stored)
        setItems(parsedItems)
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error)
    }
    setIsInitialized(true)
  }, [])

  // Guardar carrito en localStorage cuando cambia
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
      } catch (error) {
        console.error('Error saving cart to localStorage:', error)
      }
    }
  }, [items, isInitialized])

  const itemCount = useMemo(() => {
    return items.reduce((total, item) => total + item.cantidad, 0)
  }, [items])

  const subtotal = useMemo(() => {
    return items.reduce((total, item) => total + (item.precio * item.cantidad), 0)
  }, [items])

  const addItem = useCallback((product: Producto, size: string, quantity: number = 1) => {
    setItems(currentItems => {
      const existingIndex = currentItems.findIndex(
        item => item.producto_id === product.id && item.talle === size
      )

      if (existingIndex > -1) {
        // Actualizar cantidad si ya existe
        const updated = [...currentItems]
        updated[existingIndex] = {
          ...updated[existingIndex],
          cantidad: updated[existingIndex].cantidad + quantity
        }
        return updated
      }

      // Agregar nuevo item
      const newItem: ItemCarritoLocal = {
        producto_id: product.id,
        slug: product.slug,
        nombre: product.nombre,
        imagen: product.imagenes[0]?.src || null,
        precio: product.precio,
        talle: size,
        cantidad: quantity
      }

      return [...currentItems, newItem]
    })
  }, [])

  const removeItem = useCallback((productId: string, size: string) => {
    setItems(currentItems => 
      currentItems.filter(item => !(item.producto_id === productId && item.talle === size))
    )
  }, [])

  const updateQuantity = useCallback((productId: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, size)
      return
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.producto_id === productId && item.talle === size
          ? { ...item, cantidad: quantity }
          : item
      )
    )
  }, [removeItem])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const isInCart = useCallback((productId: string, size: string) => {
    return items.some(item => item.producto_id === productId && item.talle === size)
  }, [items])

  const getItemQuantity = useCallback((productId: string, size: string) => {
    const item = items.find(item => item.producto_id === productId && item.talle === size)
    return item?.cantidad || 0
  }, [items])

  const value: CartContextType = {
    items,
    itemCount,
    subtotal,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isInCart,
    getItemQuantity
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
