'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores'
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Wallet,
    Wrench,
    FileText,
    Settings,
    Users,
    Building2,
    ChevronLeft,
    LogOut,
    Tag,
    BarChart3,
    HelpCircle,
    Search,
    Command,
    Columns3,
    Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useMediaQuery } from '@/hooks'

interface SidebarProps {
    isCollapsed: boolean
    onToggle: () => void
    isMobile?: boolean
    isOpenMobile?: boolean
    onCloseMobile?: () => void
}

const menuItems = [
    {
        title: 'General',
        items: [
            { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin', 'tecnico', 'vendedor'] },
            { name: 'Kanban', href: '/kanban', icon: Columns3, roles: ['admin', 'tecnico', 'vendedor'] },
            { name: 'Punto de Venta', href: '/pos', icon: ShoppingCart, roles: ['admin', 'vendedor'] },
            { name: 'Órdenes', href: '/ordenes', icon: Wrench, roles: ['admin', 'tecnico', 'vendedor'] },
        ],
    },
    {
        title: 'Gestión',
        items: [
            { name: 'Inventario', href: '/inventario', icon: Package, roles: ['admin', 'tecnico', 'vendedor'] },
            { name: 'Clientes', href: '/clientes', icon: Users, roles: ['admin', 'vendedor'] },
            { name: 'Catálogo', href: '/catalogo', icon: Tag, roles: ['admin'] },
            { name: 'Caja', href: '/caja', icon: Wallet, roles: ['admin', 'vendedor'] },
            { name: 'Usuarios', href: '/usuarios', icon: Shield, roles: ['admin'] },
        ],
    },
    {
        title: 'Finanzas',
        items: [
            { name: 'Facturación', href: '/facturacion', icon: FileText, roles: ['admin', 'vendedor'] },
            { name: 'Contabilidad', href: '/contabilidad', icon: Wallet, roles: ['admin'] },
            { name: 'Reportes', href: '/reportes', icon: BarChart3, roles: ['admin'] },
        ],
    },
]

const bottomItems = [
    { name: 'Mi Suscripción', href: '/suscripcion', icon: Tag, roles: ['admin'] },
    { name: 'Configuración', href: '/configuracion', icon: Settings, roles: ['admin'] },
    { name: 'Ayuda', href: '/ayuda', icon: HelpCircle, roles: ['admin', 'tecnico', 'vendedor'] },
]

export function Sidebar({ isCollapsed, onToggle, isMobile, isOpenMobile, onCloseMobile }: SidebarProps) {
    if (isMobile) {
        return (
            <Sheet open={isOpenMobile} onOpenChange={onCloseMobile}>
                <SheetContent side="left" className="p-0 w-[240px] border-r border-white/20 bg-white/60 backdrop-blur-xl">
                    <SidebarInner isCollapsed={false} onToggle={() => { }} isMobile={true} onCloseMobile={onCloseMobile} />
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <TooltipProvider delayDuration={0}>
            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? 64 : 240 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="sidebar-linear fixed left-0 top-0 h-screen z-50 flex flex-col border-r border-white/20 bg-white/40 backdrop-blur-xl shadow-[4px_0_24px_-4px_rgba(0,0,0,0.1)]"
            >
                <SidebarInner isCollapsed={isCollapsed} onToggle={onToggle} isMobile={false} />
            </motion.aside>
        </TooltipProvider>
    )
}

function SidebarInner({ isCollapsed, onToggle, isMobile, onCloseMobile }: { isCollapsed: boolean, onToggle: () => void, isMobile: boolean, onCloseMobile?: () => void }) {
    const pathname = usePathname()
    const router = useRouter()
    const { user, logout } = useAuthStore()

    const handleLogout = () => {
        logout()
        router.push('/login')
    }

    const isActiveRoute = (href: string) => {
        if (href === '/') return pathname === '/'
        return pathname === href || pathname.startsWith(href + '/')
    }

    return (
        <>
            {/* Logo & Toggle */}
            <div className="flex items-center h-14 px-3 border-b border-[hsl(var(--border-subtle))]">
                <AnimatePresence mode="wait">
                    {!isCollapsed ? (
                        <motion.div
                            key="expanded"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-3 flex-1"
                        >
                            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                                <Wrench className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-semibold text-[hsl(var(--text-primary))] text-sm tracking-tight">
                                RepairApp
                            </span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="collapsed"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center mx-auto"
                        >
                            <Wrench className="w-4 h-4 text-white" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {!isCollapsed && !isMobile && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggle}
                        className="h-7 w-7 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--interactive-hover))]"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Search - Linear style */}
            {!isCollapsed && (
                <div className="px-3 py-3">
                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(var(--surface-overlay))] border border-[hsl(var(--border-subtle))] text-[hsl(var(--text-muted))] text-sm hover:border-[hsl(var(--border-default))] transition-colors">
                        <Search className="h-4 w-4" />
                        <span>Buscar...</span>
                        <kbd className="ml-auto hidden lg:inline-flex h-5 items-center gap-1 rounded border border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface-base))] px-1.5 text-[10px] font-medium text-[hsl(var(--text-muted))]">
                            <Command className="h-3 w-3" />K
                        </kbd>
                    </button>
                </div>
            )}

            {/* Navigation */}
            <ScrollArea className="flex-1 px-2">
                <nav className="space-y-6 py-2">
                    {menuItems.map((section) => {
                        const visibleItems = section.items.filter(item =>
                            item.roles.some(role => user?.rol === role)
                        )

                        if (visibleItems.length === 0) return null

                        return (
                            <div key={section.title}>
                                {!isCollapsed && (
                                    <h3 className="px-3 mb-2 text-[10px] font-semibold text-[hsl(var(--text-muted))] uppercase tracking-widest">
                                        {section.title}
                                    </h3>
                                )}
                                <div className="space-y-0.5">
                                    {visibleItems.map((item) => {
                                        const isActive = isActiveRoute(item.href)
                                        const Icon = item.icon

                                        const linkContent = (
                                            <Link
                                                href={item.href}
                                                onClick={isMobile ? onCloseMobile : undefined}
                                                className={cn(
                                                    'group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all relative',
                                                    isActive
                                                        ? 'bg-[hsl(var(--interactive-active))] text-[hsl(var(--text-primary))]'
                                                        : 'text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--interactive-hover))]',
                                                    isCollapsed && 'justify-center px-0'
                                                )}
                                            >
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="activeIndicator"
                                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[hsl(var(--brand-accent))] rounded-full"
                                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                    />
                                                )}
                                                <Icon className={cn(
                                                    'h-4 w-4 flex-shrink-0 transition-colors',
                                                    isActive ? 'text-[hsl(var(--brand-accent))]' : 'text-[hsl(var(--text-muted))] group-hover:text-[hsl(var(--text-secondary))]'
                                                )} />
                                                {!isCollapsed && (
                                                    <span>{item.name}</span>
                                                )}
                                            </Link>
                                        )

                                        if (isCollapsed && !isMobile) {
                                            return (
                                                <Tooltip key={item.href}>
                                                    <TooltipTrigger asChild>
                                                        {linkContent}
                                                    </TooltipTrigger>
                                                    <TooltipContent
                                                        side="right"
                                                        className="bg-[hsl(var(--surface-elevated))] border-[hsl(var(--border-subtle))] text-[hsl(var(--text-primary))]"
                                                    >
                                                        {item.name}
                                                    </TooltipContent>
                                                </Tooltip>
                                            )
                                        }

                                        return <div key={item.href}>{linkContent}</div>
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </nav>
            </ScrollArea>

            {/* Bottom Section */}
            <div className="border-t border-[hsl(var(--border-subtle))] p-2 space-y-0.5">
                {bottomItems.filter(item => item.roles.some(role => user?.rol === role)).map((item) => {
                    const Icon = item.icon
                    const isActive = isActiveRoute(item.href)

                    const linkContent = (
                        <Link
                            href={item.href}
                            onClick={isMobile ? onCloseMobile : undefined}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                                isActive
                                    ? 'bg-[hsl(var(--interactive-active))] text-[hsl(var(--text-primary))]'
                                    : 'text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--interactive-hover))]',
                                isCollapsed && 'justify-center px-0'
                            )}
                        >
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            {!isCollapsed && <span>{item.name}</span>}
                        </Link>
                    )

                    if (isCollapsed && !isMobile) {
                        return (
                            <Tooltip key={item.href}>
                                <TooltipTrigger asChild>
                                    {linkContent}
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    {item.name}
                                </TooltipContent>
                            </Tooltip>
                        )
                    }

                    return <div key={item.href}>{linkContent}</div>
                })}
            </div>

            {/* User Section */}
            <div className="border-t border-[hsl(var(--border-subtle))] p-2">
                <div className={cn(
                    'flex items-center gap-3 p-2 rounded-lg hover:bg-[hsl(var(--interactive-hover))] transition-colors cursor-pointer',
                    isCollapsed && 'justify-center'
                )}>
                    <Avatar className="h-8 w-8 bg-gradient-to-br from-violet-500 to-purple-600">
                        <AvatarFallback className="text-white text-xs font-semibold bg-transparent">
                            {user?.nombre?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[hsl(var(--text-primary))] truncate">
                                {user?.nombre || 'Usuario'}
                            </p>
                            <p className="text-xs text-[hsl(var(--text-muted))] capitalize">
                                {user?.rol || 'Sin rol'}
                            </p>
                        </div>
                    )}
                    {!isCollapsed && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleLogout}
                                    className="h-8 w-8 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--interactive-hover))]"
                                >
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                Cerrar sesión
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
            </div>
        </>
    )
}
