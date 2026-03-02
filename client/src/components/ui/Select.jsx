import { cn } from '@/utils/cn'

export function Select({ label, options = [], error, className, ...props }) {
  return (
    <label className="flex w-full flex-col gap-1.5 text-sm text-slate-700">
      {label ? <span className="font-medium">{label}</span> : null}
      <select className={cn('input-base bg-white', error ? 'border-rose-400 focus:ring-rose-100' : '', className)} {...props}>
        {options.map((option) => {
          if (typeof option === 'string') {
            return (
              <option key={option} value={option}>
                {option}
              </option>
            )
          }

          return (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          )
        })}
      </select>
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </label>
  )
}
