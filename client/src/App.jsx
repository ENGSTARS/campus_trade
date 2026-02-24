import { Suspense } from 'react'
import { AppRoutes } from './routes/AppRoutes'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { ToastContainer } from './components/ui/ToastContainer'

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="p-6 text-slate-600">Loading page...</div>}>
        <AppRoutes />
      </Suspense>
      <ToastContainer />
    </ErrorBoundary>
  )
}

export default App
