'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore, usePOSStore } from '@/stores'
import { PermissionGate } from '@/hooks/use-permissions'
import { createClient } from '@/lib/supabase/client'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
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
    QrCode,
    Receipt,
    User,
    Package,
    Loader2,
    X,
    Check,
    Calculator,
    Percent,
} from 'lucide-react'

interface Producto {
    id: string
    codigo: string | null
    nombre: string
    precio: number
    stock: number
    tipo: string
    iva: number
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

    // Local discount state (not in store)
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
    const supabase = createClient()


    // Load products
    useEffect(() => {
        const loadProducts = async () => {
            if (!user?.empresa_id) return

            try {
                const { data, error } = await supabase
                    .from('productos')
                    .select('id, codigo, nombre, precio, stock, tipo, iva')
                    .eq('empresa_id', user.empresa_id)
                    .eq('activo', true)
                    .order('nombre')

                if (error) throw error
                setProductos(data || [])
                setFilteredProducts(data || [])
            } catch (error: any) {
                toast.error('Error al cargar productos', { description: error.message })
            } finally {
                setIsLoading(false)
            }
        }

        loadProducts()
    }, [user?.empresa_id, supabase])

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

            const { data } = await supabase
                .from('clientes')
                .select('id, nombre, identificacion, email, telefono')
                .eq('empresa_id', user.empresa_id)
                .or(`nombre.ilike.%${clienteSearch}%,identificacion.ilike.%${clienteSearch}%`)
                .limit(10)

