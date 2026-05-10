// src/components/registro/FirmaCanvas.tsx
// Pad de firma SVG — acepta cualquier trazo de mínimo 1 segundo

import { useRef, useState, useCallback } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Button } from '@/components/ui/Button'
import { RotateCcw } from 'lucide-react'

interface FirmaCanvasProps {
  onFirma: (dataUrl: string) => void
  label?: string
  height?: number
  required?: boolean
}

export function FirmaCanvas({ onFirma, label = 'Firma', height = 180, required }: FirmaCanvasProps) {
  const sigRef = useRef<SignatureCanvas>(null)
  const [hasStroke, setHasStroke] = useState(false)
  const [strokeStartTime, setStrokeStartTime] = useState<number | null>(null)

  const handleBegin = useCallback(() => {
    setStrokeStartTime(Date.now())
  }, [])

  const handleEnd = useCallback(() => {
    const duration = strokeStartTime ? Date.now() - strokeStartTime : 0
    // Aceptar cualquier trazo de al menos 500ms (muy permisivo para condiciones de campo)
    if (duration >= 500 && sigRef.current && !sigRef.current.isEmpty()) {
      setHasStroke(true)
      const dataUrl = sigRef.current.getTrimmedCanvas().toDataURL('image/png')
      onFirma(dataUrl)
    }
  }, [strokeStartTime, onFirma])

  const limpiar = () => {
    sigRef.current?.clear()
    setHasStroke(false)
    onFirma('')
  }

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-[var(--text-primary)]">
            {label}
            {required && <span className="text-[#E24B4A] ml-0.5">*</span>}
          </label>
          {hasStroke && (
            <button
              onClick={limpiar}
              className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[#E24B4A] transition-colors"
              type="button"
            >
              <RotateCcw size={12} />
              Limpiar
            </button>
          )}
        </div>
      )}

      <div
        className={[
          'firma-canvas overflow-hidden',
          hasStroke ? 'border-[#1D9E75] border-2' : '',
        ].join(' ')}
        style={{ height }}
      >
        <SignatureCanvas
          ref={sigRef}
          canvasProps={{
            className: 'w-full h-full',
            style: { width: '100%', height: '100%' },
          }}
          onBegin={handleBegin}
          onEnd={handleEnd}
          penColor="#1A1A18"
          backgroundColor="#FFFFFF"
          dotSize={2}
          minWidth={1.5}
          maxWidth={3}
          throttle={16}
        />
      </div>

      {!hasStroke && (
        <p className="text-xs text-[var(--text-faded)] text-center">Firmar aquí</p>
      )}
      {hasStroke && (
        <p className="text-xs text-[#1D9E75] text-center">✓ Firma registrada</p>
      )}
    </div>
  )
}
