'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import {
    ArrowLeft,
    Printer,
    FileText,
    CheckCircle,
    AlertTriangle,
    Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { SalesPDFWrapper } from '@/components/pdf/sales-pdf-wrapper'

export default function VentaDetallePage() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuthStore()
    const [venta, setVenta] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isConverting, setIsConverting] = useState(false)

    useEffect(() => {
        const loadVenta = async () => {
            try {
                // Fetch the specific sale matching logic (using API or just fetch list and filter? better fetch specific)
                // We don't have GET /api/ventas/[id] yet, only params filter on list.
                // Assuming we can add logic to GET /api/ventas to filter by ID or create new endpoint.
                // For now, let's use the list endpoint with a filter if possible, or just create the GET /api/ventas/[id]... 
                // Actually the list endpoint I made accepts empresa_id.
                // I should probably add a dedicated GET route for details.
                // BUT for now in client code I can't easily fetch one unless I filter client side or backend supports it.
                // Re-using the list endpoint is heavy.
                // I will assume I can fetch it via `api/ventas?id=${params.id}` if I updated the route,
                // but I only added `empresa_id` filter.
                // Let's rely on `prisma` inside a server action or just update the GET route to support `id` param.
                // Checking `api/ventas/route.ts`... I only added `empresa_id`.

                // Workaround: Add `id` support to the GET route or fetch all (bad).
                // Better: Create `src/app/api/ventas/[id]/route.ts`. 
                // Since I am already here, I will do a fetch to a new endpoint I will create: `api/ventas/${params.id}`
                // I need to create that file too.
                const response = await fetch(`/api/ventas/${params.id}`)
                if (!response.ok) throw new Error('Venta no encontrada')
                const data = await response.json()
                setVenta(data)
            } catch (error) {
                console.error(error)
                toast.error('Error al cargar la venta')
            } finally {
                setIsLoading(false)
            }
        }
        if (params.id) loadVenta()
    }, [params.id])

    const handleFacturar = async () => {
        if (!confirm('¿Estás seguro de generar la factura electrónica para esta venta? Se enviará al SRI.')) return

        setIsConverting(true)
        try {
            const response = await fetch(`/api/ventas/${params.id}/facturar`, {
                method: 'POST'
            })
            const data = await response.json()

            if (!response.ok) throw new Error(data.error || 'Error al facturar')

            toast.success('Factura generada y enviada al SRI')
            setVenta({ ...venta, factura: data.factura }) // Update local state
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsConverting(false)
        }
    }

    if (isLoading) return <div className="p-8 text-center">Cargando detalles...</div>
    if (!venta) return <div className="p-8 text-center text-red-500">Venta no encontrada</div>

    const esFactura = !!venta.factura

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Action Bar - Hidden in Print */}
            <div className="flex items-center justify-between no-print">
                <div className="flex items-center gap-4">
                    <Link href="/ventas">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            Detalle de Venta
                            {esFactura ? (
                                <Badge variant="default" className="bg-emerald-600">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Factura {venta.factura.estado.toUpperCase()}
                                </Badge>
                            ) : (
                                <Badge variant="secondary">Nota de Venta</Badge>
                            )}
                        </h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    {!esFactura && (
                        <Button onClick={handleFacturar} disabled={isConverting} className="bg-slate-900 text-white hover:bg-slate-800">
                            {isConverting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                            Convertir a Factura
                        </Button>
                    )}
                    <SalesPDFWrapper
                        venta={venta}
                        fileName={`Venta-${venta.numero}.pdf`}
                    >
                        Imprimir / Descargar
                    </SalesPDFWrapper>
                </div>
            </div>

            {/* The Document - This is what gets printed */}
            <div className="bg-white shadow-xl rounded-none md:rounded-lg overflow-hidden border border-slate-200 print:shadow-none print:border-none print:m-0 print:w-full print:rounded-none">

                {/* Header */}
                <div className="bg-slate-950 text-white p-8 flex justify-between items-start print:bg-slate-950 print:text-white">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            {/* Placeholder for Logo if exists */}
                            <div className="h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                                <span className="text-xl font-bold">R</span>
                            </div>
                            <h2 className="text-2xl font-bold">{venta.empresa?.nombre_comercial || 'EMPRESA'}</h2>
                        </div>
                        <p className="text-slate-400 text-sm">{venta.empresa?.direccion || 'Dirección no registrada'}</p>
                        <p className="text-slate-400 text-sm">RUC: {venta.empresa?.ruc || '9999999999999'}</p>
                        <p className="text-slate-400 text-sm">{venta.empresa?.telefono || ''}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">
                            {esFactura ? 'FACTURA ELECTRÓNICA' : 'NOTA DE VENTA'}
                        </p>
                        <p className="text-3xl font-bold tabular-nums">Nº {venta.numero}</p>
                        <p className="text-slate-400 mt-1">
                            {format(new Date(venta.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                    </div>
                </div>

                {/* Client & Invoice Info */}
                <div className="p-8 grid grid-cols-2 gap-12 border-b border-slate-100">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Facturado A</p>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">{venta.cliente?.nombre || 'Consumidor Final'}</h3>
                        <div className="text-sm text-slate-600 space-y-1">
                            {venta.cliente && (
                                <>
                                    <p>CI/RUC: {venta.cliente.identificacion}</p>
                                    <p>{venta.cliente.direccion || 'Sin dirección'}</p>
                                    <p>{venta.cliente.telefono || ''}</p>
                                    <p>{venta.cliente.email || ''}</p>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Fecha de Emisión</p>
                            <p className="text-sm font-medium text-slate-900">{format(new Date(venta.created_at), "dd/MM/yyyy")}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Forma de Pago</p>
                            <p className="text-sm font-medium text-slate-900 capitalize">{venta.metodo_pago}</p>
                        </div>
                        {esFactura && (
                            <div className="col-span-2 mt-2">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Autorización SRI</p>
                                <p className="text-xs font-mono bg-slate-100 p-2 rounded border border-slate-200 break-all text-slate-600">
                                    {venta.factura.numero_autorizacion}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Items Table - Using traditional HTML table for better print control */}
                <div className="p-8">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b-2 border-slate-100 text-left">
                                <th className="py-3 font-semibold text-slate-900 w-[50%]">Descripción</th>
                                <th className="py-3 font-semibold text-slate-900 text-right">Cant.</th>
                                <th className="py-3 font-semibold text-slate-900 text-right">Precio Unit.</th>
                                <th className="py-3 font-semibold text-slate-900 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {venta.detalles?.map((item: any) => (
                                <tr key={item.id}>
                                    <td className="py-4 text-slate-700">
                                        <p className="font-medium text-slate-900">{item.producto?.nombre || 'Producto'}</p>
                                        <p className="text-xs text-slate-500">{item.producto?.codigo ? `Código: ${item.producto.codigo}` : ''}</p>
                                    </td>
                                    <td className="py-4 text-right text-slate-700">{item.cantidad}</td>
                                    <td className="py-4 text-right text-slate-700">${Number(item.precio_unitario).toFixed(2)}</td>
                                    <td className="py-4 text-right font-medium text-slate-900">${Number(item.subtotal).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="px-8 pb-8 flex justify-end">
                    <div className="w-64 space-y-3">
                        <div className="flex justify-between text-sm text-slate-600">
                            <span>Subtotal</span>
                            <span className="font-medium text-slate-900">${Number(venta.subtotal).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-600">
                            <span>Descuento</span>
                            <span className="font-medium text-slate-900">${Number(venta.descuento || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-600">
                            <span>IVA (15%)</span>
                            <span className="font-medium text-slate-900">${Number(venta.iva).toFixed(2)}</span>
                        </div>
                        <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                            <span className="text-base font-bold text-slate-900">Total</span>
                            <span className="text-xl font-bold text-slate-900">${Number(venta.total).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-8 border-t border-slate-100 print:bg-white print:border-t-2">
                    <div className="text-center text-xs text-slate-500 space-y-1">
                        <p className="font-medium text-slate-900">¡Gracias por su compra!</p>
                        <p>Para garantías es indispensable presentar este documento.</p>
                        <p>Generado por RepairApp v2.0</p>
                    </div>
                </div>

            </div>
        </div>
    )
}
