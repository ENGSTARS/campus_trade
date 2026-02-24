import { Card } from '@/components/ui/Card'

export function StatsCards({ stats }) {
  const items = [
    { key: 'totalUsers', label: 'Total Users' },
    { key: 'activeListings', label: 'Active Listings' },
    { key: 'reportsOpen', label: 'Open Reports' },
    { key: 'ordersToday', label: 'Orders Today' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.key} className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
          <p className="text-2xl font-bold text-slate-900">{stats?.[item.key] ?? 0}</p>
        </Card>
      ))}
    </div>
  )
}
