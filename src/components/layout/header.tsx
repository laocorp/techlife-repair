'use client'

import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores'
import { useTenant, useNotificaciones } from '@/hooks'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Bell,
    Plus,
    ChevronDown,
    Settings,
    LogOut,
    User,
    CreditCard,
    Sparkles,
    Menu,
    CheckCheck,
    Package,
    AlertCircle,
    Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Map routes to readable titles
const routeTitles: Record<string, { title: string; description?: string }> = {
    '/': { title: 'Dashboard', description: 'Resumen de tu negocio' },
    '/pos': { title: 'Punto de Venta', description: 'Procesar ventas' },
    '/ordenes': { title: 'Órdenes de Servicio', description: 'Gestionar reparaciones' },
    '/inventario': { title: 'Inventario', description: 'Productos y stock' },
    '/clientes': { title: 'Clientes', description: 'Gestión de clientes' },
    '/catalogo': { title: 'Catálogo', description: 'Marcas y modelos' },
    '/caja': { title: 'Caja', description: 'Control de efectivo' },
    '/facturacion': { title: 'Facturación', description: 'Facturas electrónicas' },
    '/reportes': { title: 'Reportes', description: 'Análisis y estadísticas' },
    '/configuracion': { title: 'Configuración', description: 'Ajustes del sistema' },
}

interface HeaderProps {
    isSidebarCollapsed: boolean
    onMenuClick?: () => void
}

