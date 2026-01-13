import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button, Badge, Card, CardContent } from '@/components/ui'
import { Plus, Users, Mail, Phone, Shield } from 'lucide-react'

export const metadata = {
    title: 'Equipo',
}

const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrador',
    technician: 'Técnico',
    receptionist: 'Recepcionista',
}

const ROLE_COLORS: Record<string, 'primary' | 'info' | 'warning'> = {
    admin: 'primary',
    technician: 'info',
    receptionist: 'warning',
}

interface TeamMember {
    id: string
    full_name: string
    email: string
    phone: string | null
    role: string
    is_active: boolean
    created_at: string
}

async function getTeamMembers(supabase: Awaited<ReturnType<typeof createClient>>): Promise<TeamMember[]> {
    const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, phone, role, is_active, created_at')
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching team:', error)
        return []
    }

    return data as TeamMember[]
}

export default async function TeamPage() {
    const supabase = await createClient()
    const members = await getTeamMembers(supabase)

    const activeMembers = members.filter(m => m.is_active)
    const pendingMembers = members.filter(m => !m.is_active)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Equipo</h1>
                    <p className="text-foreground-secondary">
                        Gestiona los miembros de tu equipo
                    </p>
                </div>
                <Link href="/dashboard/team/invite">
                    <Button>
                        <Plus className="h-4 w-4" />
                        Invitar Miembro
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">{activeMembers.length}</p>
                                <p className="text-sm text-foreground-secondary">Miembros activos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                                <Mail className="h-5 w-5 text-warning" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">{pendingMembers.length}</p>
                                <p className="text-sm text-foreground-secondary">Pendientes</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                                <Shield className="h-5 w-5 text-info" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">
                                    {members.filter(m => m.role === 'admin').length}
                                </p>
                                <p className="text-sm text-foreground-secondary">Administradores</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Active Members */}
            <div>
                <h2 className="text-lg font-medium text-foreground mb-4">Miembros Activos</h2>
                {activeMembers.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-foreground-muted">
                            No hay miembros activos
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {activeMembers.map((member) => (
                            <Link key={member.id} href={`/dashboard/team/${member.id}`}>
                                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                                    <CardContent className="pt-6">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <span className="text-sm font-medium text-primary">
                                                    {member.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </span>
                                            </div>
                                            <Badge variant={ROLE_COLORS[member.role] || 'default'}>
                                                {ROLE_LABELS[member.role] || member.role}
                                            </Badge>
                                        </div>
                                        <h3 className="font-medium text-foreground">{member.full_name}</h3>
                                        <div className="mt-2 space-y-1">
                                            <p className="text-sm text-foreground-secondary flex items-center gap-2">
                                                <Mail className="h-3.5 w-3.5" />
                                                {member.email}
                                            </p>
                                            {member.phone && (
                                                <p className="text-sm text-foreground-secondary flex items-center gap-2">
                                                    <Phone className="h-3.5 w-3.5" />
                                                    {member.phone}
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Pending Invitations */}
            {pendingMembers.length > 0 && (
                <div>
                    <h2 className="text-lg font-medium text-foreground mb-4">Invitaciones Pendientes</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {pendingMembers.map((member) => (
                            <Card key={member.id} className="border-dashed">
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="h-10 w-10 rounded-full bg-foreground-muted/20 flex items-center justify-center">
                                            <Mail className="h-5 w-5 text-foreground-muted" />
                                        </div>
                                        <Badge variant="default">Pendiente</Badge>
                                    </div>
                                    <h3 className="font-medium text-foreground">{member.full_name}</h3>
                                    <p className="text-sm text-foreground-secondary mt-1">{member.email}</p>
                                    <p className="text-xs text-foreground-muted mt-2">
                                        Rol asignado: {ROLE_LABELS[member.role]}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
