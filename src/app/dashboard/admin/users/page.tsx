import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { UserActions } from './user-actions'

export const metadata = {
    title: 'Usuarios - Super Admin',
}

interface GlobalUser {
    id: string
    full_name: string | null
    email: string
    role: string
    is_active: boolean
    is_super_admin: boolean
    created_at: string
    tenant: {
        name: string
        slug: string
    } | null
}

async function getGlobalUsers(supabase: Awaited<ReturnType<typeof createClient>>): Promise<GlobalUser[]> {
    const { data: users } = await supabase
        .from('users')
        .select(`
            id, full_name, email, role, is_active, is_super_admin, created_at,
            tenant:tenants(name, slug)
        `)
        .order('created_at', { ascending: false })

    if (!users) return []

    return users.map(u => ({
        ...u,
        tenant: u.tenant as unknown as { name: string; slug: string } | null,
    }))
}

const ROLE_COLORS: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    admin: 'warning',
    technician: 'info',
    user: 'default',
}

export default async function UsersPage() {
    const supabase = await createClient()
    const users = await getGlobalUsers(supabase)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-semibold text-foreground">Gestión Global de Usuarios</h2>
                <p className="text-foreground-secondary">Todos los usuarios del sistema</p>
            </div>

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Usuarios Registrados ({users.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {users.length === 0 ? (
                        <p className="text-center text-foreground-muted py-8">No hay usuarios</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-background-secondary">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium text-foreground-secondary">Nombre</th>
                                        <th className="px-3 py-2 text-left font-medium text-foreground-secondary">Email</th>
                                        <th className="px-3 py-2 text-left font-medium text-foreground-secondary">Empresa</th>
                                        <th className="px-3 py-2 text-left font-medium text-foreground-secondary">Rol</th>
                                        <th className="px-3 py-2 text-center font-medium text-foreground-secondary">Estado</th>
                                        <th className="px-3 py-2 text-left font-medium text-foreground-secondary">Creado</th>
                                        <th className="px-3 py-2 text-center font-medium text-foreground-secondary">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-background-secondary/50">
                                            <td className="px-3 py-3">
                                                <div>
                                                    <p className="font-medium text-foreground">{user.full_name || '-'}</p>
                                                    {user.is_super_admin && (
                                                        <Badge variant="error" className="text-xs mt-1">Super Admin</Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-foreground-secondary">{user.email}</td>
                                            <td className="px-3 py-3 text-foreground-secondary">
                                                {user.tenant ? (
                                                    <div>
                                                        <p className="font-medium">{user.tenant.name}</p>
                                                        <p className="text-xs text-foreground-muted">{user.tenant.slug}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-foreground-muted">Sin empresa</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3">
                                                <Badge variant={ROLE_COLORS[user.role] || 'default'}>
                                                    {user.role}
                                                </Badge>
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <Badge variant={user.is_active ? 'success' : 'error'}>
                                                    {user.is_active ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                            </td>
                                            <td className="px-3 py-3 text-foreground-secondary">
                                                {formatDate(user.created_at)}
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <UserActions
                                                    userId={user.id}
                                                    currentRole={user.role}
                                                    isActive={user.is_active}
                                                    isSuperAdmin={user.is_super_admin}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
