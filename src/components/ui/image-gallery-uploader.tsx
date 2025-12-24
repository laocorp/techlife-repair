"use client"

import { useState } from "react"
import { X, Plus, Image as ImageIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ImageGalleryUploaderProps {
    images: string[]
    onChange: (images: string[]) => void
    maxImages?: number
}

export function ImageGalleryUploader({ images = [], onChange, maxImages = 5 }: ImageGalleryUploaderProps) {
    const [newUrl, setNewUrl] = useState("")
    const [isAdding, setIsAdding] = useState(false)

    const handleAdd = () => {
        if (!newUrl) return
        if (images.length >= maxImages) return

        onChange([...images, newUrl])
        setNewUrl("")
        setIsAdding(false)
    }

    const handleRemove = (index: number) => {
        const newImages = [...images]
        newImages.splice(index, 1)
        onChange(newImages)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleAdd()
        }
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <AnimatePresence>
                    {images.map((url, index) => (
                        <motion.div
                            key={`${url}-${index}`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="relative aspect-square rounded-lg overflow-hidden group border border-slate-200 bg-slate-50"
                        >
                            <img
                                src={url}
                                alt={`Product ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/400?text=Error'
                                }}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    onClick={() => handleRemove(index)}
                                    type="button"
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            {index === 0 && (
                                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] font-medium text-white">
                                    Principal
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {images.length < maxImages && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="aspect-square rounded-lg border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/50 transition-colors flex flex-col items-center justify-center cursor-pointer group"
                        onClick={() => setIsAdding(true)}
                    >
                        {isAdding ? (
                            <div className="w-full h-full p-2 flex flex-col justify-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                    type="url"
                                    placeholder="https://..."
                                    className="w-full text-xs p-2 border rounded mb-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={newUrl}
                                    onChange={(e) => setNewUrl(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    autoFocus
                                />
                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={handleAdd}
                                        className="flex-1 bg-indigo-600 text-white text-xs py-1 rounded hover:bg-indigo-700"
                                    >
                                        Add
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsAdding(false)}
                                        className="flex-1 bg-slate-200 text-slate-700 text-xs py-1 rounded hover:bg-slate-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="p-3 rounded-full bg-slate-100 group-hover:bg-indigo-100 transition-colors mb-2">
                                    <Plus className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
                                </div>
                                <span className="text-xs font-medium text-slate-500 group-hover:text-indigo-600">
                                    Añadir Imagen
                                </span>
                            </>
                        )}
                    </motion.div>
                )}
            </div>
            <p className="text-xs text-slate-500">
                Pega la URL de la imagen. La primera imagen será la principal.
            </p>
        </div>
    )
}