            setClientes(data || [])
        }

        const debounce = setTimeout(searchClientes, 300)
        return () => clearTimeout(debounce)
    }, [clienteSearch, user?.empresa_id, supabase])

    // Add product to cart
    const handleAddProduct = (producto: Producto) => {
        if (producto.stock <= 0 && producto.tipo === 'producto') {
            toast.error('Producto sin stock')
            return
        }

        const existingItem = items.find(i => i.producto.id === producto.id)
        if (existingItem && existingItem.cantidad >= producto.stock && producto.tipo === 'producto') {
            toast.error('Stock insuficiente')
            return
        }

        // Store expects Producto object, not individual fields
        addItem(producto as any)

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
            // Create venta
            const { data: venta, error: ventaError } = await supabase
                .from('ventas')
                .insert({
                    empresa_id: user?.empresa_id,
                    usuario_id: user?.id,
                    cliente_id: selectedCliente?.id || null,
                    subtotal: subtotal,
                    iva: totalIva,
                    total: total - discount,
                })
                .select()
                .single()

            if (ventaError) throw ventaError

            // Create detalle
            const detalles = items.map(item => ({
                venta_id: venta.id,
                producto_id: item.producto.id,
                descripcion: item.producto.nombre,
                cantidad: item.cantidad,
                precio_unitario: item.precioUnitario,
                subtotal: item.subtotal,
                iva: item.iva,
            }))

            const { error: detalleError } = await supabase
                .from('ventas_detalle')
                .insert(detalles)

            if (detalleError) throw detalleError

            toast.success('Venta procesada exitosamente', {
                description: `Factura: ${venta.numero_factura}`,
            })

            // Clear cart and close dialog
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
        <div className="h-[calc(100vh-120px)] flex gap-4">
            {/* Left Panel - Products */}
            <div className="flex-1 flex flex-col">
                {/* Search Bar */}
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                        <Input
                            ref={searchInputRef}
                            placeholder="Buscar producto por nombre o código..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 text-lg"
                            autoFocus
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Products Grid */}
                <ScrollArea className="flex-1">
                    {isLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {[...Array(8)].map((_, i) => (
                                <Skeleton key={i} className="h-32 bg-white/10" />
                            ))}
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Package className="h-16 w-16 text-slate-600 mb-4" />
                            <p className="text-slate-400">
                                {searchQuery ? 'No se encontraron productos' : 'No hay productos disponibles'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {filteredProducts.map((producto) => (
                                <motion.div
                                    key={producto.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Card
                                        className={`bg-white/5 border-white/10 cursor-pointer transition-all hover:bg-white/10 hover:border-blue-500/50 ${producto.stock <= 0 && producto.tipo === 'producto' ? 'opacity-50' : ''
                                            }`}
                                        onClick={() => handleAddProduct(producto)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs ${producto.tipo === 'servicio'
                                                        ? 'border-purple-500/50 text-purple-400'
                                                        : 'border-blue-500/50 text-blue-400'
                                                        }`}
                                                >
                                                    {producto.tipo === 'servicio' ? 'Servicio' : 'Producto'}
                                                </Badge>
                                                {producto.tipo === 'producto' && (
                                                    <span className={`text-xs ${producto.stock <= 5 ? 'text-amber-400' : 'text-slate-500'}`}>
                                                        Stock: {producto.stock}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-medium text-white text-sm line-clamp-2 mb-2">
                                                {producto.nombre}
                                            </h3>
                                            {producto.codigo && (
                                                <p className="text-xs text-slate-500 mb-2">{producto.codigo}</p>
                                            )}
                                            <p className="text-lg font-bold text-emerald-400">
                                                ${producto.precio.toFixed(2)}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Right Panel - Cart */}
            <Card className="w-[400px] bg-white/5 border-white/10 flex flex-col">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-white flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5" />
                            Carrito
                            {items.length > 0 && (
                                <Badge className="bg-blue-500">{items.length}</Badge>
                            )}
                        </CardTitle>
                        {items.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearCart}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* Cliente */}
                    <Button
                        variant="outline"
                        className="w-full justify-start gap-2 border-white/10 text-slate-300 hover:bg-white/5 mt-2"
                        onClick={() => setIsClienteDialogOpen(true)}
                    >
                        <User className="h-4 w-4" />
                        {selectedCliente ? selectedCliente.nombre : 'Consumidor Final'}
                    </Button>
                </CardHeader>

                <Separator className="bg-white/10" />

                {/* Cart Items */}
                <ScrollArea className="flex-1 p-4">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-8">
                            <ShoppingCart className="h-12 w-12 text-slate-600 mb-3" />
                            <p className="text-slate-400">Carrito vacío</p>
                            <p className="text-xs text-slate-500 mt-1">Busca y agrega productos</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <AnimatePresence>
                                {items.map((item) => (
                                    <motion.div
                                        key={item.producto.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="bg-white/5 rounded-lg p-3"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="text-sm text-white font-medium line-clamp-2 flex-1 pr-2">
                                                {item.producto.nombre}
                                            </p>
                                            <button
                                                onClick={() => removeItem(item.producto.id)}
                                                className="text-slate-500 hover:text-red-400"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-7 w-7 border-white/10"
                                                    onClick={() => updateQuantity(item.producto.id, item.cantidad - 1)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="text-white w-8 text-center">{item.cantidad}</span>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-7 w-7 border-white/10"
                                                    onClick={() => updateQuantity(item.producto.id, item.cantidad + 1)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <p className="text-emerald-400 font-medium">
                                                ${item.subtotal.toFixed(2)}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </ScrollArea>

                <Separator className="bg-white/10" />

                {/* Totals */}
                <div className="p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Subtotal</span>
                        <span className="text-white">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">IVA (15%)</span>
                        <span className="text-white">${totalIva.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-amber-400">Descuento</span>
                            <span className="text-amber-400">-${discount.toFixed(2)}</span>
                        </div>
                    )}
                    <Separator className="bg-white/10" />
                    <div className="flex justify-between text-lg font-bold">
                        <span className="text-white">Total</span>
                        <span className="text-emerald-400">${(total - discount).toFixed(2)}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-4 pt-0 space-y-2">
                    <PermissionGate permission="pos.discount">
                        <Button
                            variant="outline"
                            className="w-full gap-2 border-white/10 text-white hover:bg-white/5"
                            onClick={() => {
                                const desc = prompt('Ingresa el descuento ($):')
                                if (desc) setDiscount(parseFloat(desc) || 0)
                            }}
                        >
                            <Percent className="h-4 w-4" />
                            Aplicar Descuento
                        </Button>
                    </PermissionGate>

                    <Button
                        className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-lg gap-2"
                        onClick={() => setIsCheckoutOpen(true)}
                        disabled={items.length === 0}
                    >
                        <CreditCard className="h-5 w-5" />
                        Cobrar ${(total - discount).toFixed(2)}
                    </Button>
                </div>
            </Card>

            {/* Cliente Dialog */}
            <Dialog open={isClienteDialogOpen} onOpenChange={setIsClienteDialogOpen}>
                <DialogContent className="bg-slate-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Seleccionar Cliente</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Buscar por nombre o cédula..."
                                value={clienteSearch}
                                onChange={(e) => setClienteSearch(e.target.value)}
                                className="pl-10 bg-white/5 border-white/10 text-white"
                            />
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            <button
                                className="w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 text-left"
                                onClick={() => {
                                    setSelectedCliente(null)
                                    setIsClienteDialogOpen(false)
                                }}
                            >
                                <p className="font-medium">Consumidor Final</p>
                                <p className="text-sm text-slate-400">Sin datos de cliente</p>
                            </button>

                            {clientes.map((cliente) => (
                                <button
                                    key={cliente.id}
                                    className="w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 text-left"
                                    onClick={() => {
                                        setSelectedCliente(cliente)
                                        setIsClienteDialogOpen(false)
                                    }}
                                >
                                    <p className="font-medium">{cliente.nombre}</p>
                                    <p className="text-sm text-slate-400">{cliente.identificacion}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Checkout Dialog */}
            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Receipt className="h-5 w-5" />
                            Finalizar Venta
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Total */}
                        <div className="text-center p-4 bg-white/5 rounded-xl">
                            <p className="text-slate-400 text-sm mb-1">Total a Cobrar</p>
                            <p className="text-4xl font-bold text-emerald-400">
                                ${(total - discount).toFixed(2)}
                            </p>
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-2">
                            <Label className="text-slate-300">Método de Pago</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'efectivo', label: 'Efectivo', icon: Banknote },
                                    { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
                                    { id: 'transferencia', label: 'Transfer.', icon: Building2 },
                                ].map((method) => {
                                    const Icon = method.icon
                                    return (
                                        <button
                                            key={method.id}
                                            onClick={() => setPaymentMethod(method.id)}
                                            className={`p-3 rounded-xl border transition-all ${paymentMethod === method.id
                                                ? 'border-blue-500 bg-blue-500/20'
                                                : 'border-white/10 hover:bg-white/5'
                                                }`}
                                        >
                                            <Icon className="h-5 w-5 mx-auto mb-1" />
                                            <p className="text-xs">{method.label}</p>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Amount Received (for cash) */}
                        {paymentMethod === 'efectivo' && (
                            <div className="space-y-2">
                                <Label className="text-slate-300">Recibido</Label>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={amountReceived}
                                    onChange={(e) => setAmountReceived(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white text-xl h-12 text-center"
                                />
                                {change > 0 && (
                                    <div className="flex justify-between p-3 bg-emerald-500/10 rounded-lg">
                                        <span className="text-emerald-400">Cambio:</span>
                                        <span className="text-emerald-400 font-bold">${change.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsCheckoutOpen(false)}
                            className="border-white/10 text-white"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCheckout}
                            disabled={isProcessing || (paymentMethod === 'efectivo' && change < 0)}
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 gap-2"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4" />
                                    Confirmar Venta
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
