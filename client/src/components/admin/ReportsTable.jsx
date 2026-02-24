import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/utils/formatters'

export function ReportsTable({ reports, onResolve, onDismiss }) {
  return (
    <Card>
      <h3 className="mb-3 text-lg font-semibold text-slate-900">Reports</h3>
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="pb-2 pr-4">Listing</th>
              <th className="pb-2 pr-4">Reason</th>
              <th className="pb-2 pr-4">Reported By</th>
              <th className="pb-2 pr-4">Date</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} className="border-t border-slate-100">
                <td className="py-2 pr-4 text-slate-700">{report.listingTitle}</td>
                <td className="py-2 pr-4 text-slate-700">{report.reason}</td>
                <td className="py-2 pr-4 text-slate-600">{report.reportedBy}</td>
                <td className="py-2 pr-4 text-slate-500">{formatDate(report.createdAt)}</td>
                <td className="py-2">
                  <Badge label={report.status} />
                </td>
                <td className="py-2">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onResolve?.(report.id)}
                      disabled={report.status === 'Resolved' || report.status === 'Dismissed'}
                    >
                      Resolve
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDismiss?.(report.id)}
                      disabled={report.status === 'Resolved' || report.status === 'Dismissed'}
                    >
                      Dismiss
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
