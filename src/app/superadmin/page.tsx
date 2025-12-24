'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
    Shield,
    Building2,
    Users,
    DollarSign,
    TrendingUp,
    Search,
    Plus,
    MoreHorizontal,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    LogOut,
    Loader2,
    AlertTriangle,
    Crown,
    ArrowLeft,
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuthStore } from '@/stores'
import Link from 'next/link'

interface Empresa {
    id: string
    nombre: string
    ruc: string | null
    email: string | null
    telefono: string | null
    plan: string
    suscripcion_activa: boolean
    fecha_vencimiento: string | null
    created_at: string
    _count?: {
        usuarios: number
        ordenes: number
        ventas: number
    }
}

interface Stats {
    totalEmpresas: number
    empresasActivas: number
    ingresosMensuales: number
    crecimiento: number
}

export default function SuperAdminPage() {
    const [empresas, setEmpresas] = useState<Empresa[]>([])
    const [stats, setStats] = useState<Stats>({
        totalEmpresas: 0,
        empresasActivas: 0,
        ingresosMensuales: 0,
        crecimiento: 0,
    })
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterPlan, setFilterPlan] = useState<string>('all')
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const { logout } = useAuthStore()

    const [formData, setFormData] = useState({
        nombre: '',
        ruc: '',
        email: '',
        telefono: '',
        plan: 'trial',
        suscripcion_activa: true,
        fecha_vencimiento: '',
    })

    const plans = [
        { value: 'trial', label: 'Trial', color: 'bg-slate-100 text-slate-700' },
        { value: 'basic', label: 'Básico', color: 'bg-blue-100 text-blue-700' },
        { value: 'professional', label: 'Profesional', color: 'bg-purple-100 text-purple-700' },
        { value: 'enterprise', label: 'Enterprise', color: 'bg-amber-100 text-amber-700' },
    ]

    const planPrices: Record<string, number> = {
        trial: 0,
        basic: 29,
        professional: 59,
        enterprise: 149,
    }

    const loadData = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/empresas')
            if (!response.ok) throw new Error('Error loading empresas')

            const empresasData = await response.json()
            setEmpresas(empresasData || [])

            const activas = empresasData?.filter((e: Empresa) => e.suscripcion_activa).length || 0
            const ingresos = empresasData?.reduce((acc: number, e: Empresa) => {
                if (e.suscripcion_activa && e.plan !== 'trial') {
                    return acc + (planPrices[e.plan] || 0)
                }
                return acc
            }, 0) || 0

            setStats({
                totalEmpresas: empresasData?.length || 0,
                empresasActivas: activas,
                ingresosMensuales: ingresos,
                crecimiento: 12.5,
            })
        } catch (error: any) {
            toast.error('Error al cargar datos', { description: error.message })
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handleCreateEmpresa = async () => {
        if (!formData.nombre) {
            toast.error('El nombre es requerido')
            return
        }

        setIsSaving(true)
        try {
            const response = await fetch('/api/empresas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: formData.nombre,
                    ruc: formData.ruc || null,
                    email: formData.email || null,
                    telefono: formData.telefono || null,
                    plan: formData.plan,
                    suscripcion_activa: formData.suscripcion_activa,
                    fecha_vencimiento: formData.fecha_vencimiento || null,
                })
            })

            if (!response.ok) throw new Error('Error al crear empresa')

            toast.success('Empresa creada exitosamente')
            setIsCreateDialogOpen(false)
            resetForm()
            loadData()
        } catch (error: any) {
            toast.error('Error al crear empresa', { description: error.message })
        } finally {
            setIsSaving(false)
        }
    }

    const handleUpdateEmpresa = async () => {
        if (!selectedEmpresa) return

        setIsSaving(true)
        try {
            const response = await fetch(`/api/empresas/${selectedEmpresa.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: formData.nombre,
                    ruc: formData.ruc || null,
                    email: formData.email || null,
                    telefono: formData.telefono || null,
                    plan: formData.plan,
                    suscripcion_activa: formData.suscripcion_activa,
                    fecha_vencimiento: formData.fecha_vencimiento || null,
                })
            })

            if (!response.ok) throw new Error('Error al actualizar')

            toast.success('Empresa actualizada')
            setIsEditDialogOpen(false)
            setSelectedEmpresa(null)
            resetForm()
            loadData()
        } catch (error: any) {
            toast.error('Error al actualizar', { description: error.message })
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteEmpresa = async (empresa: Empresa) => {
        if (!confirm(`¿Estás seguro de eliminar "${empresa.nombre}"? Esta acción no se puede deshacer.`)) {
            return
        }

        try {
            const response = await fetch(`/api/empresas/${empresa.id}`, {
                method: 'DELETE'
            })

            if (!response.ok) throw new Error('Error al eliminar')

            toast.success('Empresa eliminada')
            loadData()
        } catch (error: any) {
            toast.error('Error al eliminar', { description: error.message })
        }
    }

    const handleToggleStatus = async (empresa: Empresa) => {
        try {
            const response = await fetch(`/api/empresas/${empresa.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ suscripcion_activa: !empresa.suscripcion_activa })
            })

            if (!response.ok) throw new Error('Error al actualizar')

            toast.success(empresa.suscripcion_activa ? 'Suscripción desactivada' : 'Suscripción activada')
            loadData()
        } catch (error: any) {
            toast.error('Error', { description: error.message })
        }
    }

    const openEditDialog = (empresa: Empresa) => {
        setSelectedEmpresa(empresa)
        setFormData({
            nombre: empresa.nombre,
            ruc: empresa.ruc || '',
            email: empresa.email || '',
            telefono: empresa.telefono || '',
            plan: empresa.plan,
            suscripcion_activa: empresa.suscripcion_activa,
            fecha_vencimiento: empresa.fecha_vencimiento?.split('T')[0] || '',
        })
        setIsEditDialogOpen(true)
    }

    const resetForm = () => {
        setFormData({
            nombre: '',
            ruc: '',
            email: '',
            telefono: '',
            plan: 'trial',
            suscripcion_activa: true,
            fecha_vencimiento: '',
        })
    }

    const getStatusBadge = (empresa: Empresa) => {
        if (!empresa.suscripcion_activa) {
            return <Badge variant="destructive" className="gap-1 font-medium"><XCircle className="w-3 h-3" /> Inactiva</Badge>
        }

        if (empresa.fecha_vencimiento) {
            const daysLeft = differenceInDays(new Date(empresa.fecha_vencimiento), new Date())
            if (daysLeft < 0) {
                return <Badge variant="destructive" className="gap-1 font-medium"><AlertTriangle className="w-3 h-3" /> Vencida</Badge>
            }
            if (daysLeft <= 7) {
                return <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1 font-medium"><Clock className="w-3 h-3" /> {daysLeft} días</Badge>
            }
        }

        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1 font-medium"><CheckCircle className="w-3 h-3" /> Activa</Badge>
    }

    const getPlanBadge = (plan: string) => {
        const planInfo = plans.find(p => p.value === plan)
        return (
            <Badge variant="outline" className={`gap-1 font-medium ${planInfo?.color || ''}`}>
                {plan === 'enterprise' && <Crown className="w-3 h-3" />}
                {planInfo?.label || plan}
            </Badge>
        )
    }

    const filteredEmpresas = empresas.filter(empresa => {
        const matchesSearch =
            empresa.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (empresa.ruc && empresa.ruc.includes(searchQuery))

        const matchesPlan = filterPlan === 'all' || empresa.plan === filterPlan

        const matchesStatus =
            filterStatus === 'all' ||
            (filterStatus === 'active' && empresa.suscripcion_activa) ||
            (filterStatus === 'inactive' && !empresa.suscripcion_activa)

        return matchesSearch && matchesPlan && matchesStatus
    })

    const handleLogout = () => {
        logout()
        window.location.href = '/login'
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            {/* Header */}
            <header className="border-b border-slate-200 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-slate-800">Super Admin</h1>
                                <p className="text-xs text-slate-500">Control Center</p>
                            </div>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-600 hover:text-red-600 hover:bg-red-50 gap-2"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                    </Button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
                >
                    <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">Total Empresas</p>
                                    <p className="text-3xl font-bold text-slate-800 mt-1">{stats.totalEmpresas}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Building2 className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">Activas</p>
                                    <p className="text-3xl font-bold text-slate-800 mt-1">{stats.empresasActivas}</p>
                                </div>
                                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                    <Users className="w-6 h-6 text-emerald-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">Ingresos Mensuales</p>
                                    <p className="text-3xl font-bold text-slate-800 mt-1">${stats.ingresosMensuales}</p>
                                </div>
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">Crecimiento</p>
                                    <p className="text-3xl font-bold text-emerald-600 mt-1">+{stats.crecimiento}%</p>
                                </div>
                                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-amber-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Empresas Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-xl text-slate-800">Empresas</CardTitle>
                                    <CardDescription className="text-slate-500">
                                        Gestiona todas las empresas registradas
                                    </CardDescription>
                                </div>

                                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 gap-2">
                                            <Plus className="w-4 h-4" />
                                            Nueva Empresa
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-white border-slate-200">
                                        <DialogHeader>
                                            <DialogTitle className="text-slate-800">Crear Nueva Empresa</DialogTitle>
                                            <DialogDescription className="text-slate-500">
                                                Añade una nueva empresa al sistema
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-slate-700">Nombre *</Label>
                                                    <Input
                                                        value={formData.nombre}
                                                        onChange={(e) => setFormData(f => ({ ...f, nombre: e.target.value }))}
                                                        className="border-slate-200"
                                                        placeholder="Nombre de la empresa"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-slate-700">RUC</Label>
                                                    <Input
                                                        value={formData.ruc}
                                                        onChange={(e) => setFormData(f => ({ ...f, ruc: e.target.value }))}
                                                        className="border-slate-200"
                                                        placeholder="1234567890001"
                                                        maxLength={13}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-slate-700">Email</Label>
                                                    <Input
                                                        type="email"
                                                        value={formData.email}
                                                        onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                                                        className="border-slate-200"
                                                        placeholder="contacto@empresa.com"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-slate-700">Teléfono</Label>
                                                    <Input
                                                        value={formData.telefono}
                                                        onChange={(e) => setFormData(f => ({ ...f, telefono: e.target.value }))}
                                                        className="border-slate-200"
                                                        placeholder="0999999999"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-slate-700">Plan</Label>
                                                    <Select
                                                        value={formData.plan}
                                                        onValueChange={(v) => setFormData(f => ({ ...f, plan: v }))}
                                                    >
                                                        <SelectTrigger className="border-slate-200">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {plans.map(plan => (
                                                                <SelectItem key={plan.value} value={plan.value}>
                                                                    {plan.label} - ${planPrices[plan.value]}/mes
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-slate-700">Vencimiento</Label>
                                                    <Input
                                                        type="date"
                                                        value={formData.fecha_vencimiento}
                                                        onChange={(e) => setFormData(f => ({ ...f, fecha_vencimiento: e.target.value }))}
                                                        className="border-slate-200"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>
                                                Cancelar
                                            </Button>
                                            <Button
                                                onClick={handleCreateEmpresa}
                                                disabled={isSaving}
                                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear Empresa'}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-col md:flex-row gap-3 mt-6">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="Buscar por nombre o RUC..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 border-slate-200"
                                    />
                                </div>
                                <Select value={filterPlan} onValueChange={setFilterPlan}>
                                    <SelectTrigger className="w-[150px] border-slate-200">
                                        <SelectValue placeholder="Plan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los planes</SelectItem>
                                        {plans.map(plan => (
                                            <SelectItem key={plan.value} value={plan.value}>
                                                {plan.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="w-[150px] border-slate-200">
                                        <SelectValue placeholder="Estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="active">Activas</SelectItem>
                                        <SelectItem value="inactive">Inactivas</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={loadData}
                                    className="border-slate-200"
                                >
                                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                </div>
                            ) : (
                                <div className="rounded-lg border border-slate-200 overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50 hover:bg-slate-50">
                                                <TableHead className="text-slate-600 font-semibold">Empresa</TableHead>
                                                <TableHead className="text-slate-600 font-semibold">RUC</TableHead>
                                                <TableHead className="text-slate-600 font-semibold">Plan</TableHead>
                                                <TableHead className="text-slate-600 font-semibold">Estado</TableHead>
                                                <TableHead className="text-slate-600 font-semibold">Creada</TableHead>
                                                <TableHead className="text-slate-600 font-semibold text-right">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredEmpresas.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                                                        No se encontraron empresas
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredEmpresas.map((empresa) => (
                                                    <TableRow key={empresa.id} className="hover:bg-slate-50">
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                                                                    <Building2 className="w-5 h-5 text-white" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-slate-800">{empresa.nombre}</p>
                                                                    <p className="text-sm text-slate-500">{empresa.email || 'Sin email'}</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-slate-600 font-mono text-sm">{empresa.ruc || '-'}</TableCell>
                                                        <TableCell>{getPlanBadge(empresa.plan)}</TableCell>
                                                        <TableCell>{getStatusBadge(empresa)}</TableCell>
                                                        <TableCell className="text-slate-500 text-sm">
                                                            {format(new Date(empresa.created_at), 'dd MMM yyyy', { locale: es })}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
                                                                        <MoreHorizontal className="w-4 h-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="bg-white border-slate-200">
                                                                    <DropdownMenuLabel className="text-slate-500">Acciones</DropdownMenuLabel>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="gap-2 cursor-pointer"
                                                                        onClick={() => openEditDialog(empresa)}
                                                                    >
                                                                        <Edit className="w-4 h-4" /> Editar
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="gap-2 cursor-pointer"
                                                                        onClick={() => handleToggleStatus(empresa)}
                                                                    >
                                                                        {empresa.suscripcion_activa ? (
                                                                            <><XCircle className="w-4 h-4" /> Desactivar</>
                                                                        ) : (
                                                                            <><CheckCircle className="w-4 h-4" /> Activar</>
                                                                        )}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="gap-2 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                                                                        onClick={() => handleDeleteEmpresa(empresa)}
                                                                    >
                                                                        <Trash2 className="w-4 h-4" /> Eliminar
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Edit Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="bg-white border-slate-200">
                        <DialogHeader>
                            <DialogTitle className="text-slate-800">Editar Empresa</DialogTitle>
                            <DialogDescription className="text-slate-500">
                                Modifica los datos de la empresa
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-700">Nombre *</Label>
                                    <Input
                                        value={formData.nombre}
                                        onChange={(e) => setFormData(f => ({ ...f, nombre: e.target.value }))}
                                        className="border-slate-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-700">RUC</Label>
                                    <Input
                                        value={formData.ruc}
                                        onChange={(e) => setFormData(f => ({ ...f, ruc: e.target.value }))}
                                        className="border-slate-200"
                                        maxLength={13}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-700">Email</Label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                                        className="border-slate-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-700">Teléfono</Label>
                                    <Input
                                        value={formData.telefono}
                                        onChange={(e) => setFormData(f => ({ ...f, telefono: e.target.value }))}
                                        className="border-slate-200"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-700">Plan</Label>
                                    <Select
                                        value={formData.plan}
                                        onValueChange={(v) => setFormData(f => ({ ...f, plan: v }))}
                                    >
                                        <SelectTrigger className="border-slate-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {plans.map(plan => (
                                                <SelectItem key={plan.value} value={plan.value}>
                                                    {plan.label} - ${planPrices[plan.value]}/mes
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-700">Vencimiento</Label>
                                    <Input
                                        type="date"
                                        value={formData.fecha_vencimiento}
                                        onChange={(e) => setFormData(f => ({ ...f, fecha_vencimiento: e.target.value }))}
                                        className="border-slate-200"
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleUpdateEmpresa}
                                disabled={isSaving}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Cambios'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    )
}
