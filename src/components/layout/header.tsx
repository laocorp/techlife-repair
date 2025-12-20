'use client'

import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores'
import { useTenant } from '@/hooks'
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
}

export function Header({ isSidebarCollapsed }: HeaderProps) {
    const pathname = usePathname()
    const { user, logout } = useAuthStore()
    const { empresa } = useTenant()
    const router = useRouter()
    const supabase = createClient()

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
            className="header-linear fixed top-0 right-0 z-40"
        >
            <div className="flex items-center gap-4">
                {/* Page Title - Linear style */}
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-sm font-semibold text-[hsl(var(--text-primary))] tracking-tight">
                            {pageInfo.title}
                        </h1>
                        {pageInfo.description && (
                            <p className="text-xs text-[hsl(var(--text-muted))]">
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

                {/* Notifications */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--interactive-hover))] relative"
                >
                    <Bell className="h-4 w-4" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[hsl(var(--status-error))] rounded-full" />
                </Button>

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
