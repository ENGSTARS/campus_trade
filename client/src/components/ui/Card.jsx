import { cn } from '@/utils/cn'

export function Card({ children, className }) {
  return <section className={cn('card-surface p-4 sm:p-5', className)}>{children}</section>
}
