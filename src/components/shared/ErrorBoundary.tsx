import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[WELL LOG] Error boundary caught:', error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      const isChunkError = this.state.error?.message?.includes('Failed to fetch dynamically imported module') ||
        this.state.error?.message?.includes('Loading chunk') ||
        this.state.error?.message?.includes('Importing a module script failed')

      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-[#E24B4A]/10 flex items-center justify-center mb-4">
            <AlertTriangle size={24} className="text-[#E24B4A]" />
          </div>
          <h2 className="text-lg font-medium text-[var(--text-primary)] mb-2">
            {isChunkError ? 'Nueva versión disponible' : (this.props.fallbackTitle || 'Algo salió mal')}
          </h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6">
            {isChunkError
              ? 'Se desplegó una actualización. Recargá la página para usar la última versión.'
              : 'Ocurrió un error inesperado. Podés intentar de nuevo o recargar la página.'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-clay bg-[#7F77DD] text-white hover:bg-[#534AB7] transition-colors"
            >
              <RefreshCw size={14} />
              {isChunkError ? 'Recargar' : 'Reintentar'}
            </button>
            {!isChunkError && (
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2.5 text-sm font-medium rounded-clay bg-[var(--card-bg)] border border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
              >
                Recargar página
              </button>
            )}
          </div>
          {!isChunkError && this.state.error && (
            <details className="mt-6 text-left max-w-md w-full">
              <summary className="text-xs text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-secondary)]">
                Detalles técnicos
              </summary>
              <pre className="mt-2 p-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg text-[10px] font-mono text-[var(--text-secondary)] overflow-x-auto whitespace-pre-wrap">
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
