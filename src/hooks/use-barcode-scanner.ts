import { useEffect, useRef } from 'react'

interface UseBarcodeScannerProps {
    onScan: (barcode: string) => void
    minLength?: number
}

export function useBarcodeScanner({ onScan, minLength = 3 }: UseBarcodeScannerProps) {
    const buffer = useRef<string>('')
    const lastKeyTime = useRef<number>(0)

    // Configuración de velocidad para distinguir escáner de tecleo humano
    // Los escáneres suelen enviar caracteres con < 50ms de diferencia
    const MAX_INTERVAL = 100

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const currentTime = Date.now()
            const timeDiff = currentTime - lastKeyTime.current

            // Si hay mucho tiempo entre teclas, reiniciar buffer (asumimos nuevo input o tecleo lento)
            if (timeDiff > MAX_INTERVAL && buffer.current.length > 0) {
                // Excepción: Si es Enter y tenemos algo en buffer que parece escáner
                if (e.key !== 'Enter') {
                    buffer.current = ''
                }
            }

            lastKeyTime.current = currentTime

            if (e.key === 'Enter') {
                if (buffer.current.length >= minLength) {
                    // Validar que no estemos en un input de texto que necesite el enter
                    // Opcional: permitir escanear incluso con foco si el patrón es claro
                    onScan(buffer.current)
                    buffer.current = ''
                }
            } else if (e.key.length === 1) {
                // Solo caracteres imprimibles
                buffer.current += e.key
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [onScan, minLength])
}
