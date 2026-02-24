import { cn } from '@/utils/cn'

const colorMap = {
  New: 'bg-brand-100 text-brand-700',
  'Like New': 'bg-violet-100 text-violet-700',
  Good: 'bg-cyan-100 text-cyan-700',
  Fair: 'bg-amber-100 text-amber-700',
  Used: 'bg-indigo-100 text-indigo-700',
  NEW: 'bg-brand-100 text-brand-700',
  SECOND_HAND: 'bg-indigo-100 text-indigo-700',
  AVAILABLE: 'bg-emerald-100 text-emerald-700',
  RESERVED: 'bg-amber-100 text-amber-700',
  SOLD: 'bg-slate-200 text-slate-700',
  'Your Listing': 'bg-brand-100 text-brand-700',
  Completed: 'bg-emerald-100 text-emerald-700',
  Open: 'bg-rose-100 text-rose-700',
  Investigating: 'bg-amber-100 text-amber-700',
  Resolved: 'bg-emerald-100 text-emerald-700',
  Dismissed: 'bg-slate-200 text-slate-700',
  Active: 'bg-emerald-100 text-emerald-700',
  Suspended: 'bg-slate-200 text-slate-700',
}

export function Badge({ label, className }) {
  return <span className={cn('badge-base', colorMap[label] || 'bg-slate-100 text-slate-700', className)}>{label}</span>
}
