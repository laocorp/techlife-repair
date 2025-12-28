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
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/ventas">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            Venta {venta.numero}
                            {esFactura ? (
                                <Badge variant="default" className="bg-emerald-600">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Factura {venta.factura.estado.toUpperCase()}
                                </Badge>
                            ) : (
                                <Badge variant="secondary">Nota de Venta</Badge>
                            )}
                        </h1>
                        <p className="text-muted-foreground">
                            {format(new Date(venta.created_at), "d MMMM yyyy, HH:mm", { locale: es })}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {!esFactura && (
                        <Button onClick={handleFacturar} disabled={isConverting}>
                            {isConverting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                            Convertir a Factura
                        </Button>
                    )}
                    <Button variant="outline">
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimir
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead className="text-right">Cant</TableHead>
                                    <TableHead className="text-right">P. Unit</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {venta.detalles?.map((item: any) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.producto?.nombre || 'Producto'}</TableCell>
                                        <TableCell className="text-right">{item.cantidad}</TableCell>
                                        <TableCell className="text-right">${Number(item.precio_unitario).toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-medium">${Number(item.subtotal).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <div className="mt-6 flex justify-end">
                            <div className="w-48 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal:</span>
                                    <span>${Number(venta.subtotal).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">IVA (15%):</span>
                                    <span>${Number(venta.iva).toFixed(2)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total:</span>
                                    <span>${Number(venta.total).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                            <p className="text-lg">{venta.cliente?.nombre || 'Consumidor Final'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Identificación</p>
                            <p>{venta.cliente?.identificacion || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Email</p>
                            <p className="truncate">{venta.cliente?.email || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Método de Pago</p>
                            <p className="capitalize">{venta.metodo_pago}</p>
                        </div>

                        {esFactura && (
                            <div className="pt-4 border-t mt-4">
                                <p className="text-sm font-medium text-muted-foreground mb-2">Datos SRI</p>
                                <div className="text-xs space-y-1 text-slate-500 break-all">
                                    <p><strong>Autorización:</strong> {venta.factura.numero_autorizacion}</p>
                                    <p><strong>Clave Acceso:</strong> {venta.factura.clave_acceso}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
