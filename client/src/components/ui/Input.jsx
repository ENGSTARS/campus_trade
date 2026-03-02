import { cn } from '@/utils/cn'

export function Input({ label, error, className, ...props }) {
  return (
    <label className="flex w-full flex-col gap-1.5 text-sm text-slate-700">
      {label ? <span className="font-medium">{label}</span> : null}
      <input className={cn('input-base', error ? 'border-rose-400 focus:ring-rose-100' : '', className)} {...props} />
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </label>
  )
}
