import { Button } from './Button'

export function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="card-surface flex flex-col items-center gap-3 p-8 text-center">
      <div className="rounded-full bg-brand-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-brand-700">
        Empty
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="max-w-md text-sm text-slate-600">{description}</p>
      {actionLabel && onAction ? (
        <Button variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
