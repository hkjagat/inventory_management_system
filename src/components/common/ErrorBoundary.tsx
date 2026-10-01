import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo)
    this.setState({ errorInfo })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleResetCache = () => {
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch {}
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa] p-4 text-[#182230]">
          <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-red-100">
                <AlertTriangle className="size-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-[17px] font-bold text-[#182230]">Application Encountered an Issue</h2>
                <p className="text-[12px] text-[#6b7785]">A runtime error was caught and prevented a crash.</p>
              </div>
            </div>

            <div className="my-4 rounded-xl border border-red-100 bg-red-50/60 p-3.5 font-mono text-[12px] text-red-800 break-words">
              <strong>Error:</strong> {this.state.error?.message || 'Unknown error occurred'}
            </div>

            <p className="text-[12px] text-[#556372] mb-5">
              You can reload the page or reset the local browser storage cache to restore normal operation.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#f0f2f5]">
              <button
                onClick={this.handleReload}
                className="flex items-center gap-1.5 rounded-lg bg-[#17604f] px-4 py-2 text-[12px] font-semibold text-white shadow-2xs hover:bg-[#124b3e]"
              >
                <RefreshCw className="size-3.5" />
                Reload Application
              </button>
              <button
                onClick={this.handleResetCache}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 py-2 text-[12px] font-semibold text-red-600 hover:bg-red-50"
              >
                <Trash2 className="size-3.5" />
                Reset Local Cache & Restart
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
