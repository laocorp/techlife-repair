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
    HelpCircle,
    Moon,
    Sun,
    Sparkles,
    Menu,
    CheckCheck,
    Package,
    AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
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
    const supabase = createClient()
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

    const handleLogout = async () => {
        await supabase.auth.signOut()
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
            className="header-linear fixed top-0 right-0 z-40 md:ml-[var(--sidebar-width)] md:w-[calc(100%-var(--sidebar-width))]"
            style={{
                // Override framer motion styles on mobile via standard CSS class overrides if needed,
                // but since we render via JS logic in layout, we might just conditionalize the animate prop
                marginLeft: undefined, // Let parent/layout handle generic positioning via classes for mobile?
                // Actually, framer motion inline styles might conflict with media queries.
                // We will handle the "mobile reset" in the layout component logic.
            }}
        >
            <div className="flex items-center gap-4">
                {/* Mobile Menu Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden -ml-2 text-[hsl(var(--text-secondary))]"
                    onClick={onMenuClick}
                >
                    <Menu className="h-5 w-5" />
                </Button>

                {/* Page Title - Linear style */}
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-sm font-semibold text-[hsl(var(--text-primary))] tracking-tight">
                            {pageInfo.title}
                        </h1>
                        {pageInfo.description && (
                            <p className="text-xs text-[hsl(var(--text-muted))] hidden sm:block">
                                {pageInfo.description}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
                {/* Quick Actions */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            size="sm"
                            className="h-8 gap-1.5 bg-[hsl(var(--brand-accent))] hover:bg-[hsl(var(--brand-accent))]/90 text-white shadow-lg shadow-blue-500/20"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">Crear</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-48 bg-[hsl(var(--surface-elevated))] border-[hsl(var(--border-subtle))]"
                    >
                        <DropdownMenuItem asChild className="text-[hsl(var(--text-primary))] focus:bg-[hsl(var(--interactive-hover))]">
                            <Link href="/ordenes/nueva">Nueva Orden</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="text-[hsl(var(--text-primary))] focus:bg-[hsl(var(--interactive-hover))]">
                            <Link href="/pos">Nueva Venta</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="text-[hsl(var(--text-primary))] focus:bg-[hsl(var(--interactive-hover))]">
                            <Link href="/clientes?new=true">Nuevo Cliente</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[hsl(var(--border-subtle))]" />
                        <DropdownMenuItem asChild className="text-[hsl(var(--text-primary))] focus:bg-[hsl(var(--interactive-hover))]">
                            <Link href="/inventario?new=true">Nuevo Producto</Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Notifications Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--interactive-hover))] relative"
                        >
                            <Bell className="h-4 w-4" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-[hsl(var(--status-error))] rounded-full" />
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-80 bg-[hsl(var(--surface-elevated))] border-[hsl(var(--border-subtle))] p-0"
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border-subtle))]">
                            <span className="text-sm font-semibold text-[hsl(var(--text-primary))]">Notificaciones</span>
                            {unreadCount > 0 && (
                                <Badge className="bg-[hsl(var(--status-error))] text-white text-[10px] px-1.5">{unreadCount}</Badge>
                            )}
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {loadingNotifs ? (
                                <div className="px-4 py-8 text-center text-[hsl(var(--text-muted))] text-sm">
                                    Cargando...
                                </div>
                            ) : notificaciones.length === 0 ? (
                                <div className="px-4 py-8 text-center text-[hsl(var(--text-muted))] text-sm">
                                    No hay notificaciones
                                </div>
                            ) : (
                                notificaciones.slice(0, 10).map((notif) => {
                                    const { icon: Icon, color } = getNotifIcon(notif.tipo)
                                    return (
                                        <div
                                            key={notif.id}
                                            className={`px-4 py-3 hover:bg-[hsl(var(--interactive-hover))] border-b border-[hsl(var(--border-subtle))] cursor-pointer ${!notif.leida ? 'bg-[hsl(var(--surface-highlight))]' : ''}`}
                                            onClick={() => {
                                                if (!notif.leida) marcarLeida(notif.id)
                                                if (notif.link) router.push(notif.link)
                                            }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-8 h-8 rounded-full bg-${color}-500/10 flex items-center justify-center flex-shrink-0`}>
                                                    <Icon className={`w-4 h-4 text-${color}-500`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-[hsl(var(--text-primary))] truncate">{notif.titulo}</p>
                                                    <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5 truncate">{notif.mensaje}</p>
                                                    <p className="text-[10px] text-[hsl(var(--text-muted))] mt-1">{formatTimeAgo(notif.created_at)}</p>
                                                </div>
                                                {!notif.leida && (
                                                    <div className="w-2 h-2 bg-[hsl(var(--brand-accent))] rounded-full flex-shrink-0 mt-1" />
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                        <div className="px-4 py-2 border-t border-[hsl(var(--border-subtle))] flex gap-2">
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex-1 h-8 text-xs text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))]"
                                    onClick={() => marcarTodasLeidas()}
                                >
                                    Marcar todas como leídas
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                className="flex-1 h-8 text-xs text-[hsl(var(--brand-accent))] hover:text-[hsl(var(--brand-accent))] hover:bg-[hsl(var(--interactive-hover))]"
                            >
                                Ver todas
                            </Button>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Separator */}
                <div className="h-6 w-px bg-[hsl(var(--border-subtle))]" />

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="h-8 gap-2 px-2 text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--interactive-hover))]"
                        >
                            <Avatar className="h-6 w-6 bg-gradient-to-br from-violet-500 to-purple-600">
                                <AvatarFallback className="text-white text-[10px] font-semibold bg-transparent">
                                    {user?.nombre?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <span className="hidden md:inline text-sm font-medium">
                                {user?.nombre?.split(' ')[0] || 'Usuario'}
                            </span>
                            <ChevronDown className="h-3 w-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-56 bg-[hsl(var(--surface-elevated))] border-[hsl(var(--border-subtle))]"
                    >
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium text-[hsl(var(--text-primary))]">
                                    {user?.nombre}
                                </p>
                                <p className="text-xs text-[hsl(var(--text-muted))]">
                                    {user?.email}
                                </p>
                                <Badge variant="secondary" className="w-fit mt-1 text-[10px] bg-[hsl(var(--surface-highlight))] text-[hsl(var(--text-secondary))]">
                                    {user?.rol}
                                </Badge>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-[hsl(var(--border-subtle))]" />

                        {empresa && (
                            <>
                                <DropdownMenuLabel className="text-xs text-[hsl(var(--text-muted))] font-normal">
                                    Empresa
                                </DropdownMenuLabel>
                                <DropdownMenuItem className="text-[hsl(var(--text-primary))] focus:bg-[hsl(var(--interactive-hover))]">
                                    <Sparkles className="h-4 w-4 mr-2 text-amber-400" />
                                    <span>{empresa.nombre}</span>
                                    <Badge className="ml-auto text-[10px] bg-amber-500/10 text-amber-400 border-0">
                                        {empresa.plan || 'Trial'}
                                    </Badge>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-[hsl(var(--border-subtle))]" />
                            </>
                        )}

                        <DropdownMenuItem className="text-[hsl(var(--text-primary))] focus:bg-[hsl(var(--interactive-hover))]">
                            <User className="h-4 w-4 mr-2" />
                            Mi Perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-[hsl(var(--text-primary))] focus:bg-[hsl(var(--interactive-hover))]">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Suscripción
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-[hsl(var(--text-primary))] focus:bg-[hsl(var(--interactive-hover))]">
                            <Settings className="h-4 w-4 mr-2" />
                            Configuración
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-[hsl(var(--text-primary))] focus:bg-[hsl(var(--interactive-hover))]">
                            <HelpCircle className="h-4 w-4 mr-2" />
                            Ayuda
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="bg-[hsl(var(--border-subtle))]" />

                        <DropdownMenuItem
                            onClick={handleLogout}
                            className="text-[hsl(var(--status-error))] focus:bg-[hsl(var(--status-error-bg))]"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Cerrar sesión
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </motion.header>
    )
}
