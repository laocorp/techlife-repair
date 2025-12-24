'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore, usePOSStore } from '@/stores'
import { PermissionGate } from '@/hooks/use-permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
    Search,
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    CreditCard,
    Banknote,
    Building2,
    Receipt,
    User,
    Package,
    Loader2,
    X,
    Check,
    Percent,
    Barcode,
    Image as ImageIcon
} from 'lucide-react'
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner'

interface Producto {
    id: string
    codigo: string | null
    nombre: string
    precio_venta: number
    stock: number
    imagenes?: { url: string; principal: boolean }[]
}

interface Cliente {
    id: string
    nombre: string
    identificacion: string
    email: string | null
    telefono: string | null
}

export default function POSPage() {
    const { user } = useAuthStore()
    const {
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        totalIva,
        total,
    } = usePOSStore()

    // Local discount
    const [discount, setDiscount] = useState(0)

    const [searchQuery, setSearchQuery] = useState('')
    const [productos, setProductos] = useState<Producto[]>([])
    const [filteredProducts, setFilteredProducts] = useState<Producto[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSearching, setIsSearching] = useState(false)
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
    const [isClienteDialogOpen, setIsClienteDialogOpen] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState<string>('efectivo')
    const [amountReceived, setAmountReceived] = useState<string>('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [clienteSearch, setClienteSearch] = useState('')

    const searchInputRef = useRef<HTMLInputElement>(null)

    // Scanner Hook
    const handleScan = async (code: string) => {
        if (!user?.empresa_id) return

        toast.info(`Buscando producto: ${code}`)
        try {
            const res = await fetch(`/api/productos/scan?empresa_id=${user.empresa_id}&barcode=${code}`)
            if (res.ok) {
                const producto = await res.json()
                handleAddProduct(producto)
            } else {
                toast.error(`Producto no encontrado: ${code}`)
            }
        } catch (error) {
            console.error(error)
        }
    }

    useBarcodeScanner({ onScan: handleScan })

    // Persistence
    useEffect(() => {
        const savedCart = localStorage.getItem('pos_cart')
        const savedClient = localStorage.getItem('pos_client')

        if (savedCart) {
            try {
                // We depend on usePOSStore to have a hydration method or we manually add items
                // Since usePOSStore is zuztand, we can't easily bulk set unless defined.
                // Assuming we just want to restore if empty? 
                // Better approach: If store is persistent (persist middleware), we don't need this.
                // Assuming store is NOT persistent by default:

                // For this quick implementation, let's just use manual logic if store is empty
                const parsed = JSON.parse(savedCart)
                if (items.length === 0 && parsed.length > 0) {
                    parsed.forEach((item: any) => addItem(item.producto))
                }
            } catch (e) {
                console.error('Error loading cart', e)
            }
        }

        if (savedClient) {
            try {
                setSelectedCliente(JSON.parse(savedClient))
            } catch (e) { }
        }
    }, [])

    useEffect(() => {
        localStorage.setItem('pos_cart', JSON.stringify(items))
    }, [items])

    useEffect(() => {
        if (selectedCliente) {
            localStorage.setItem('pos_client', JSON.stringify(selectedCliente))
        } else {
            localStorage.removeItem('pos_client')
        }
    }, [selectedCliente])



    // Load products
    const loadProducts = useCallback(async () => {
        if (!user?.empresa_id) return

        try {
            const response = await fetch(`/api/productos?empresa_id=${user.empresa_id}`)
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || errorData.details || 'Error al cargar productos')
            }

            const data = await response.json()
            setProductos(data || [])
            setFilteredProducts(data || [])
        } catch (error: any) {
            toast.error('Error al cargar productos', { description: error.message })
        } finally {
            setIsLoading(false)
        }
    }, [user?.empresa_id])

    useEffect(() => {
        loadProducts()
    }, [loadProducts])

    // Search products
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredProducts(productos)
            return
        }

        setIsSearching(true)
        const query = searchQuery.toLowerCase()
        const filtered = productos.filter(
            p =>
                p.nombre.toLowerCase().includes(query) ||
                (p.codigo && p.codigo.toLowerCase().includes(query))
        )
        setFilteredProducts(filtered)
        setIsSearching(false)
    }, [searchQuery, productos])

    // Search clientes
    useEffect(() => {
        const searchClientes = async () => {
            if (!user?.empresa_id || clienteSearch.length < 2) {
                setClientes([])
                return
            }

            try {
                const response = await fetch(`/api/clientes?empresa_id=${user.empresa_id}&search=${encodeURIComponent(clienteSearch)}`)
                if (response.ok) {
                    const data = await response.json()
                    setClientes(data || [])
                }
            } catch (error) {
                console.error('Error searching clientes:', error)
            }
        }

        const debounce = setTimeout(searchClientes, 300)
        return () => clearTimeout(debounce)
    }, [clienteSearch, user?.empresa_id])

    // Add product
    const handleAddProduct = (producto: Producto) => {
        if (producto.stock <= 0) {
            toast.error('Producto sin stock')
            return
        }

        const existingItem = items.find(i => i.producto.id === producto.id)
        if (existingItem && existingItem.cantidad >= producto.stock) {
            toast.error('Stock insuficiente')
            return
        }

        addItem({
            ...producto,
            precio: Number(producto.precio_venta),
            tipo: 'producto',
            iva: 15
        } as any)

        toast.success(`${producto.nombre} agregado`)
        searchInputRef.current?.focus()
        setSearchQuery('')
    }

    // Process sale
    const handleCheckout = async () => {
        if (items.length === 0) {
            toast.error('Agrega productos al carrito')
            return
        }

        setIsProcessing(true)

        try {
            const response = await fetch('/api/ventas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    empresa_id: user?.empresa_id,
                    usuario_id: user?.id,
                    cliente_id: selectedCliente?.id || null,
                    subtotal: subtotal,
                    iva: totalIva,
                    descuento: discount,
                    total: total - discount,
                    metodo_pago: paymentMethod,
                    items: items.map(item => ({
                        producto_id: item.producto.id,
                        descripcion: item.producto.nombre,
                        cantidad: item.cantidad,
                        precio_unitario: item.precioUnitario,
                        subtotal: item.subtotal,
                        iva: item.iva,
                    }))
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Error al procesar venta')
            }

            const venta = await response.json()

            toast.success('Venta procesada exitosamente', {
                description: `Factura: ${venta.numero || venta.id.slice(0, 8)}`,
            })

            clearCart()
            setSelectedCliente(null)
            setDiscount(0)
            setIsCheckoutOpen(false)
            setAmountReceived('')
        } catch (error: any) {
            toast.error('Error al procesar venta', { description: error.message })
        } finally {
            setIsProcessing(false)
        }
    }

    const change = parseFloat(amountReceived || '0') - (total - discount)

    return (
        <div className="h-[calc(100vh-120px)] flex gap-4 text-foreground">
            {/* Left Panel - Products */}
            <div className="flex-1 flex flex-col">
                {/* Search Bar */}
                <div className="mb-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                        <Input
                            ref={searchInputRef}
                            placeholder="Buscar producto..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 h-14 bg-white/60 backdrop-blur-md border border-white/40 shadow-sm rounded-2xl text-lg focus:ring-2 focus:ring-blue-500/20"
                            autoFocus
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100/50 text-muted-foreground hover:text-red-500 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Products Grid */}
                <ScrollArea className="flex-1 -mx-2 px-2">
                    {isLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {[...Array(8)].map((_, i) => (
                                <Skeleton key={i} className="h-40 rounded-2xl bg-white/40" />
                            ))}
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="h-24 w-24 bg-white/40 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm border border-white/20">
                                <Package className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground/80">
                                {searchQuery ? 'No se encontraron productos' : 'Inventario vacío'}
                            </h3>
                            <p className="text-muted-foreground mt-2">
                                Intenta buscar con otros términos
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
                            {filteredProducts.map((producto) => {
                                const mainImage = producto.imagenes?.find(i => i.principal)?.url || producto.imagenes?.[0]?.url

                                return (
                                    <motion.div
                                        key={producto.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div
                                            className={`
                                            group relative p-3 rounded-2xl border cursor-pointer transition-all duration-300
                                            backdrop-blur-md flex flex-col h-full justify-between overflow-hidden
                                            ${producto.stock <= 0
                                                    ? 'bg-slate-50/50 border-slate-200 opacity-60 grayscale'
                                                    : 'bg-white/40 border-white/40 hover:bg-white/60 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5'
                                                }
                                        `}
                                            onClick={() => handleAddProduct(producto)}
                                        >
                                            <div className="flex gap-3 mb-2">
                                                <div className="h-16 w-16 rounded-lg bg-white shrink-0 overflow-hidden border border-slate-100 flex items-center justify-center">
                                                    {mainImage ? (
                                                        <img src={mainImage} alt={producto.nombre} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Package className="h-8 w-8 text-slate-300" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <Badge variant="secondary" className="bg-white/50 text-[10px] h-5 px-1.5 border-white/20">
                                                            {producto.codigo || 'N/A'}
                                                        </Badge>
                                                    </div>
                                                    <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-tight">
                                                        {producto.nombre}
                                                    </h3>
                                                </div>
                                            </div>

                                            <div className="mt-auto flex justify-between items-end">
                                                <div>
                                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${producto.stock <= 5
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-emerald-100 text-emerald-700'
                                                        }`}>
                                                        Stock: {producto.stock}
                                                    </span>
                                                </div>
                                                <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                                                    ${Number(producto.precio_venta).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Right Panel - Cart */}
            <Card className="w-[420px] bg-white/60 backdrop-blur-xl border-white/20 shadow-2xl flex flex-col overflow-hidden rounded-3xl">
                <CardHeader className="pb-4 border-b border-black/5 bg-white/20">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <ShoppingCart className="h-5 w-5" />
                            </div>
                            Carrito
                            {items.length > 0 && (
                                <Badge className="bg-blue-600 text-white ml-2 rounded-full px-3">{items.length}</Badge>
                            )}
                        </CardTitle>
                        {items.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearCart}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full px-3"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Limpiar
                            </Button>
                        )}
                    </div>

                    {/* Cliente Selector */}
                    <div className="mt-4">
                        <Button
                            variant="outline"
                            className={`w-full justify-start gap-3 h-12 rounded-xl text-left font-normal border-black/10 bg-white/50 hover:bg-white/80 ${selectedCliente ? 'border-blue-200 bg-blue-50/50' : ''}`}
                            onClick={() => setIsClienteDialogOpen(true)}
                        >
                            <div className={`p-1.5 rounded-lg ${selectedCliente ? 'bg-blue-200 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
                                <User className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-foreground">
                                    {selectedCliente ? selectedCliente.nombre : 'Consumidor Final'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {selectedCliente ? selectedCliente.identificacion : 'Seleccionar cliente...'}
                                </p>
                            </div>
                            <Search className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </div>
                </CardHeader>

                {/* Cart Items */}
                <ScrollArea className="flex-1 p-4 bg-slate-50/30">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                            <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <ShoppingCart className="h-10 w-10 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-foreground">Tu carrito está vacío</h3>
                            <p className="text-muted-foreground mt-1 max-w-[200px]">
                                Selecciona productos del panel izquierdo para comenzar
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <AnimatePresence>
                                {items.map((item) => (
                                    <motion.div
                                        key={item.producto.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20, height: 0 }}
                                        className="bg-white rounded-xl p-3 shadow-sm border border-slate-100"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <p className="font-medium text-foreground line-clamp-2 leading-snug">
                                                {item.producto.nombre}
                                            </p>
                                            <button
                                                onClick={() => removeItem(item.producto.id)}
                                                className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-md hover:bg-white hover:shadow-sm"
                                                    onClick={() => updateQuantity(item.producto.id, item.cantidad - 1)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="text-foreground w-6 text-center font-medium">{item.cantidad}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-md hover:bg-white hover:shadow-sm"
                                                    onClick={() => updateQuantity(item.producto.id, item.cantidad + 1)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <p className="text-foreground font-bold font-mono">
                                                ${item.subtotal.toFixed(2)}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </ScrollArea>

                {/* Footer / Totals */}
                <div className="p-5 bg-white border-t border-black/5 shadow-inner">
                    <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="text-foreground font-medium">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">IVA (15%)</span>
                            <span className="text-foreground font-medium">${totalIva.toFixed(2)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-amber-600 font-medium">Descuento</span>
                                <span className="text-amber-600 font-medium">-${discount.toFixed(2)}</span>
                            </div>
                        )}
                        <Separator className="my-2" />
                        <div className="flex justify-between text-2xl font-bold items-baseline">
                            <span className="text-foreground">Total</span>
                            <span className="text-blue-600">${(total - discount).toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-5 gap-3">
                        <PermissionGate permission="pos.discount">
                            <Button
                                variant="outline"
                                className="col-span-1 h-14 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
                                onClick={() => {
                                    const desc = prompt('Ingresa el descuento ($):')
                                    if (desc) setDiscount(parseFloat(desc) || 0)
                                }}
                            >
                                <Percent className="h-5 w-5" />
                            </Button>
                        </PermissionGate>

                        <Button
                            className="col-span-4 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 rounded-xl text-lg font-bold gap-2"
                            onClick={() => setIsCheckoutOpen(true)}
                            disabled={items.length === 0}
                        >
                            <CreditCard className="h-5 w-5" />
                            Cobrar ${(total - discount).toFixed(2)}
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Cliente Dialog (Glass) */}
            <Dialog open={isClienteDialogOpen} onOpenChange={setIsClienteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Seleccionar Cliente</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Nombre o cédula..."
                                value={clienteSearch}
                                onChange={(e) => setClienteSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            <button
                                className="w-full p-4 rounded-xl border border-dashed hover:border-blue-300 hover:bg-blue-50 text-left transition-colors flex items-center gap-3"
                                onClick={() => {
                                    setSelectedCliente(null)
                                    setIsClienteDialogOpen(false)
                                }}
                            >
                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">Consumidor Final</p>
                                    <p className="text-sm text-muted-foreground">Sin datos fiscales</p>
                                </div>
                            </button>

                            {clientes.map((cliente) => (
                                <button
                                    key={cliente.id}
                                    className="w-full p-3 rounded-xl hover:bg-slate-50 text-left flex items-center gap-3"
                                    onClick={() => {
                                        setSelectedCliente(cliente)
                                        setIsClienteDialogOpen(false)
                                    }}
                                >
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                        {cliente.nombre.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">{cliente.nombre}</p>
                                        <p className="text-sm text-muted-foreground">{cliente.identificacion}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Checkout Dialog (Glass) */}
            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                <Receipt className="h-5 w-5" />
                            </div>
                            Confirmar Cobro
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-2">
                        {/* Total Display */}
                        <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-muted-foreground text-sm mb-1 uppercase tracking-wider font-semibold">Total a Pagar</p>
                            <p className="text-5xl font-extrabold text-slate-900 tracking-tight">
                                ${(total - discount).toFixed(2)}
                            </p>
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-3">
                            <Label>Método de Pago</Label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'efectivo', label: 'Efectivo', icon: Banknote },
                                    { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
                                    { id: 'transferencia', label: 'Transfer.', icon: Building2 },
                                ].map((method) => {
                                    const Icon = method.icon
                                    const isActive = paymentMethod === method.id
                                    return (
                                        <button
                                            key={method.id}
                                            onClick={() => setPaymentMethod(method.id)}
                                            className={`
                                                flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200
                                                ${isActive
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600 ring-offset-2'
                                                    : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-600'
                                                }
                                            `}
                                        >
                                            <Icon className={`h-6 w-6 mb-2 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                                            <span className="text-xs font-semibold">{method.label}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Amount Received (for cash) */}
                        {paymentMethod === 'efectivo' && (
                            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 animate-in slide-in-from-top-2">
                                <Label>Dinero Recibido</Label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={amountReceived}
                                        onChange={(e) => setAmountReceived(e.target.value)}
                                        className="pl-8 text-2xl h-14 bg-white font-bold"
                                        autoFocus
                                    />
                                </div>
                                {change > 0 && (
                                    <div className="flex justify-between items-center p-3 bg-emerald-100 text-emerald-800 rounded-lg">
                                        <span className="font-semibold">Cambio a entregar:</span>
                                        <span className="text-xl font-bold">${change.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setIsCheckoutOpen(false)}
                            className="h-12"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCheckout}
                            disabled={isProcessing || (paymentMethod === 'efectivo' && change < 0)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-6 shadow-md shadow-emerald-500/20"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Confirmar Pago
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
