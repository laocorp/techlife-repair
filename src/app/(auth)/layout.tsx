import Link from 'next/link'
import { Button } from '@/components/ui'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
                <div className="container mx-auto flex h-14 items-center justify-between px-4">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                            <span className="text-sm font-bold text-primary-foreground">TR</span>
                        </div>
                        <span className="text-lg font-semibold text-foreground">TechRepair</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <Link href="/login">
                            <Button variant="ghost" size="sm">Iniciar Sesión</Button>
                        </Link>
                        <Link href="/register">
                            <Button size="sm">Registrarse</Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 flex items-center justify-center pt-14">
                <div className="w-full max-w-md px-4 py-8">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-border py-4">
                <div className="container mx-auto px-4 text-center text-sm text-foreground-muted">
                    © {new Date().getFullYear()} TechRepair. Todos los derechos reservados.
                </div>
            </footer>
        </div>
    )
}
