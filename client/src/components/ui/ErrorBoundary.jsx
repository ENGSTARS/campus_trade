import React from 'react'
import { Button } from './Button'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    // Keep logging local and lightweight for now; hook this into Sentry/DataDog later.
    console.error('App error boundary caught:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
          <div className="card-surface max-w-md p-6 text-center">
            <h1 className="text-xl font-semibold text-slate-900">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-600">
              The page encountered an unexpected error. Refresh to continue.
            </p>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              Refresh page
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
