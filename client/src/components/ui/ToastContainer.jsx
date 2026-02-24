import { AnimatePresence, motion } from 'framer-motion'
import { useNotifications } from '@/context/NotificationContext'

export function ToastContainer() {
  const { toasts, removeToast } = useNotifications()

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[320px] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="pointer-events-auto card-surface flex items-start justify-between gap-3 p-3"
          >
            <p className="text-sm text-slate-700">{toast.message}</p>
            <button className="text-xs text-slate-500" onClick={() => removeToast(toast.id)}>
              Dismiss
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
