import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button, Badge, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { ArrowLeft, Mail, Phone, Calendar, Shield } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { MemberActions } from './member-actions'

const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrador',
    technician: 'Técnico',
    receptionist: 'Recepcionista',
}

interface TeamMemberPageProps {
    params: Promise<{ id: string }>
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

async function getTeamMember(
    supabase: Awaited<ReturnType<typeof createClient>>,
    id: string
): Promise<TeamMember | null> {
    const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, phone, role, is_active, created_at')
        .eq('id', id)
        .single()

    if (error) return null
    return data as TeamMember
}

export default async function TeamMemberDetailPage({ params }: TeamMemberPageProps) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: currentUser } = await supabase
        .from('users')
        .select('id, role')
        .eq('auth_user_id', user.id)
        .single()

    const member = await getTeamMember(supabase, id)

    if (!member) {
        notFound()
    }

    const isAdmin = currentUser?.role === 'admin'
    const isSelf = currentUser?.id === member.id

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Back */}
            <Link
                href="/dashboard/team"
                className="inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Volver al Equipo
            </Link>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xl font-medium text-primary">
                            {member.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">
                            {member.full_name}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant={member.is_active ? 'success' : 'default'}>
                                {member.is_active ? 'Activo' : 'Pendiente'}
                            </Badge>
                            <Badge variant="info">
                                {ROLE_LABELS[member.role]}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Información de Contacto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-foreground-muted" />
                        <span className="text-foreground">{member.email}</span>
                    </div>
                    {member.phone && (
                        <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-foreground-muted" />
                            <span className="text-foreground">{member.phone}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-foreground-muted" />
                        <span className="text-foreground-secondary">
                            Miembro desde {formatDate(member.created_at)}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-foreground-muted" />
                        <span className="text-foreground-secondary">
                            Rol: {ROLE_LABELS[member.role]}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Actions (only for admins, not for self) */}
            {isAdmin && !isSelf && (
                <MemberActions
                    memberId={member.id}
                    currentRole={member.role}
                    isActive={member.is_active}
                />
            )}

            {isSelf && (
                <Card>
                    <CardContent className="py-4">
                        <p className="text-sm text-foreground-muted text-center">
                            Este es tu perfil. Puedes editar tu información desde Configuración.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
