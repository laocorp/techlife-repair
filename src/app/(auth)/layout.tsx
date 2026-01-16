import Link from 'next/link'
import { Wrench } from 'lucide-react'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex flex-col bg-[#09090B] text-zinc-100 antialiased">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#09090B]/95 backdrop-blur-sm">
                <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-6">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-md bg-zinc-100 flex items-center justify-center">
                            <Wrench className="w-3.5 h-3.5 text-zinc-900" />
                        </div>
                        <span className="font-medium text-sm">TechRepair</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/login"
                            className="text-xs text-zinc-500 hover:text-zinc-100 transition-colors"
                        >
                            Iniciar Sesión
                        </Link>
                        <Link
                            href="/register"
                            className="h-7 px-3 text-xs bg-zinc-100 text-zinc-900 hover:bg-zinc-300 rounded-md font-medium inline-flex items-center"
                        >
                            Registrarse
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 flex items-center justify-center pt-14">
                <div className="w-full max-w-sm px-6 py-12">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="py-6 px-6 text-center text-xs text-zinc-600">
                © {new Date().getFullYear()} TechRepair
            </footer>
        </div>
    )
}
