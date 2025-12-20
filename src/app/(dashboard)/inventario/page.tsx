'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores'
import { PermissionGate } from '@/hooks/use-permissions'
import { createClient } from '@/lib/supabase/client'
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
    codigo: string | null
    nombre: string
    descripcion: string | null
    precio: number
    costo: number
    stock: number
    stock_minimo: number
    tipo: string
    categoria: string | null
    activo: boolean
}

export default function InventarioPage() {
    const { user } = useAuthStore()
    const [productos, setProductos] = useState<Producto[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterTipo, setFilterTipo] = useState<string>('all')
    const [filterStock, setFilterStock] = useState<string>('all')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const supabase = createClient()

    // Form state
    const [formData, setFormData] = useState({
        codigo: '',
        nombre: '',
        descripcion: '',
        precio: '',
        costo: '',
        stock: '',
        stock_minimo: '',
        tipo: 'producto',
        categoria: '',
    })

    useEffect(() => {
        loadProductos()
    }, [user?.empresa_id])

    const loadProductos = async () => {
        if (!user?.empresa_id) return

        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('productos')
                .select('*')
                .eq('empresa_id', user.empresa_id)
                .order('nombre')

            if (error) throw error
            setProductos(data || [])
        } catch (error: any) {
            toast.error('Error al cargar inventario', { description: error.message })
        } finally {
            setIsLoading(false)
        }
    }

    // Filter products
    const filteredProductos = productos.filter(p => {
        const matchesSearch =
            p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.codigo && p.codigo.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesTipo = filterTipo === 'all' || p.tipo === filterTipo
        const matchesStock =
            filterStock === 'all' ||
            (filterStock === 'bajo' && p.stock <= p.stock_minimo) ||
            (filterStock === 'sinStock' && p.stock === 0)

        return matchesSearch && matchesTipo && matchesStock
    })

    // Stats
    const stats = {
        total: productos.length,
        stockBajo: productos.filter(p => p.stock <= p.stock_minimo && p.stock > 0).length,
        sinStock: productos.filter(p => p.stock === 0).length,
        valorTotal: productos.reduce((acc, p) => acc + (p.costo * p.stock), 0),
    }

    const openCreateDialog = () => {
        setSelectedProducto(null)
        setFormData({
            codigo: '',
            nombre: '',
            descripcion: '',
            precio: '',
            costo: '',
            stock: '',
            stock_minimo: '5',
            tipo: 'producto',
            categoria: '',
        })
        setIsDialogOpen(true)
    }

    const openEditDialog = (producto: Producto) => {
        setSelectedProducto(producto)
        setFormData({
            codigo: producto.codigo || '',
            nombre: producto.nombre,
            descripcion: producto.descripcion || '',
            precio: producto.precio.toString(),
            costo: producto.costo.toString(),
            stock: producto.stock.toString(),
            stock_minimo: producto.stock_minimo.toString(),
            tipo: producto.tipo,
            categoria: producto.categoria || '',
        })
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formData.nombre || !formData.precio) {
            toast.error('Nombre y precio son requeridos')
            return
        }

        setIsSaving(true)
        try {
            const productoData = {
                empresa_id: user?.empresa_id,
                codigo: formData.codigo || null,
                nombre: formData.nombre,
                descripcion: formData.descripcion || null,
                precio: parseFloat(formData.precio),
                costo: parseFloat(formData.costo) || 0,
                stock: parseInt(formData.stock) || 0,
                stock_minimo: parseInt(formData.stock_minimo) || 5,
                tipo: formData.tipo,
                categoria: formData.categoria || null,
                iva: 15,
            }

            if (selectedProducto) {
                // Update
                const { error } = await supabase
                    .from('productos')
                    .update(productoData)
                    .eq('id', selectedProducto.id)

                if (error) throw error
                toast.success('Producto actualizado')
            } else {
                // Create
                const { error } = await supabase
                    .from('productos')
                    .insert(productoData)

                if (error) throw error
                toast.success('Producto creado')
            }

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
                        <Select value={filterTipo} onValueChange={setFilterTipo}>
                            <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
                                <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-white/10">
                                <SelectItem value="all" className="text-white">Todos</SelectItem>
                                <SelectItem value="producto" className="text-white">Productos</SelectItem>
                                <SelectItem value="servicio" className="text-white">Servicios</SelectItem>
                            </SelectContent>
                        </Select>
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
                                    <TableHead className="text-slate-400">Tipo</TableHead>
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
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        producto.tipo === 'servicio'
                                                            ? 'border-purple-500/50 text-purple-400'
                                                            : 'border-blue-500/50 text-blue-400'
                                                    }
                                                >
                                                    {producto.tipo === 'servicio' ? 'Servicio' : 'Producto'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-emerald-400 font-medium">${producto.precio.toFixed(2)}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-slate-400">${producto.costo.toFixed(2)}</span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {producto.tipo === 'servicio' ? (
                                                    <span className="text-slate-500">-</span>
                                                ) : (
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
                                                )}
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
                                <Label className="text-slate-300">Código</Label>
                                <Input
                                    value={formData.codigo}
                                    onChange={(e) => setFormData(f => ({ ...f, codigo: e.target.value }))}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="SKU-001"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Tipo</Label>
                                <Select
                                    value={formData.tipo}
                                    onValueChange={(v) => setFormData(f => ({ ...f, tipo: v }))}
                                >
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-white/10">
                                        <SelectItem value="producto" className="text-white">Producto</SelectItem>
                                        <SelectItem value="servicio" className="text-white">Servicio</SelectItem>
                                    </SelectContent>
                                </Select>
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
                                <Label className="text-slate-300">Precio *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.precio}
                                    onChange={(e) => setFormData(f => ({ ...f, precio: e.target.value }))}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Costo</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.costo}
                                    onChange={(e) => setFormData(f => ({ ...f, costo: e.target.value }))}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {formData.tipo === 'producto' && (
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
                        )}

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
