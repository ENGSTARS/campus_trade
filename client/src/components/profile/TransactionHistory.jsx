import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { formatDate, formatPrice } from '@/utils/formatters'

export function TransactionHistory({ items, onReview, title = 'Transaction History' }) {
  return (
    <Card>
      <h3 className="mb-3 text-lg font-semibold text-slate-900">{title}</h3>
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="pb-2 pr-4">Item</th>
              <th className="pb-2 pr-4">Amount</th>
              <th className="pb-2 pr-4">Status</th>
              <th className="pb-2">Date</th>
              <th className="pb-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-sm text-slate-500">
                  No records found.
                </td>
              </tr>
            ) : null}
            {items.map((transaction) => (
              <tr key={transaction.id} className="border-t border-slate-100">
                <td className="py-2 pr-4 text-slate-700">{transaction.item}</td>
                <td className="py-2 pr-4 text-slate-700">{formatPrice(transaction.amount)}</td>
                <td className="py-2 pr-4">
                  <Badge label={transaction.status} />
                </td>
                <td className="py-2 text-slate-500">{formatDate(transaction.date)}</td>
                <td className="py-2">
                  {transaction.status === 'Completed' && onReview ? (
                    <Button variant="secondary" size="sm" onClick={() => onReview(transaction)}>
                      Review
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
