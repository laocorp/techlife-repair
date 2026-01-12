import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'TechRepair - Gestión de Servicio Técnico',
    template: '%s | TechRepair',
  },
  description: 'Plataforma SaaS para empresas de servicio técnico. Gestiona clientes, órdenes de trabajo, inventario y facturación.',
  keywords: ['servicio técnico', 'SaaS', 'gestión', 'órdenes de trabajo', 'inventario'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
