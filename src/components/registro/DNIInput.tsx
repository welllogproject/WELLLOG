// src/components/registro/DNIInput.tsx
// Input numérico grande para tablet — ocupa toda la pantalla

import { useRef, useEffect, KeyboardEvent } from 'react'
import { Delete } from 'lucide-react'

interface DNIInputProps {
  value: string
  onChange: (val: string) => void
  onConfirm?: () => void
  error?: string
  isLoading?: boolean
}

const NUMPAD = ['1','2','3','4','5','6','7','8','9','←','0','✓']

export function DNIInput({ value, onChange, onConfirm, error, isLoading }: DNIInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKey = (key: string) => {
    if (key === '←') {
      onChange(value.slice(0, -1))
    } else if (key === '✓') {
      if (value.length >= 7) onConfirm?.()
    } else {
      if (value.length < 9) onChange(value + key) // Max 9 dígitos (DNI argentino)
    }
  }

  const handleKeyboard = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.length >= 7) onConfirm?.()
    if (e.key === 'Backspace') onChange(value.slice(0, -1))
    if (/^\d$/.test(e.key) && value.length < 9) onChange(value + e.key)
    e.preventDefault()
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Display */}
      <div className="w-full relative">
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          value={value}
          readOnly
          onKeyDown={handleKeyboard}
          className={[
            'w-full text-center text-5xl font-medium tracking-[0.2em] py-6 px-4',
            'bg-white border-2 rounded-clay outline-none transition-colors',
            'text-[#2C2C2A] placeholder:text-[#DDDDDD]',
            error ? 'border-[#E24B4A]' : value.length >= 7 ? 'border-[#1D9E75]' : 'border-[rgba(0,0,0,0.12)]',
          ].join(' ')}
          placeholder="00000000"
          aria-label="Número de DNI"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-[#AAAAAA] hover:text-[#E24B4A] transition-colors"
            aria-label="Limpiar"
          >
            <Delete size={22} />
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-[#E24B4A] text-center">{error}</p>
      )}

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {NUMPAD.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => handleKey(key)}
            disabled={isLoading}
            className={[
              'h-16 rounded-clay text-xl font-medium transition-all duration-100 select-none',
              'active:scale-95',
              key === '✓'
                ? value.length >= 7
                  ? 'btn-salida text-white'
                  : 'bg-[#888780]/10 text-[#AAAAAA] cursor-not-allowed'
                : key === '←'
                ? 'bg-white border border-[rgba(0,0,0,0.1)] text-[#5F5E5A] hover:bg-gray-50'
                : 'bg-white border border-[rgba(0,0,0,0.1)] text-[#2C2C2A] hover:bg-gray-50 shadow-clay-sm',
            ].join(' ')}
            aria-label={key === '←' ? 'Borrar' : key === '✓' ? 'Confirmar' : key}
          >
            {key === '←' ? '⌫' : key}
          </button>
        ))}
      </div>

      <p className="text-sm text-[#888780]">
        {value.length < 7 ? 'Ingresá el número de DNI' : `DNI: ${value}`}
      </p>
    </div>
  )
}
