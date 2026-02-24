import { Button } from './Button'

export function ErrorState({ title = 'Something went wrong', description, onRetry }) {
  return (
    <div className="card-surface flex flex-col items-start gap-3 p-5">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-600">{description || 'Please try again in a moment.'}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  )
}
