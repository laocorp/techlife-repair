'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores'
import { PermissionGate } from '@/hooks/use-permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
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
    Plus,
    Package,
    Edit,
    AlertTriangle,
    RefreshCw,
    Loader2,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Filter,
} from 'lucide-react'

interface Producto {
    id: string
    codigo: string
    nombre: string
    descripcion: string | null
    precio_venta: number
    precio_compra: number
    stock: number
    stock_minimo: number
    categoria: string | null
    marca: string | null
    activo: boolean
}

export default function InventarioPage() {
    const { user } = useAuthStore()
    const [productos, setProductos] = useState<Producto[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStock, setFilterStock] = useState<string>('all')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        codigo: '',
        nombre: '',
        descripcion: '',
        precio_venta: '',
        precio_compra: '',
        stock: '',
        stock_minimo: '',
        categoria: '',
        marca: '',
    })

    const loadProductos = useCallback(async () => {
        if (!user?.empresa_id) return

        setIsLoading(true)
        try {
            const response = await fetch(`/api/productos?empresa_id=${user.empresa_id}`)

            if (!response.ok) throw new Error('Error al cargar inventario')

            const data = await response.json()
            setProductos(data || [])
        } catch (error: any) {
            toast.error('Error al cargar inventario', { description: error.message })
        } finally {
            setIsLoading(false)
        }
    }, [user?.empresa_id])

    useEffect(() => {
        loadProductos()
    }, [loadProductos])

    // Filter products
    const filteredProductos = productos.filter(p => {
        const matchesSearch =
            p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.codigo && p.codigo.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesStock =
            filterStock === 'all' ||
            (filterStock === 'bajo' && p.stock <= p.stock_minimo) ||
            (filterStock === 'sinStock' && p.stock === 0)

        return matchesSearch && matchesStock
    })

    // Stats
    const stats = {
        total: productos.length,
        stockBajo: productos.filter(p => p.stock <= p.stock_minimo && p.stock > 0).length,
        sinStock: productos.filter(p => p.stock === 0).length,
        valorTotal: productos.reduce((acc, p) => acc + (Number(p.precio_compra) * p.stock), 0),
    }

    const openCreateDialog = () => {
        setSelectedProducto(null)
        setFormData({
            codigo: '',
            nombre: '',
            descripcion: '',
            precio_venta: '',
            precio_compra: '',
            stock: '',
            stock_minimo: '5',
            categoria: '',
            marca: '',
        })
        setIsDialogOpen(true)
    }

    const openEditDialog = (producto: Producto) => {
        setSelectedProducto(producto)
        setFormData({
            codigo: producto.codigo || '',
            nombre: producto.nombre,
            descripcion: producto.descripcion || '',
            precio_venta: String(producto.precio_venta),
            precio_compra: String(producto.precio_compra),
            stock: String(producto.stock),
            stock_minimo: String(producto.stock_minimo),
            categoria: producto.categoria || '',
            marca: producto.marca || '',
        })
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formData.nombre || !formData.codigo || !formData.precio_venta || !formData.precio_compra) {
            toast.error('Código, nombre y precios son requeridos')
            return
        }

        setIsSaving(true)
        try {
            const productoData = {
                empresa_id: user?.empresa_id,
                codigo: formData.codigo,
                nombre: formData.nombre,
                descripcion: formData.descripcion || null,
                precio_venta: formData.precio_venta,
                precio_compra: formData.precio_compra,
                stock: formData.stock || '0',
                stock_minimo: formData.stock_minimo || '5',
                categoria: formData.categoria || null,
                marca: formData.marca || null,
            }

            let response
            if (selectedProducto) {
                response = await fetch(`/api/productos/${selectedProducto.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productoData)
                })
            } else {
                response = await fetch('/api/productos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productoData)
                })
            }

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Error al guardar')
            }

            toast.success(selectedProducto ? 'Producto actualizado' : 'Producto creado')
            setIsDialogOpen(false)
            loadProductos()
        } catch (error: any) {
            toast.error('Error al guardar', { description: error.message })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Inventario</h1>
                    <p className="text-slate-400 mt-1">Gestiona productos y servicios</p>
                </div>
                <PermissionGate permission="inventory.create">
                    <Button
                        onClick={openCreateDialog}
                        className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo Producto
                    </Button>
                </PermissionGate>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Total Productos</p>
                                <p className="text-2xl font-bold text-white">{stats.total}</p>
                            </div>
                            <Package className="h-8 w-8 text-blue-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Stock Bajo</p>
                                <p className="text-2xl font-bold text-amber-400">{stats.stockBajo}</p>
                            </div>
                            <TrendingDown className="h-8 w-8 text-amber-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Sin Stock</p>
                                <p className="text-2xl font-bold text-red-400">{stats.sinStock}</p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-red-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Valor Total</p>
                                <p className="text-2xl font-bold text-emerald-400">${stats.valorTotal.toFixed(2)}</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-emerald-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Buscar por nombre o código..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                            />
                        </div>
                        <Select value={filterStock} onValueChange={setFilterStock}>
                            <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
                                <SelectValue placeholder="Stock" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-white/10">
                                <SelectItem value="all" className="text-white">Todo el stock</SelectItem>
                                <SelectItem value="bajo" className="text-white">Stock bajo</SelectItem>
                                <SelectItem value="sinStock" className="text-white">Sin stock</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={loadProductos}
                            className="border-white/10 text-slate-400 hover:text-white"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Products Table */}
            <Card className="bg-white/5 border-white/10">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-6 space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-14 w-full bg-white/10" />
                            ))}
                        </div>
                    ) : filteredProductos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Package className="h-16 w-16 text-slate-600 mb-4" />
                            <p className="text-slate-400">No se encontraron productos</p>
                            <PermissionGate permission="inventory.create">
                                <Button
                                    variant="link"
                                    className="text-blue-400 mt-2"
                                    onClick={openCreateDialog}
                                >
                                    Crear primer producto
                                </Button>
                            </PermissionGate>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/10 hover:bg-transparent">
                                    <TableHead className="text-slate-400">Código</TableHead>
                                    <TableHead className="text-slate-400">Producto</TableHead>
                                    <TableHead className="text-slate-400 text-right">Precio</TableHead>
                                    <TableHead className="text-slate-400 text-right">Costo</TableHead>
                                    <TableHead className="text-slate-400 text-center">Stock</TableHead>
                                    <TableHead className="text-slate-400 text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProductos.map((producto) => {
                                    const stockBajo = producto.stock <= producto.stock_minimo
                                    return (
                                        <TableRow key={producto.id} className="border-white/10 hover:bg-white/5">
                                            <TableCell>
                                                <span className="font-mono text-slate-400">{producto.codigo || '-'}</span>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-white font-medium">{producto.nombre}</p>
                                                {producto.categoria && (
                                                    <p className="text-sm text-slate-500">{producto.categoria}</p>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-emerald-400 font-medium">${Number(producto.precio_venta).toFixed(2)}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-slate-400">${Number(producto.precio_compra).toFixed(2)}</span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge
                                                    className={
                                                        producto.stock === 0
                                                            ? 'bg-red-500/20 text-red-400 border-0'
                                                            : stockBajo
                                                                ? 'bg-amber-500/20 text-amber-400 border-0'
                                                                : 'bg-emerald-500/20 text-emerald-400 border-0'
                                                    }
                                                >
                                                    {producto.stock}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <PermissionGate permission="inventory.update">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="gap-2 text-slate-400 hover:text-white"
                                                        onClick={() => openEditDialog(producto)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                        Editar
                                                    </Button>
                                                </PermissionGate>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-slate-900 border-white/10 text-white max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedProducto ? 'Editar Producto' : 'Nuevo Producto'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Código *</Label>
                                <Input
                                    value={formData.codigo}
                                    onChange={(e) => setFormData(f => ({ ...f, codigo: e.target.value }))}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="SKU-001"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Marca</Label>
                                <Input
                                    value={formData.marca}
                                    onChange={(e) => setFormData(f => ({ ...f, marca: e.target.value }))}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="Marca"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-300">Nombre *</Label>
                            <Input
                                value={formData.nombre}
                                onChange={(e) => setFormData(f => ({ ...f, nombre: e.target.value }))}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="Nombre del producto"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-300">Descripción</Label>
                            <Input
                                value={formData.descripcion}
                                onChange={(e) => setFormData(f => ({ ...f, descripcion: e.target.value }))}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="Descripción opcional"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Precio Compra *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.precio_compra}
                                    onChange={(e) => setFormData(f => ({ ...f, precio_compra: e.target.value }))}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Precio Venta *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.precio_venta}
                                    onChange={(e) => setFormData(f => ({ ...f, precio_venta: e.target.value }))}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Stock</Label>
                                <Input
                                    type="number"
                                    value={formData.stock}
                                    onChange={(e) => setFormData(f => ({ ...f, stock: e.target.value }))}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="0"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Stock Mínimo</Label>
                                <Input
                                    type="number"
                                    value={formData.stock_minimo}
                                    onChange={(e) => setFormData(f => ({ ...f, stock_minimo: e.target.value }))}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="5"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-300">Categoría</Label>
                            <Input
                                value={formData.categoria}
                                onChange={(e) => setFormData(f => ({ ...f, categoria: e.target.value }))}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="Ej: Repuestos, Accesorios"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            className="border-white/10 text-white"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                'Guardar'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    )
}
