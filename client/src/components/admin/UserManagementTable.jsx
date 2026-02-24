import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export function UserManagementTable({ users, onSuspend, onDelete }) {
  return (
    <Card>
      <h3 className="mb-3 text-lg font-semibold text-slate-900">User Management</h3>
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="pb-2 pr-4">Name</th>
              <th className="pb-2 pr-4">Email</th>
              <th className="pb-2 pr-4">Status</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-slate-100">
                <td className="py-2 pr-4 text-slate-700">{user.name}</td>
                <td className="py-2 pr-4 text-slate-600">{user.email}</td>
                <td className="py-2 pr-4">
                  <Badge label={user.status} />
                </td>
                <td className="py-2">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={() => onSuspend(user.id)}>
                      Suspend
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => onDelete(user.id)}>
                      Delete
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