export function Header({ isSidebarCollapsed, onMenuClick }: HeaderProps) {
    const pathname = usePathname()
    const { user, logout } = useAuthStore()
    const { empresa } = useTenant()
    const router = useRouter()
    const { notificaciones, unreadCount, isLoading: loadingNotifs, marcarLeida, marcarTodasLeidas } = useNotificaciones()

    // Format time ago
    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Ahora'
        if (diffMins < 60) return `Hace ${diffMins} min`
        if (diffHours < 24) return `Hace ${diffHours}h`
        if (diffDays === 1) return 'Ayer'
        return `Hace ${diffDays} días`
    }

    // Get icon and color for notification type
    const getNotifIcon = (tipo: string) => {
        switch (tipo) {
            case 'orden':
                return { icon: Package, color: 'blue' }
            case 'pago':
                return { icon: CreditCard, color: 'green' }
            case 'sistema':
                return { icon: AlertCircle, color: 'amber' }
            case 'completada':
                return { icon: CheckCheck, color: 'purple' }
            default:
                return { icon: Bell, color: 'slate' }
        }
    }

    // Get current page info
    const currentRoute = Object.keys(routeTitles).find(route =>
        route === pathname || (route !== '/' && pathname.startsWith(route))
    ) || '/'
    const pageInfo = routeTitles[currentRoute]

    const handleLogout = () => {
        logout()
        router.push('/login')
    }

    return (
        <motion.header
            initial={false}
            animate={{
                marginLeft: isSidebarCollapsed ? 64 : 240,
                width: `calc(100% - ${isSidebarCollapsed ? 64 : 240}px)`
            }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="header-linear fixed top-0 right-0 z-40 md:ml-[var(--sidebar-width)] md:w-[calc(100%-var(--sidebar-width))] bg-white/60 backdrop-blur-xl border-b border-white/40 shadow-sm transition-all duration-200"
        >
            <div className="flex h-16 items-center justify-between px-6 gap-4">
                <div className="flex items-center gap-4">
                    {/* Mobile Menu Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden -ml-2 text-slate-600 hover:bg-white/50"
                        onClick={onMenuClick}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>

                    {/* Page Title - Linear style */}
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-none">
                            {pageInfo.title}
                        </h1>
                        {pageInfo.description && (
                            <p className="text-xs text-slate-500 font-medium hidden sm:block mt-1">
                                {pageInfo.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-4">
                    {/* Quick Actions - Premium Gradient Button */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                size="sm"
                                className="h-9 gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 border-0 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <div className="bg-white/20 p-1 rounded-full">
                                    <Plus className="h-3 w-3 text-white" />
                                </div>
                                <span className="font-semibold text-sm hidden sm:inline">Crear</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-56 bg-white/80 backdrop-blur-xl border-white/40 shadow-2xl p-1 rounded-xl"
                        >
                            <DropdownMenuLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 py-1.5">
                                Acciones Rápidas
                            </DropdownMenuLabel>
                            <DropdownMenuItem asChild className="rounded-lg focus:bg-blue-50 focus:text-blue-700 cursor-pointer mb-1">
                                <Link href="/ordenes/nueva" className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                        <Package className="h-4 w-4" />
                                    </div>
                                    <span className="font-medium">Nueva Orden</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="rounded-lg focus:bg-emerald-50 focus:text-emerald-700 cursor-pointer mb-1">
                                <Link href="/pos" className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                        <CreditCard className="h-4 w-4" />
                                    </div>
                                    <span className="font-medium">Nueva Venta</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="rounded-lg focus:bg-violet-50 focus:text-violet-700 cursor-pointer">
                                <Link href="/clientes?new=true" className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <span className="font-medium">Nuevo Cliente</span>
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Notifications Dropdown - Glass Pill */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 bg-white/50 hover:bg-white text-slate-500 hover:text-blue-600 border border-transparent hover:border-blue-100 shadow-sm rounded-xl transition-all relative group"
                            >
                                <Bell className="h-5 w-5 transition-transform group-hover:rotate-12" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-80 bg-white/90 backdrop-blur-2xl border-white/50 shadow-2xl rounded-2xl p-0 overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 border-b border-slate-100">
                                <span className="text-sm font-bold text-slate-900">Notificaciones</span>
                                {unreadCount > 0 && (
                                    <Badge className="bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg shadow-red-500/20">{unreadCount} nuevas</Badge>
                                )}
                            </div>
                            <div className="max-h-[350px] overflow-y-auto">
                                {loadingNotifs ? (
                                    <div className="p-8 text-center text-slate-400 text-sm">
                                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 opacity-50" />
                                        Cargando...
                                    </div>
                                ) : notificaciones.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-sm">
                                        <Bell className="h-8 w-8 mx-auto mb-3 opacity-20" />
                                        No hay notificaciones
                                    </div>
                                ) : (
                                    notificaciones.slice(0, 10).map((notif) => {
                                        const { icon: Icon, color } = getNotifIcon(notif.tipo)
                                        return (
                                            <div
                                                key={notif.id}
                                                className={`px-4 py-3 hover:bg-slate-50 border-b border-slate-50 cursor-pointer transition-colors ${!notif.leida ? 'bg-blue-50/40' : ''}`}
                                                onClick={() => {
                                                    if (!notif.leida) marcarLeida(notif.id)
                                                    if (notif.link) router.push(notif.link)
                                                }}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`w-9 h-9 rounded-full bg-${color}-500/10 flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                                        <Icon className={`w-4 h-4 text-${color}-600`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start gap-2">
                                                            <p className={`text-sm font-semibold truncate ${!notif.leida ? 'text-slate-900' : 'text-slate-700'}`}>{notif.titulo}</p>
                                                            {!notif.leida && (
                                                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.mensaje}</p>
                                                        <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{formatTimeAgo(notif.created_at)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                            <div className="p-2 border-t border-slate-100 bg-slate-50/30 flex gap-2">
                                {unreadCount > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex-1 h-8 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                                        onClick={() => marcarTodasLeidas()}
                                    >
                                        Marcar leídas
                                    </Button>
                                )}
                                <Link href="/notificaciones" className="flex-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                                    >
                                        Ver todas
                                    </Button>
                                </Link>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Separator - Subtle vertical line */}
                    <div className="h-6 w-px bg-slate-200/60" />

                    {/* User Menu - Glass Pill */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="h-10 pl-1.5 pr-3 bg-white/50 hover:bg-white border border-transparent hover:border-slate-100 rounded-full shadow-sm transition-all group gap-2"
                            >
                                <Avatar className="h-7 w-7 ring-2 ring-white shadow-sm">
                                    <AvatarFallback className="bg-gradient-to-br from-slate-800 to-slate-900 text-white text-[10px] font-bold">
                                        {user?.nombre?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-start hidden md:flex">
                                    <span className="text-sm font-semibold text-slate-700 leading-none group-hover:text-slate-900">
                                        {user?.nombre?.split(' ')[0] || 'Usuario'}
                                    </span>
                                    {user?.rol && (
                                        <span className="text-[10px] text-slate-400 font-medium capitalize mt-0.5">
                                            {user.rol}
                                        </span>
                                    )}
                                </div>
                                <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-slate-600 transition-transform group-data-[state=open]:rotate-180" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-60 bg-white/90 backdrop-blur-2xl border-white/50 shadow-2xl rounded-2xl p-1"
                        >
                            <DropdownMenuLabel className="font-normal px-4 py-3 bg-slate-50/50 rounded-xl mb-1">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-bold text-slate-900">
                                        {user?.nombre}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate font-medium">
                                        {user?.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>

                            {empresa && (
                                <div className="px-2 py-2">
                                    <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-blue-50/50 border border-blue-100/50">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="h-3.5 w-3.5 text-blue-500/70" />
                                            <span className="text-xs font-semibold text-blue-700/80">{empresa.nombre}</span>
                                        </div>
                                        <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-white shadow-sm text-blue-600 border-0">
                                            {empresa.plan || 'Free'}
                                        </Badge>
                                    </div>
                                </div>
                            )}

                            <div className="p-1 space-y-0.5">
                                <DropdownMenuItem className="rounded-lg focus:bg-slate-100 cursor-pointer text-slate-600 focus:text-slate-900">
                                    <User className="h-4 w-4 mr-2 opacity-70" />
                                    Mi Perfil
                                </DropdownMenuItem>
                                <DropdownMenuItem className="rounded-lg focus:bg-slate-100 cursor-pointer text-slate-600 focus:text-slate-900">
                                    <CreditCard className="h-4 w-4 mr-2 opacity-70" />
                                    Suscripción
                                </DropdownMenuItem>
                                <DropdownMenuItem className="rounded-lg focus:bg-slate-100 cursor-pointer text-slate-600 focus:text-slate-900">
                                    <Settings className="h-4 w-4 mr-2 opacity-70" />
                                    Configuración
                                </DropdownMenuItem>
                            </div>

                            <DropdownMenuSeparator className="bg-slate-100 mx-2" />

                            <div className="p-1">
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="rounded-lg text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer font-medium"
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Cerrar sesión
                                </DropdownMenuItem>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </motion.header>
    )
}
