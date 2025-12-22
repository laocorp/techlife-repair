'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores'
import { PermissionGate } from '@/hooks/use-permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
    Search,
    Plus,
    Edit,
    Loader2,
    RefreshCw,
    Wrench,
    Package,
    Tag,
    Trash2,
} from 'lucide-react'

interface Marca {
    id: string
    nombre: string
    pais: string | null
    activo: boolean
}

interface Modelo {
    id: string
    marca_id: string
    nombre: string
    tipo_equipo: string
    activo: boolean
    marca?: { nombre: string }
}

const tiposEquipo = [
    'Taladro',
    'Amoladora',
    'Sierra',
    'Rotomartillo',
    'Lijadora',
    'Compresor',
    'Soldadora',
    'Generador',
    'Hidrolavadora',
    'Cortadora',
    'Pulidora',
    'Otro',
]

export default function CatalogoPage() {
    const { user } = useAuthStore()
    const [marcas, setMarcas] = useState<Marca[]>([])
    const [modelos, setModelos] = useState<Modelo[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    // Dialog states
    const [isMarcaDialogOpen, setIsMarcaDialogOpen] = useState(false)
    const [isModeloDialogOpen, setIsModeloDialogOpen] = useState(false)
    const [selectedMarca, setSelectedMarca] = useState<Marca | null>(null)
    const [selectedModelo, setSelectedModelo] = useState<Modelo | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Form state
    const [marcaForm, setMarcaForm] = useState({ nombre: '', pais: '' })
    const [modeloForm, setModeloForm] = useState({ marca_id: '', nombre: '', tipo_equipo: '' })

    const loadData = useCallback(async () => {
        if (!user?.empresa_id) return

        setIsLoading(true)
        try {
            const response = await fetch(`/api/catalogo?empresa_id=${user.empresa_id}`)
            if (!response.ok) throw new Error('Error al cargar datos')

            const data = await response.json()
            setMarcas(data.marcas || [])
            setModelos(data.modelos || [])
        } catch (error: any) {
            toast.error('Error al cargar datos', { description: error.message })
        } finally {
            setIsLoading(false)
        }
    }, [user?.empresa_id])

    useEffect(() => {
        loadData()
    }, [loadData])

    // Marcas handlers
    const openMarcaDialog = (marca?: Marca) => {
        setSelectedMarca(marca || null)
        setMarcaForm({
            nombre: marca?.nombre || '',
            pais: marca?.pais || '',
        })
        setIsMarcaDialogOpen(true)
    }

    const handleSaveMarca = async () => {
        if (!marcaForm.nombre) {
            toast.error('El nombre es requerido')
            return
        }

        setIsSaving(true)
        try {
            const url = selectedMarca ? `/api/catalogo/${selectedMarca.id}` : '/api/catalogo'
            const method = selectedMarca ? 'PATCH' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo: 'marca',
                    empresa_id: user?.empresa_id,
                    nombre: marcaForm.nombre,
                    pais: marcaForm.pais || null,
                    activo: true,
                })
            })

            if (!response.ok) throw new Error('Error al guardar')

            toast.success(selectedMarca ? 'Marca actualizada' : 'Marca creada')
            setIsMarcaDialogOpen(false)
            loadData()
        } catch (error: any) {
            toast.error('Error al guardar', { description: error.message })
        } finally {
            setIsSaving(false)
        }
    }

    // Modelos handlers
    const openModeloDialog = (modelo?: Modelo) => {
        setSelectedModelo(modelo || null)
        setModeloForm({
            marca_id: modelo?.marca_id || '',
            nombre: modelo?.nombre || '',
            tipo_equipo: modelo?.tipo_equipo || '',
        })
        setIsModeloDialogOpen(true)
    }

    const handleSaveModelo = async () => {
        if (!modeloForm.nombre || !modeloForm.marca_id) {
            toast.error('Marca y nombre son requeridos')
            return
        }

        setIsSaving(true)
        try {
            const url = selectedModelo ? `/api/catalogo/${selectedModelo.id}` : '/api/catalogo'
            const method = selectedModelo ? 'PATCH' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo: 'modelo',
                    empresa_id: user?.empresa_id,
                    marca_id: modeloForm.marca_id,
                    nombre: modeloForm.nombre,
                    tipo_equipo: modeloForm.tipo_equipo || null,
                    activo: true,
                })
            })

            if (!response.ok) throw new Error('Error al guardar')

            toast.success(selectedModelo ? 'Modelo actualizado' : 'Modelo creado')
            setIsModeloDialogOpen(false)
            loadData()
        } catch (error: any) {
            toast.error('Error al guardar', { description: error.message })
        } finally {
            setIsSaving(false)
        }
    }

    const filteredMarcas = marcas.filter(m =>
        m.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredModelos = modelos.filter(m =>
        m.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.marca?.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Catálogo</h1>
                    <p className="text-slate-400 mt-1">Gestiona marcas y modelos de equipos</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Marcas</p>
                                <p className="text-2xl font-bold text-white">{marcas.length}</p>
                            </div>
                            <Tag className="h-8 w-8 text-blue-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Modelos</p>
                                <p className="text-2xl font-bold text-white">{modelos.length}</p>
                            </div>
                            <Package className="h-8 w-8 text-purple-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="marcas" className="space-y-4">
                <TabsList className="bg-white/5 border border-white/10">
                    <TabsTrigger value="marcas" className="data-[state=active]:bg-white/10">
                        Marcas
                    </TabsTrigger>
                    <TabsTrigger value="modelos" className="data-[state=active]:bg-white/10">
                        Modelos
                    </TabsTrigger>
                </TabsList>

                {/* Marcas Tab */}
                <TabsContent value="marcas">
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <CardTitle className="text-white">Marcas</CardTitle>
                            <PermissionGate permission="admin.config">
                                <Button onClick={() => openMarcaDialog()} className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600">
                                    <Plus className="h-4 w-4" />
                                    Nueva Marca
                                </Button>
                            </PermissionGate>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="p-6 space-y-4">
                                    {[...Array(3)].map((_, i) => (
                                        <Skeleton key={i} className="h-12 w-full bg-white/10" />
                                    ))}
                                </div>
                            ) : filteredMarcas.length === 0 ? (
                                <div className="p-6 text-center">
                                    <Tag className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                                    <p className="text-slate-400">No hay marcas registradas</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-white/10">
                                            <TableHead className="text-slate-400">Marca</TableHead>
                                            <TableHead className="text-slate-400">País</TableHead>
                                            <TableHead className="text-slate-400">Estado</TableHead>
                                            <TableHead className="text-slate-400 text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredMarcas.map((marca) => (
                                            <TableRow key={marca.id} className="border-white/10 hover:bg-white/5">
                                                <TableCell className="text-white font-medium">{marca.nombre}</TableCell>
                                                <TableCell className="text-slate-400">{marca.pais || '-'}</TableCell>
                                                <TableCell>
                                                    <Badge className={marca.activo ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>
                                                        {marca.activo ? 'Activo' : 'Inactivo'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <PermissionGate permission="admin.config">
                                                        <Button variant="ghost" size="sm" onClick={() => openMarcaDialog(marca)} className="text-slate-400 hover:text-white">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </PermissionGate>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Modelos Tab */}
                <TabsContent value="modelos">
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <CardTitle className="text-white">Modelos</CardTitle>
                            <PermissionGate permission="admin.config">
                                <Button onClick={() => openModeloDialog()} className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600">
                                    <Plus className="h-4 w-4" />
                                    Nuevo Modelo
                                </Button>
                            </PermissionGate>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="p-6 space-y-4">
                                    {[...Array(3)].map((_, i) => (
                                        <Skeleton key={i} className="h-12 w-full bg-white/10" />
                                    ))}
                                </div>
                            ) : filteredModelos.length === 0 ? (
                                <div className="p-6 text-center">
                                    <Package className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                                    <p className="text-slate-400">No hay modelos registrados</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-white/10">
                                            <TableHead className="text-slate-400">Modelo</TableHead>
                                            <TableHead className="text-slate-400">Marca</TableHead>
                                            <TableHead className="text-slate-400">Tipo</TableHead>
                                            <TableHead className="text-slate-400 text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredModelos.map((modelo) => (
                                            <TableRow key={modelo.id} className="border-white/10 hover:bg-white/5">
                                                <TableCell className="text-white font-medium">{modelo.nombre}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                                                        {modelo.marca?.nombre}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-slate-400">{modelo.tipo_equipo || '-'}</TableCell>
                                                <TableCell className="text-right">
                                                    <PermissionGate permission="admin.config">
                                                        <Button variant="ghost" size="sm" onClick={() => openModeloDialog(modelo)} className="text-slate-400 hover:text-white">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </PermissionGate>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Marca Dialog */}
            <Dialog open={isMarcaDialogOpen} onOpenChange={setIsMarcaDialogOpen}>
                <DialogContent className="bg-slate-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>{selectedMarca ? 'Editar Marca' : 'Nueva Marca'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Nombre *</Label>
                            <Input
                                value={marcaForm.nombre}
                                onChange={(e) => setMarcaForm(f => ({ ...f, nombre: e.target.value }))}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="Ej: Bosch, Makita"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">País de origen</Label>
                            <Input
                                value={marcaForm.pais}
                                onChange={(e) => setMarcaForm(f => ({ ...f, pais: e.target.value }))}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="Ej: Alemania, Japón"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsMarcaDialogOpen(false)} className="border-white/10 text-white">Cancelar</Button>
                        <Button onClick={handleSaveMarca} disabled={isSaving} className="bg-gradient-to-r from-blue-500 to-purple-600">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modelo Dialog */}
            <Dialog open={isModeloDialogOpen} onOpenChange={setIsModeloDialogOpen}>
                <DialogContent className="bg-slate-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>{selectedModelo ? 'Editar Modelo' : 'Nuevo Modelo'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Marca *</Label>
                            <select
                                value={modeloForm.marca_id}
                                onChange={(e) => setModeloForm(f => ({ ...f, marca_id: e.target.value }))}
                                className="w-full h-10 rounded-md bg-white/5 border border-white/10 text-white px-3"
                            >
                                <option value="">Seleccionar marca</option>
                                {marcas.map(m => (
                                    <option key={m.id} value={m.id}>{m.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Nombre del modelo *</Label>
                            <Input
                                value={modeloForm.nombre}
                                onChange={(e) => setModeloForm(f => ({ ...f, nombre: e.target.value }))}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="Ej: GBH 2-26, GSB 180-LI"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Tipo de equipo</Label>
                            <select
                                value={modeloForm.tipo_equipo}
                                onChange={(e) => setModeloForm(f => ({ ...f, tipo_equipo: e.target.value }))}
                                className="w-full h-10 rounded-md bg-white/5 border border-white/10 text-white px-3"
                            >
                                <option value="">Seleccionar tipo</option>
                                {tiposEquipo.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModeloDialogOpen(false)} className="border-white/10 text-white">Cancelar</Button>
                        <Button onClick={handleSaveModelo} disabled={isSaving} className="bg-gradient-to-r from-blue-500 to-purple-600">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    )
}
