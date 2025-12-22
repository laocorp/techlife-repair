// src/app/(dashboard)/contabilidad/page.tsx
// Basic accounting module - income, expenses, summary

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores'
import { PermissionGate } from '@/hooks/use-permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Plus,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    PieChart,
    Filter,
    Download,
    RefreshCw,
    Loader2,
} from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'

interface Movimiento {
    id: string
    tipo: 'ingreso' | 'egreso'
    categoria: string
    monto: number
    descripcion: string | null
    fecha: string
    created_at: string
}

const categoriasIngreso = [
    'Ventas',
    'Servicios de Reparación',
    'Otros Ingresos',
]

const categoriasEgreso = [
    'Compra de Repuestos',
    'Inventario',
    'Servicios (Luz, Agua, Internet)',
    'Sueldos',
    'Alquiler',
    'Publicidad',
    'Otros Gastos',
]

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.05 },
    },
}

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
}

export default function ContabilidadPage() {
    const { user } = useAuthStore()
    const [movimientos, setMovimientos] = useState<Movimiento[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [filterTipo, setFilterTipo] = useState<string>('all')
    const [mesActual, setMesActual] = useState(new Date())

    const [formData, setFormData] = useState({
        tipo: 'ingreso' as 'ingreso' | 'egreso',
        categoria: '',
        monto: '',
        descripcion: '',
        fecha: format(new Date(), 'yyyy-MM-dd'),
    })

    const loadMovimientos = useCallback(async () => {
        if (!user?.empresa_id) return

        setIsLoading(true)
        try {
            const mes = format(mesActual, 'yyyy-MM')
            const response = await fetch(`/api/contabilidad?empresa_id=${user.empresa_id}&mes=${mes}`)
            if (!response.ok) throw new Error('Error loading movements')

            const data = await response.json()
            setMovimientos(data || [])
        } catch (error: any) {
            console.error('Error loading movements:', error)
        } finally {
            setIsLoading(false)
        }
    }, [user?.empresa_id, mesActual])

    useEffect(() => {
        loadMovimientos()
    }, [loadMovimientos])

    const handleSubmit = async () => {
        if (!formData.categoria || !formData.monto) {
            toast.error('Completa los campos requeridos')
            return
        }

        setIsSaving(true)
        try {
            const response = await fetch('/api/contabilidad', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    empresa_id: user?.empresa_id,
                    tipo: formData.tipo,
                    categoria: formData.categoria,
                    monto: formData.monto,
                    descripcion: formData.descripcion || null,
                    fecha: formData.fecha,
                })
            })

            if (!response.ok) throw new Error('Error saving movement')

            toast.success('Movimiento registrado')
            setIsDialogOpen(false)
            setFormData({
                tipo: 'ingreso',
                categoria: '',
                monto: '',
                descripcion: '',
                fecha: format(new Date(), 'yyyy-MM-dd'),
            })
            loadMovimientos()
        } catch (error: any) {
            toast.error('Error al guardar', { description: error.message })
        } finally {
            setIsSaving(false)
        }
    }

    // Calculate totals
    const ingresos = movimientos.filter(m => m.tipo === 'ingreso')
    const egresos = movimientos.filter(m => m.tipo === 'egreso')
    const totalIngresos = ingresos.reduce((acc, m) => acc + m.monto, 0)
    const totalEgresos = egresos.reduce((acc, m) => acc + m.monto, 0)
    const balance = totalIngresos - totalEgresos

    const filteredMovimientos = filterTipo === 'all'
        ? movimientos
        : movimientos.filter(m => m.tipo === filterTipo)

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-[hsl(var(--text-primary))]">
                        Contabilidad
                    </h1>
                    <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">
                        {format(mesActual, "MMMM yyyy", { locale: es })}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMesActual(new Date(mesActual.setMonth(mesActual.getMonth() - 1)))}
                        className="border-[hsl(var(--border-subtle))]"
                    >
                        Mes Anterior
                    </Button>
                    <PermissionGate permission="admin">
                        <Button
                            size="sm"
                            onClick={() => setIsDialogOpen(true)}
                            className="gap-2 bg-[hsl(var(--brand-accent))] hover:bg-[hsl(var(--brand-accent))]/90"
                        >
                            <Plus className="h-4 w-4" />
                            Nuevo
                        </Button>
                    </PermissionGate>
                </div>
            </motion.div>

            {/* Summary Cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="stat-card border-emerald-500/20">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="stat-label">Ingresos</p>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-24 mt-1 bg-[hsl(var(--surface-highlight))]" />
                                ) : (
                                    <p className="stat-value mt-1 text-emerald-400">
                                        ${totalIngresos.toFixed(2)}
                                    </p>
                                )}
                            </div>
                            <div className="p-2 rounded-lg bg-emerald-500/10">
                                <TrendingUp className="h-4 w-4 text-emerald-400" />
                            </div>
                        </div>
                        <p className="text-xs text-[hsl(var(--text-muted))] mt-2">
                            {ingresos.length} movimientos
                        </p>
                    </CardContent>
                </Card>

                <Card className="stat-card border-red-500/20">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="stat-label">Egresos</p>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-24 mt-1 bg-[hsl(var(--surface-highlight))]" />
                                ) : (
                                    <p className="stat-value mt-1 text-red-400">
                                        ${totalEgresos.toFixed(2)}
                                    </p>
                                )}
                            </div>
                            <div className="p-2 rounded-lg bg-red-500/10">
                                <TrendingDown className="h-4 w-4 text-red-400" />
                            </div>
                        </div>
                        <p className="text-xs text-[hsl(var(--text-muted))] mt-2">
                            {egresos.length} movimientos
                        </p>
                    </CardContent>
                </Card>

                <Card className={`stat-card ${balance >= 0 ? 'border-blue-500/20' : 'border-amber-500/20'}`}>
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="stat-label">Balance</p>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-24 mt-1 bg-[hsl(var(--surface-highlight))]" />
                                ) : (
                                    <p className={`stat-value mt-1 ${balance >= 0 ? 'text-blue-400' : 'text-amber-400'}`}>
                                        ${balance.toFixed(2)}
                                    </p>
                                )}
                            </div>
                            <div className={`p-2 rounded-lg ${balance >= 0 ? 'bg-blue-500/10' : 'bg-amber-500/10'}`}>
                                <Wallet className={`h-4 w-4 ${balance >= 0 ? 'text-blue-400' : 'text-amber-400'}`} />
                            </div>
                        </div>
                        <p className="text-xs text-[hsl(var(--text-muted))] mt-2">
                            Ganancia neta del mes
                        </p>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Filters & Table */}
            <motion.div variants={itemVariants}>
                <Card className="card-linear">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className="text-sm font-medium text-[hsl(var(--text-primary))]">
                            Movimientos
                        </CardTitle>
                        <div className="flex gap-2">
                            <Select value={filterTipo} onValueChange={setFilterTipo}>
                                <SelectTrigger className="w-[140px] h-8 text-xs bg-[hsl(var(--surface-base))] border-[hsl(var(--border-subtle))]">
                                    <SelectValue placeholder="Filtrar" />
                                </SelectTrigger>
                                <SelectContent className="bg-[hsl(var(--surface-elevated))] border-[hsl(var(--border-subtle))]">
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="ingreso">Ingresos</SelectItem>
                                    <SelectItem value="egreso">Egresos</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={loadMovimientos}
                                className="h-8 w-8 border-[hsl(var(--border-subtle))]"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-4 space-y-3">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-14 w-full bg-[hsl(var(--surface-highlight))]" />
                                ))}
                            </div>
                        ) : filteredMovimientos.length === 0 ? (
                            <div className="p-8 text-center">
                                <PieChart className="h-12 w-12 text-[hsl(var(--text-muted))] mx-auto mb-3 opacity-50" />
                                <p className="text-[hsl(var(--text-secondary))]">Sin movimientos</p>
                                <p className="text-sm text-[hsl(var(--text-muted))] mt-1">
                                    Registra ingresos y egresos para llevar tu contabilidad
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[hsl(var(--border-subtle))]">
                                {filteredMovimientos.map((mov) => (
                                    <div key={mov.id} className="p-4 flex items-center justify-between hover:bg-[hsl(var(--interactive-hover))] transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg ${mov.tipo === 'ingreso' ? 'bg-emerald-500/10' : 'bg-red-500/10'} flex items-center justify-center`}>
                                                {mov.tipo === 'ingreso' ? (
                                                    <ArrowUpRight className="h-5 w-5 text-emerald-400" />
                                                ) : (
                                                    <ArrowDownRight className="h-5 w-5 text-red-400" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-[hsl(var(--text-primary))]">
                                                    {mov.categoria}
                                                </p>
                                                <p className="text-xs text-[hsl(var(--text-muted))]">
                                                    {mov.descripcion || format(new Date(mov.fecha), "d MMM yyyy", { locale: es })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold ${mov.tipo === 'ingreso' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {mov.tipo === 'ingreso' ? '+' : '-'}${mov.monto.toFixed(2)}
                                            </p>
                                            <p className="text-xs text-[hsl(var(--text-muted))]">
                                                {format(new Date(mov.fecha), "d MMM", { locale: es })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* New Movement Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-[hsl(var(--surface-elevated))] border-[hsl(var(--border-subtle))]">
                    <DialogHeader>
                        <DialogTitle className="text-[hsl(var(--text-primary))]">
                            Nuevo Movimiento
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Type Toggle */}
                        <div className="grid grid-cols-2 gap-2 p-1 bg-[hsl(var(--surface-base))] rounded-lg">
                            <button
                                onClick={() => setFormData(f => ({ ...f, tipo: 'ingreso', categoria: '' }))}
                                className={`py-2 rounded-md text-sm font-medium transition-colors ${formData.tipo === 'ingreso'
                                    ? 'bg-emerald-500 text-white'
                                    : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))]'
                                    }`}
                            >
                                Ingreso
                            </button>
                            <button
                                onClick={() => setFormData(f => ({ ...f, tipo: 'egreso', categoria: '' }))}
                                className={`py-2 rounded-md text-sm font-medium transition-colors ${formData.tipo === 'egreso'
                                    ? 'bg-red-500 text-white'
                                    : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))]'
                                    }`}
                            >
                                Egreso
                            </button>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[hsl(var(--text-secondary))]">Categoría *</Label>
                            <Select
                                value={formData.categoria}
                                onValueChange={(v) => setFormData(f => ({ ...f, categoria: v }))}
                            >
                                <SelectTrigger className="input-linear">
                                    <SelectValue placeholder="Seleccionar categoría" />
                                </SelectTrigger>
                                <SelectContent className="bg-[hsl(var(--surface-elevated))] border-[hsl(var(--border-subtle))]">
                                    {(formData.tipo === 'ingreso' ? categoriasIngreso : categoriasEgreso).map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[hsl(var(--text-secondary))]">Monto ($) *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.monto}
                                onChange={(e) => setFormData(f => ({ ...f, monto: e.target.value }))}
                                className="input-linear"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[hsl(var(--text-secondary))]">Fecha</Label>
                            <Input
                                type="date"
                                value={formData.fecha}
                                onChange={(e) => setFormData(f => ({ ...f, fecha: e.target.value }))}
                                className="input-linear"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[hsl(var(--text-secondary))]">Descripción</Label>
                            <Textarea
                                placeholder="Detalles adicionales..."
                                value={formData.descripcion}
                                onChange={(e) => setFormData(f => ({ ...f, descripcion: e.target.value }))}
                                className="input-linear min-h-[80px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            className="border-[hsl(var(--border-subtle))]"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className={formData.tipo === 'ingreso' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
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
