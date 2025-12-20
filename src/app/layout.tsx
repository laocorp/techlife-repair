import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { OfflineIndicator } from "@/components/layout/offline-indicator";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "RepairApp - Sistema de Servicio Técnico",
  description: "Sistema completo para servicios técnicos autorizados con facturación electrónica SRI Ecuador",
  keywords: ["servicio técnico", "reparación", "herramientas", "Bosch", "facturación electrónica", "SRI Ecuador"],
  manifest: "/manifest.json",
  themeColor: "#3b82f6",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RepairApp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased`} suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster position="top-right" richColors closeButton />
          <ServiceWorkerRegister />
          <OfflineIndicator />
        </Providers>
      </body>
    </html>
  );
}

