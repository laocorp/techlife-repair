'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores'
import { PermissionGate } from '@/hooks/use-permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
    Wallet,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Plus,
    Minus,
    Lock,
    Unlock,
    Clock,
    AlertCircle,
    Loader2,
    RefreshCw,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Caja {
    id: string
    estado: string
    monto_apertura: number
    monto_cierre: number | null
    fecha_apertura: string
    fecha_cierre: string | null
    usuario: { nombre: string } | null
}

interface Movimiento {
    id: string
    tipo: string
    concepto: string
    monto: number
    created_at: string
}

export default function CajaPage() {
    const { user } = useAuthStore()
    const [cajaActiva, setCajaActiva] = useState<Caja | null>(null)
    const [movimientos, setMovimientos] = useState<Movimiento[]>([])
    const [historial, setHistorial] = useState<Caja[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false)
    const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false)
    const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

    // Form state
    const [montoInicial, setMontoInicial] = useState('')
    const [movementType, setMovementType] = useState<'ingreso' | 'egreso'>('ingreso')
    const [movementMonto, setMovementMonto] = useState('')
    const [movementConcepto, setMovementConcepto] = useState('')

    const loadData = useCallback(async () => {
        if (!user?.empresa_id) return

        setIsLoading(true)
        try {
            const response = await fetch(`/api/caja?empresa_id=${user.empresa_id}`)

            if (!response.ok) throw new Error('Error al cargar caja')

            const data = await response.json()
            setCajaActiva(data.cajaActiva)
            setMovimientos(data.movimientos || [])
            setHistorial(data.historial || [])
        } catch (error) {
            console.error('Error loading caja:', error)
        } finally {
            setIsLoading(false)
        }
    }, [user?.empresa_id])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handleOpenCaja = async () => {
        if (!montoInicial) {
            toast.error('Ingresa el monto inicial')
            return
        }

        setIsProcessing(true)
        try {
            const response = await fetch('/api/caja', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    empresa_id: user?.empresa_id,
                    usuario_id: user?.id,
                    monto_apertura: montoInicial
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Error al abrir caja')
            }

            toast.success('Caja abierta exitosamente')
            setIsOpenDialogOpen(false)
            setMontoInicial('')
            loadData()
        } catch (error: any) {
            toast.error('Error al abrir caja', { description: error.message })
        } finally {
            setIsProcessing(false)
        }
    }

    const handleCloseCaja = async () => {
        if (!cajaActiva) return

        setIsProcessing(true)
        try {
            // Calculate final amount
            const totalIngresos = movimientos
                .filter(m => m.tipo === 'ingreso')
                .reduce((acc, m) => acc + Number(m.monto), 0)
            const totalEgresos = movimientos
                .filter(m => m.tipo === 'egreso')
                .reduce((acc, m) => acc + Number(m.monto), 0)
            const montoFinal = Number(cajaActiva.monto_apertura) + totalIngresos - totalEgresos

            const response = await fetch(`/api/caja/${cajaActiva.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    estado: 'cerrada',
                    monto_cierre: montoFinal
                })
            })

            if (!response.ok) throw new Error('Error al cerrar caja')

            toast.success('Caja cerrada', {
                description: `Monto final: $${montoFinal.toFixed(2)}`,
            })
            setIsCloseDialogOpen(false)
            loadData()
        } catch (error: any) {
            toast.error('Error al cerrar caja', { description: error.message })
        } finally {
            setIsProcessing(false)
        }
    }

    const handleAddMovement = async () => {
        if (!cajaActiva || !movementMonto || !movementConcepto) {
            toast.error('Completa todos los campos')
            return
        }

        setIsProcessing(true)
        try {
            const response = await fetch('/api/caja/movimientos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    caja_id: cajaActiva.id,
                    tipo: movementType,
                    concepto: movementConcepto,
                    monto: movementMonto
                })
            })

            if (!response.ok) throw new Error('Error al registrar movimiento')

            toast.success(`${movementType === 'ingreso' ? 'Ingreso' : 'Egreso'} registrado`)
            setIsMovementDialogOpen(false)
            setMovementMonto('')
            setMovementConcepto('')
            loadData()
        } catch (error: any) {
            toast.error('Error al registrar movimiento', { description: error.message })
        } finally {
            setIsProcessing(false)
        }
    }

    // Calculate totals
    const totalIngresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((acc, m) => acc + Number(m.monto), 0)
    const totalEgresos = movimientos.filter(m => m.tipo === 'egreso').reduce((acc, m) => acc + Number(m.monto), 0)
    const saldoActual = (Number(cajaActiva?.monto_apertura) || 0) + totalIngresos - totalEgresos

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Caja</h1>
                    <p className="text-slate-400 mt-1">Control de apertura, cierre y movimientos de caja</p>
                </div>
                <div className="flex gap-2">
                    {!cajaActiva ? (
                        <PermissionGate permission="cash.open">
                            <Button
                                onClick={() => setIsOpenDialogOpen(true)}
                                className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                            >
                                <Unlock className="h-4 w-4" />
                                Abrir Caja
                            </Button>
                        </PermissionGate>
                    ) : (
                        <>
                            <PermissionGate permission="cash.movements">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setMovementType('ingreso')
                                        setIsMovementDialogOpen(true)
                                    }}
                                    className="gap-2 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                                >
                                    <Plus className="h-4 w-4" />
                                    Ingreso
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setMovementType('egreso')
                                        setIsMovementDialogOpen(true)
                                    }}
                                    className="gap-2 border-red-500/50 text-red-400 hover:bg-red-500/10"
                                >
                                    <Minus className="h-4 w-4" />
                                    Egreso
                                </Button>
                            </PermissionGate>
                            <PermissionGate permission="cash.close">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsCloseDialogOpen(true)}
                                    className="gap-2 border-white/10 text-white hover:bg-white/5"
                                >
                                    <Lock className="h-4 w-4" />
                                    Cerrar Caja
                                </Button>
                            </PermissionGate>
                        </>
                    )}
                </div>
            </div>

            {/* Status Banner */}
            {isLoading ? (
                <Skeleton className="h-24 w-full bg-white/10" />
            ) : cajaActiva ? (
                <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 border-0">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Wallet className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-white/80 text-sm">Caja Abierta</p>
                                    <p className="text-white font-medium">
                                        Desde {format(new Date(cajaActiva.fecha_apertura), "dd MMM 'a las' HH:mm", { locale: es })}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-white/80 text-sm">Saldo Actual</p>
                                <p className="text-3xl font-bold text-white">${saldoActual.toFixed(2)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="bg-slate-800/50 border-white/10">
                    <CardContent className="p-6 text-center">
                        <AlertCircle className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400">No hay caja abierta</p>
                        <p className="text-sm text-slate-500">Abre la caja para comenzar a registrar movimientos</p>
                    </CardContent>
                </Card>
            )}

            {/* Stats */}
            {cajaActiva && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-white/5 border-white/10">
                        <CardContent className="p-4">
                            <p className="text-slate-400 text-sm">Monto Inicial</p>
                            <p className="text-2xl font-bold text-white">${Number(cajaActiva.monto_apertura).toFixed(2)}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/5 border-white/10">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-400 text-sm">Ingresos</p>
                                    <p className="text-2xl font-bold text-emerald-400">${totalIngresos.toFixed(2)}</p>
                                </div>
                                <TrendingUp className="h-6 w-6 text-emerald-400" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/5 border-white/10">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-400 text-sm">Egresos</p>
                                    <p className="text-2xl font-bold text-red-400">${totalEgresos.toFixed(2)}</p>
                                </div>
                                <TrendingDown className="h-6 w-6 text-red-400" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/5 border-white/10">
                        <CardContent className="p-4">
                            <p className="text-slate-400 text-sm">Movimientos</p>
                            <p className="text-2xl font-bold text-white">{movimientos.length}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Movements */}
            {cajaActiva && (
                <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                        <CardTitle className="text-lg text-white">Movimientos del Día</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {movimientos.length === 0 ? (
                            <div className="p-6 text-center">
                                <Clock className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400">No hay movimientos registrados</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/10 hover:bg-transparent">
                                        <TableHead className="text-slate-400">Hora</TableHead>
                                        <TableHead className="text-slate-400">Tipo</TableHead>
                                        <TableHead className="text-slate-400">Concepto</TableHead>
                                        <TableHead className="text-slate-400 text-right">Monto</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {movimientos.map(mov => (
                                        <TableRow key={mov.id} className="border-white/10 hover:bg-white/5">
                                            <TableCell className="text-slate-400">
                                                {format(new Date(mov.created_at), 'HH:mm')}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={mov.tipo === 'ingreso' ? 'bg-emerald-500/20 text-emerald-400 border-0' : 'bg-red-500/20 text-red-400 border-0'}>
                                                    {mov.tipo === 'ingreso' ? <Plus className="h-3 w-3 mr-1" /> : <Minus className="h-3 w-3 mr-1" />}
                                                    {mov.tipo}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-white">{mov.concepto}</TableCell>
                                            <TableCell className={`text-right font-medium ${mov.tipo === 'ingreso' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {mov.tipo === 'ingreso' ? '+' : '-'}${Number(mov.monto).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Open Caja Dialog */}
            <Dialog open={isOpenDialogOpen} onOpenChange={setIsOpenDialogOpen}>
                <DialogContent className="bg-slate-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Unlock className="h-5 w-5" />
                            Abrir Caja
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label className="text-slate-300">Monto Inicial</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={montoInicial}
                            onChange={(e) => setMontoInicial(e.target.value)}
                            className="bg-white/5 border-white/10 text-white text-xl h-14 text-center mt-2"
                            placeholder="0.00"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsOpenDialogOpen(false)} className="border-white/10 text-white">
                            Cancelar
                        </Button>
                        <Button onClick={handleOpenCaja} disabled={isProcessing} className="bg-gradient-to-r from-emerald-500 to-teal-600 gap-2">
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
                            Abrir Caja
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Close Caja Dialog */}
            <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
                <DialogContent className="bg-slate-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            Cerrar Caja
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="bg-white/5 rounded-xl p-4 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Monto Inicial:</span>
                                <span className="text-white">${Number(cajaActiva?.monto_apertura || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">+ Ingresos:</span>
                                <span className="text-emerald-400">${totalIngresos.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">- Egresos:</span>
                                <span className="text-red-400">${totalEgresos.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-white/10 pt-2 flex justify-between">
                                <span className="text-white font-medium">Monto Final:</span>
                                <span className="text-2xl font-bold text-white">${saldoActual.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCloseDialogOpen(false)} className="border-white/10 text-white">
                            Cancelar
                        </Button>
                        <Button onClick={handleCloseCaja} disabled={isProcessing} className="bg-gradient-to-r from-blue-500 to-purple-600 gap-2">
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                            Confirmar Cierre
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Movement Dialog */}
            <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
                <DialogContent className="bg-slate-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {movementType === 'ingreso' ? (
                                <><Plus className="h-5 w-5 text-emerald-400" /> Registrar Ingreso</>
                            ) : (
                                <><Minus className="h-5 w-5 text-red-400" /> Registrar Egreso</>
                            )}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Monto</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={movementMonto}
                                onChange={(e) => setMovementMonto(e.target.value)}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Concepto</Label>
                            <Textarea
                                value={movementConcepto}
                                onChange={(e) => setMovementConcepto(e.target.value)}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="Describe el motivo del movimiento..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsMovementDialogOpen(false)} className="border-white/10 text-white">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleAddMovement}
                            disabled={isProcessing}
                            className={`gap-2 ${movementType === 'ingreso' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
                        >
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Registrar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    )
}
