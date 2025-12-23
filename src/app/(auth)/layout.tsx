import { PremiumBackground } from "@/components/ui/premium-background"

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen relative flex items-center justify-center p-4">
            <PremiumBackground />
            <div className="relative z-10 w-full max-w-md">
                {children}
            </div>
        </div>
    )
}
