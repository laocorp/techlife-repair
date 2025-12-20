// POS Store - Point of Sale state management
import { create } from 'zustand'
import type { Producto, Cliente } from '@/types'

interface CartItem {
    producto: Producto
    cantidad: number
    precioUnitario: number
    subtotal: number
    iva: number
}

interface POSState {
    // Cart
    items: CartItem[]
    cliente: Cliente | null

    // Totals
    subtotal: number
    totalIva: number
    total: number

    // UI State
    isProcessing: boolean

    // Actions
    addItem: (producto: Producto, cantidad?: number) => void
    removeItem: (productoId: string) => void
    updateQuantity: (productoId: string, cantidad: number) => void
    setCliente: (cliente: Cliente | null) => void
    clearCart: () => void
    setProcessing: (processing: boolean) => void

    // Calculations
    recalculateTotals: () => void
}

export const usePOSStore = create<POSState>((set, get) => ({
    items: [],
    cliente: null,
    subtotal: 0,
    totalIva: 0,
    total: 0,
    isProcessing: false,

    addItem: (producto, cantidad = 1) => {
        const { items, recalculateTotals } = get()
        const existingIndex = items.findIndex(item => item.producto.id === producto.id)

        if (existingIndex >= 0) {
            // Update existing item
            const newItems = [...items]
            newItems[existingIndex].cantidad += cantidad
            newItems[existingIndex].subtotal = newItems[existingIndex].cantidad * newItems[existingIndex].precioUnitario
            newItems[existingIndex].iva = newItems[existingIndex].subtotal * (producto.iva / 100)
            set({ items: newItems })
        } else {
            // Add new item
            const subtotal = cantidad * producto.precio
            const iva = subtotal * (producto.iva / 100)
            set({
                items: [
                    ...items,
                    {
                        producto,
                        cantidad,
                        precioUnitario: producto.precio,
                        subtotal,
                        iva,
                    },
                ],
            })
        }
        recalculateTotals()
    },

    removeItem: (productoId) => {
        const { items, recalculateTotals } = get()
        set({ items: items.filter(item => item.producto.id !== productoId) })
        recalculateTotals()
    },

    updateQuantity: (productoId, cantidad) => {
        const { items, recalculateTotals } = get()
        if (cantidad <= 0) {
            get().removeItem(productoId)
            return
        }

        const newItems = items.map(item => {
            if (item.producto.id === productoId) {
                const subtotal = cantidad * item.precioUnitario
                const iva = subtotal * (item.producto.iva / 100)
                return { ...item, cantidad, subtotal, iva }
            }
            return item
        })
        set({ items: newItems })
        recalculateTotals()
    },

    setCliente: (cliente) => set({ cliente }),

    clearCart: () => set({
        items: [],
        cliente: null,
        subtotal: 0,
        totalIva: 0,
        total: 0,
    }),

    setProcessing: (isProcessing) => set({ isProcessing }),

    recalculateTotals: () => {
        const { items } = get()
        const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0)
        const totalIva = items.reduce((acc, item) => acc + item.iva, 0)
        const total = subtotal + totalIva
        set({ subtotal, totalIva, total })
    },
}))
