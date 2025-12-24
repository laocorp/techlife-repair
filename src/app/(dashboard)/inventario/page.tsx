'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores'
import { PermissionGate } from '@/hooks/use-permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
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
    TrendingDown,
    Filter,
} from 'lucide-react'
import { ImageGalleryUploader } from '@/components/ui/image-gallery-uploader'

interface Producto {
    id: string
    codigo: string
    codigo_barras: string | null
    nombre: string
    descripcion: string | null
    precio_venta: number
    precio_compra: number
    stock: number
    stock_minimo: number
    categoria: string | null
    marca: string | null
    activo: boolean
    imagenes?: { url: string }[]
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
        codigo_barras: '',
        nombre: '',
        descripcion: '',
        precio_venta: '',
        precio_compra: '',
        stock: '',
        stock_minimo: '',
        categoria: '',
        marca: '',
        imagenes: [] as string[]
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
            codigo_barras: '',
            nombre: '',
            descripcion: '',
            precio_venta: '',
            precio_compra: '',
            stock: '',
            stock_minimo: '5',
            categoria: '',
            marca: '',
            imagenes: []
        })
        setIsDialogOpen(true)
    }

    const openEditDialog = (producto: Producto) => {
        setSelectedProducto(producto)
        setFormData({
            codigo: producto.codigo || '',
            codigo_barras: producto.codigo_barras || '',
            nombre: producto.nombre,
            descripcion: producto.descripcion || '',
            precio_venta: String(producto.precio_venta),
            precio_compra: String(producto.precio_compra),
            stock: String(producto.stock),
            stock_minimo: String(producto.stock_minimo),
            categoria: producto.categoria || '',
            marca: producto.marca || '',
            imagenes: producto.imagenes ? producto.imagenes.map(i => i.url) : []
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
                codigo_barras: formData.codigo_barras || null,
                nombre: formData.nombre,
                descripcion: formData.descripcion || null,
                precio_venta: formData.precio_venta,
                precio_compra: formData.precio_compra,
                stock: formData.stock || '0',
                stock_minimo: formData.stock_minimo || '5',
                categoria: formData.categoria || null,
                marca: formData.marca || null,
                imagenes: formData.imagenes
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                        Inventario
                    </h1>
                    <p className="text-muted-foreground mt-1">Gestiona tus productos y repuestos</p>
                </div>
                <PermissionGate permission="inventory.create">
                    <Button
                        onClick={openCreateDialog}
                        className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 hover:scale-105 transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo Producto
                    </Button>
                </PermissionGate>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-muted-foreground text-sm font-medium">Total</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                        </div>
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Package className="h-6 w-6 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-muted-foreground text-sm font-medium">Stock Bajo</p>
                            <p className="text-2xl font-bold text-amber-500">{stats.stockBajo}</p>
                        </div>
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <TrendingDown className="h-6 w-6 text-amber-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-muted-foreground text-sm font-medium">Sin Stock</p>
                            <p className="text-2xl font-bold text-red-500">{stats.sinStock}</p>
                        </div>
                        <div className="p-2 bg-red-100 rounded-lg">
                            <AlertTriangle className="h-6 w-6 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-muted-foreground text-sm font-medium">Valor Total</p>
                            <p className="text-2xl font-bold text-emerald-600">${stats.valorTotal.toFixed(2)}</p>
                        </div>
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <DollarSign className="h-6 w-6 text-emerald-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-lg">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre o código..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-white border-gray-200 focus:bg-white focus:ring-blue-500/20 transition-all font-medium"
                            />
                        </div>
                        <Select value={filterStock} onValueChange={setFilterStock}>
                            <SelectTrigger className="w-[180px] bg-white border-gray-200">
                                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Stock" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todo el stock</SelectItem>
                                <SelectItem value="bajo">Stock bajo</SelectItem>
                                <SelectItem value="sinStock">Sin stock</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={loadProductos}
                            className="bg-white border-gray-200 hover:bg-gray-50 hover:text-blue-600"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Products Table */}
            <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-lg overflow-hidden">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-6 space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-14 w-full bg-gray-100" />
                            ))}
                        </div>
                    ) : filteredProductos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Package className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">No se encontraron productos</h3>
                            <p className="text-muted-foreground mt-1 mb-6 max-w-sm">
                                Ajusta los filtros o agrega nuevo inventario.
                            </p>
                            <PermissionGate permission="inventory.create">
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={openCreateDialog}
                                >
                                    <Plus className="h-4 w-4" />
                                    Crear primer producto
                                </Button>
                            </PermissionGate>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-gray-100 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="border-gray-100 hover:bg-transparent">
                                        <TableHead className="text-gray-600 font-semibold">Código</TableHead>
                                        <TableHead className="text-gray-600 font-semibold">Producto</TableHead>
                                        <TableHead className="text-gray-600 font-semibold text-right">Precio</TableHead>
                                        <TableHead className="text-gray-600 font-semibold text-right">Costo</TableHead>
                                        <TableHead className="text-gray-600 font-semibold text-center">Stock</TableHead>
                                        <TableHead className="text-gray-600 font-semibold text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProductos.map((producto) => {
                                        const stockBajo = producto.stock <= producto.stock_minimo
                                        return (
                                            <TableRow key={producto.id} className="border-gray-100 hover:bg-blue-50/30 transition-colors">
                                                <TableCell>
                                                    <Badge variant="outline" className="bg-gray-50 text-gray-600 font-mono">
                                                        {producto.codigo || '-'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="text-gray-900 font-medium">{producto.nombre}</p>
                                                    {producto.categoria && (
                                                        <p className="text-sm text-muted-foreground">{producto.categoria}</p>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="text-emerald-600 font-bold">${Number(producto.precio_venta).toFixed(2)}</span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="text-gray-500">${Number(producto.precio_compra).toFixed(2)}</span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge
                                                        className={
                                                            producto.stock === 0
                                                                ? 'bg-red-100 text-red-700 border-red-200'
                                                                : stockBajo
                                                                    ? 'bg-amber-100 text-amber-700 border-amber-200'
                                                                    : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                        }
                                                        variant="outline"
                                                    >
                                                        {producto.stock} Unid.
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <PermissionGate permission="inventory.update">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="hover:bg-blue-50 hover:text-blue-600 text-gray-500"
                                                            onClick={() => openEditDialog(producto)}
                                                        >
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Editar
                                                        </Button>
                                                    </PermissionGate>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-white max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-900">
                            {selectedProducto ? 'Editar Producto' : 'Nuevo Producto'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-5 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-700">Código SKU <span className="text-red-500">*</span></Label>
                                <Input
                                    value={formData.codigo}
                                    onChange={(e) => setFormData(f => ({ ...f, codigo: e.target.value }))}
                                    className="bg-white border-gray-200 font-mono"
                                    placeholder="SKU-001"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700">Código de Barras</Label>
                                <Input
                                    value={formData.codigo_barras}
                                    onChange={(e) => setFormData(f => ({ ...f, codigo_barras: e.target.value }))}
                                    className="bg-white border-gray-200 font-mono"
                                    placeholder="EAN/UPC"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-700">Imágenes del Producto</Label>
                            <ImageGalleryUploader
                                images={formData.imagenes}
                                onChange={(imgs) => setFormData(f => ({ ...f, imagenes: imgs }))}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-700">Marca</Label>
                                <Input
                                    value={formData.marca}
                                    onChange={(e) => setFormData(f => ({ ...f, marca: e.target.value }))}
                                    className="bg-white border-gray-200"
                                    placeholder="Marca"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700">Categoría</Label>
                                <Input
                                    value={formData.categoria}
                                    onChange={(e) => setFormData(f => ({ ...f, categoria: e.target.value }))}
                                    className="bg-white border-gray-200"
                                    placeholder="Categoría"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-700">Nombre del Producto <span className="text-red-500">*</span></Label>
                            <Input
                                value={formData.nombre}
                                onChange={(e) => setFormData(f => ({ ...f, nombre: e.target.value }))}
                                className="bg-white border-gray-200"
                                placeholder="Nombre completo"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-700">Descripción</Label>
                            <Input
                                value={formData.descripcion}
                                onChange={(e) => setFormData(f => ({ ...f, descripcion: e.target.value }))}
                                className="bg-white border-gray-200"
                                placeholder="Descripción opcional"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-700">Precio Compra ($)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.precio_compra}
                                    onChange={(e) => setFormData(f => ({ ...f, precio_compra: e.target.value }))}
                                    className="bg-white border-gray-200"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700">Precio Venta ($)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.precio_venta}
                                    onChange={(e) => setFormData(f => ({ ...f, precio_venta: e.target.value }))}
                                    className="bg-white border-gray-200"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-700">Stock Actual</Label>
                                <Input
                                    type="number"
                                    value={formData.stock}
                                    onChange={(e) => setFormData(f => ({ ...f, stock: e.target.value }))}
                                    className="bg-white border-gray-200"
                                    placeholder="0"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700">Stock Mínimo</Label>
                                <Input
                                    type="number"
                                    value={formData.stock_minimo}
                                    onChange={(e) => setFormData(f => ({ ...f, stock_minimo: e.target.value }))}
                                    className="bg-white border-gray-200"
                                    placeholder="5"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-700">Categoría</Label>
                            <Input
                                value={formData.categoria}
                                onChange={(e) => setFormData(f => ({ ...f, categoria: e.target.value }))}
                                className="bg-white border-gray-200"
                                placeholder="Ej: Repuestos, Accesorios"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            className="border-gray-200 bg-white"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 gap-2"
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
