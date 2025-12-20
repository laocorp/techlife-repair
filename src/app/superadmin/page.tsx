'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
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
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    LogOut,
    Settings,
    BarChart3,
    Loader2,
    AlertTriangle,
    Crown,
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'

interface Empresa {
    id: string
    nombre: string
    ruc: string
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

    const supabase = createClient()

    // Form state for create/edit
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
        { value: 'trial', label: 'Trial', color: 'bg-slate-500' },
        { value: 'basic', label: 'Básico', color: 'bg-blue-500' },
        { value: 'professional', label: 'Profesional', color: 'bg-purple-500' },
        { value: 'enterprise', label: 'Enterprise', color: 'bg-amber-500' },
    ]

    const planPrices: Record<string, number> = {
        trial: 0,
        basic: 29,
        professional: 59,
        enterprise: 149,
    }

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setIsLoading(true)
        try {
            // Load empresas
            const { data: empresasData, error } = await supabase
                .from('empresas')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            setEmpresas(empresasData || [])

            // Calculate stats
            const activas = empresasData?.filter(e => e.suscripcion_activa).length || 0
            const ingresos = empresasData?.reduce((acc, e) => {
                if (e.suscripcion_activa && e.plan !== 'trial') {
                    return acc + (planPrices[e.plan] || 0)
                }
                return acc
            }, 0) || 0

            setStats({
                totalEmpresas: empresasData?.length || 0,
                empresasActivas: activas,
                ingresosMensuales: ingresos,
                crecimiento: 12.5, // Placeholder
            })
        } catch (error: any) {
            toast.error('Error al cargar datos', { description: error.message })
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreateEmpresa = async () => {
        if (!formData.nombre || !formData.ruc) {
            toast.error('Nombre y RUC son requeridos')
            return
        }

        setIsSaving(true)
        try {
            const { error } = await supabase.from('empresas').insert({
                nombre: formData.nombre,
                ruc: formData.ruc,
                email: formData.email || null,
                telefono: formData.telefono || null,
                plan: formData.plan,
                suscripcion_activa: formData.suscripcion_activa,
                fecha_vencimiento: formData.fecha_vencimiento || null,
                slug: formData.ruc.toLowerCase(),
            })

            if (error) throw error

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
            const { error } = await supabase
                .from('empresas')
                .update({
                    nombre: formData.nombre,
                    ruc: formData.ruc,
                    email: formData.email || null,
                    telefono: formData.telefono || null,
                    plan: formData.plan,
                    suscripcion_activa: formData.suscripcion_activa,
                    fecha_vencimiento: formData.fecha_vencimiento || null,
                })
                .eq('id', selectedEmpresa.id)

            if (error) throw error

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
            const { error } = await supabase
                .from('empresas')
                .delete()
                .eq('id', empresa.id)

            if (error) throw error

            toast.success('Empresa eliminada')
            loadData()
        } catch (error: any) {
            toast.error('Error al eliminar', { description: error.message })
        }
    }

    const handleToggleStatus = async (empresa: Empresa) => {
        try {
            const { error } = await supabase
                .from('empresas')
                .update({ suscripcion_activa: !empresa.suscripcion_activa })
                .eq('id', empresa.id)

            if (error) throw error

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
            ruc: empresa.ruc,
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
            return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Inactiva</Badge>
        }

        if (empresa.fecha_vencimiento) {
            const daysLeft = differenceInDays(new Date(empresa.fecha_vencimiento), new Date())
            if (daysLeft < 0) {
                return <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" /> Vencida</Badge>
            }
            if (daysLeft <= 7) {
                return <Badge className="bg-amber-500 gap-1"><Clock className="w-3 h-3" /> {daysLeft} días</Badge>
            }
        }

        return <Badge className="bg-emerald-500 gap-1"><CheckCircle className="w-3 h-3" /> Activa</Badge>
    }

    const getPlanBadge = (plan: string) => {
        const planInfo = plans.find(p => p.value === plan)
        return (
            <Badge variant="outline" className="gap-1">
                {plan === 'enterprise' && <Crown className="w-3 h-3 text-amber-500" />}
                {planInfo?.label || plan}
            </Badge>
        )
    }

    // Filter empresas
    const filteredEmpresas = empresas.filter(empresa => {
        const matchesSearch =
            empresa.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
            empresa.ruc.includes(searchQuery)

        const matchesPlan = filterPlan === 'all' || empresa.plan === filterPlan

        const matchesStatus =
            filterStatus === 'all' ||
            (filterStatus === 'active' && empresa.suscripcion_activa) ||
            (filterStatus === 'inactive' && !empresa.suscripcion_activa)

        return matchesSearch && matchesPlan && matchesStatus
    })

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Header */}
            <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">Super Admin</h1>
                            <p className="text-xs text-slate-400">RepairApp Control Center</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                            <Settings className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-red-400"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
                >
                    <Card className="bg-white/5 border-white/10 backdrop-blur">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-400">Total Empresas</p>
                                    <p className="text-3xl font-bold text-white mt-1">{stats.totalEmpresas}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                    <Building2 className="w-6 h-6 text-blue-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/5 border-white/10 backdrop-blur">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-400">Activas</p>
                                    <p className="text-3xl font-bold text-white mt-1">{stats.empresasActivas}</p>
                                </div>
                                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                                    <Users className="w-6 h-6 text-emerald-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/5 border-white/10 backdrop-blur">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-400">Ingresos Mensuales</p>
                                    <p className="text-3xl font-bold text-white mt-1">${stats.ingresosMensuales}</p>
                                </div>
                                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-purple-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/5 border-white/10 backdrop-blur">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-400">Crecimiento</p>
                                    <p className="text-3xl font-bold text-emerald-400 mt-1">+{stats.crecimiento}%</p>
                                </div>
                                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-amber-400" />
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
                    <Card className="bg-white/5 border-white/10 backdrop-blur">
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-xl text-white">Empresas</CardTitle>
                                    <CardDescription className="text-slate-400">
                                        Gestiona todas las empresas registradas en el sistema
                                    </CardDescription>
                                </div>

                                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 gap-2">
                                            <Plus className="w-4 h-4" />
                                            Nueva Empresa
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-slate-900 border-white/10 text-white">
                                        <DialogHeader>
                                            <DialogTitle>Crear Nueva Empresa</DialogTitle>
                                            <DialogDescription className="text-slate-400">
                                                Añade una nueva empresa al sistema
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-slate-300">Nombre *</Label>
                                                    <Input
                                                        value={formData.nombre}
                                                        onChange={(e) => setFormData(f => ({ ...f, nombre: e.target.value }))}
                                                        className="bg-white/5 border-white/10 text-white"
                                                        placeholder="Nombre de la empresa"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-slate-300">RUC *</Label>
                                                    <Input
                                                        value={formData.ruc}
                                                        onChange={(e) => setFormData(f => ({ ...f, ruc: e.target.value }))}
                                                        className="bg-white/5 border-white/10 text-white"
                                                        placeholder="1234567890001"
                                                        maxLength={13}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-slate-300">Email</Label>
                                                    <Input
                                                        type="email"
                                                        value={formData.email}
                                                        onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                                                        className="bg-white/5 border-white/10 text-white"
                                                        placeholder="contacto@empresa.com"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-slate-300">Teléfono</Label>
                                                    <Input
                                                        value={formData.telefono}
                                                        onChange={(e) => setFormData(f => ({ ...f, telefono: e.target.value }))}
                                                        className="bg-white/5 border-white/10 text-white"
                                                        placeholder="0999999999"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-slate-300">Plan</Label>
                                                    <Select
                                                        value={formData.plan}
                                                        onValueChange={(v) => setFormData(f => ({ ...f, plan: v }))}
                                                    >
                                                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-slate-800 border-white/10">
                                                            {plans.map(plan => (
                                                                <SelectItem key={plan.value} value={plan.value} className="text-white">
                                                                    {plan.label} - ${planPrices[plan.value]}/mes
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-slate-300">Vencimiento</Label>
                                                    <Input
                                                        type="date"
                                                        value={formData.fecha_vencimiento}
                                                        onChange={(e) => setFormData(f => ({ ...f, fecha_vencimiento: e.target.value }))}
                                                        className="bg-white/5 border-white/10 text-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)} className="text-slate-400">
                                                Cancelar
                                            </Button>
                                            <Button
                                                onClick={handleCreateEmpresa}
                                                disabled={isSaving}
                                                className="bg-gradient-to-r from-blue-500 to-purple-600"
                                            >
                                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear Empresa'}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-col md:flex-row gap-3 mt-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <Input
                                        placeholder="Buscar por nombre o RUC..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                                    />
                                </div>
                                <Select value={filterPlan} onValueChange={setFilterPlan}>
                                    <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
                                        <SelectValue placeholder="Plan" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-white/10">
                                        <SelectItem value="all" className="text-white">Todos los planes</SelectItem>
                                        {plans.map(plan => (
                                            <SelectItem key={plan.value} value={plan.value} className="text-white">
                                                {plan.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
                                        <SelectValue placeholder="Estado" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-white/10">
                                        <SelectItem value="all" className="text-white">Todos</SelectItem>
                                        <SelectItem value="active" className="text-white">Activas</SelectItem>
                                        <SelectItem value="inactive" className="text-white">Inactivas</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={loadData}
                                    className="border-white/10 text-slate-400 hover:text-white"
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
                                <div className="rounded-lg border border-white/10 overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-white/10 hover:bg-white/5">
                                                <TableHead className="text-slate-400">Empresa</TableHead>
                                                <TableHead className="text-slate-400">RUC</TableHead>
                                                <TableHead className="text-slate-400">Plan</TableHead>
                                                <TableHead className="text-slate-400">Estado</TableHead>
                                                <TableHead className="text-slate-400">Creada</TableHead>
                                                <TableHead className="text-slate-400 text-right">Acciones</TableHead>
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
                                                    <TableRow key={empresa.id} className="border-white/10 hover:bg-white/5">
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                                                    <Building2 className="w-5 h-5 text-white" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-white">{empresa.nombre}</p>
                                                                    <p className="text-sm text-slate-400">{empresa.email || 'Sin email'}</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-slate-300 font-mono">{empresa.ruc}</TableCell>
                                                        <TableCell>{getPlanBadge(empresa.plan)}</TableCell>
                                                        <TableCell>{getStatusBadge(empresa)}</TableCell>
                                                        <TableCell className="text-slate-400">
                                                            {format(new Date(empresa.created_at), 'dd MMM yyyy', { locale: es })}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                                                                        <MoreHorizontal className="w-4 h-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="bg-slate-800 border-white/10">
                                                                    <DropdownMenuLabel className="text-slate-400">Acciones</DropdownMenuLabel>
                                                                    <DropdownMenuSeparator className="bg-white/10" />
                                                                    <DropdownMenuItem
                                                                        className="text-white hover:bg-white/10 gap-2"
                                                                        onClick={() => openEditDialog(empresa)}
                                                                    >
                                                                        <Edit className="w-4 h-4" /> Editar
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="text-white hover:bg-white/10 gap-2"
                                                                        onClick={() => handleToggleStatus(empresa)}
                                                                    >
                                                                        {empresa.suscripcion_activa ? (
                                                                            <><XCircle className="w-4 h-4" /> Desactivar</>
                                                                        ) : (
                                                                            <><CheckCircle className="w-4 h-4" /> Activar</>
                                                                        )}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator className="bg-white/10" />
                                                                    <DropdownMenuItem
                                                                        className="text-red-400 hover:bg-red-500/10 gap-2"
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
                    <DialogContent className="bg-slate-900 border-white/10 text-white">
                        <DialogHeader>
                            <DialogTitle>Editar Empresa</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Modifica los datos de la empresa
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Nombre *</Label>
                                    <Input
                                        value={formData.nombre}
                                        onChange={(e) => setFormData(f => ({ ...f, nombre: e.target.value }))}
                                        className="bg-white/5 border-white/10 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">RUC *</Label>
                                    <Input
                                        value={formData.ruc}
                                        onChange={(e) => setFormData(f => ({ ...f, ruc: e.target.value }))}
                                        className="bg-white/5 border-white/10 text-white"
                                        maxLength={13}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Email</Label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                                        className="bg-white/5 border-white/10 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Teléfono</Label>
                                    <Input
                                        value={formData.telefono}
                                        onChange={(e) => setFormData(f => ({ ...f, telefono: e.target.value }))}
                                        className="bg-white/5 border-white/10 text-white"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Plan</Label>
                                    <Select
                                        value={formData.plan}
                                        onValueChange={(v) => setFormData(f => ({ ...f, plan: v }))}
                                    >
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-800 border-white/10">
                                            {plans.map(plan => (
                                                <SelectItem key={plan.value} value={plan.value} className="text-white">
                                                    {plan.label} - ${planPrices[plan.value]}/mes
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Vencimiento</Label>
                                    <Input
                                        type="date"
                                        value={formData.fecha_vencimiento}
                                        onChange={(e) => setFormData(f => ({ ...f, fecha_vencimiento: e.target.value }))}
                                        className="bg-white/5 border-white/10 text-white"
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="text-slate-400">
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleUpdateEmpresa}
                                disabled={isSaving}
                                className="bg-gradient-to-r from-blue-500 to-purple-600"
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
