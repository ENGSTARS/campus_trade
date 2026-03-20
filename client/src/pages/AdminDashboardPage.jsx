import { useEffect, useState } from 'react'
import { adminApi } from '@/api/adminApi'
import { useNotifications } from '@/context/NotificationContext'
import { useAuth } from '@/context/AuthContext'
import { StatsCards } from '@/components/admin/StatsCards'
import { ReportsTable } from '@/components/admin/ReportsTable'
import { UserManagementTable } from '@/components/admin/UserManagementTable'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'

function AdminDashboardPage() {
  const { addToast } = useNotifications()
  const { user: currentUser } = useAuth()
  const [stats, setStats] = useState(null)
  const [reports, setReports] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadAdminData() {
      setLoading(true)
      setError('')
      try {
        const [statsData, reportsData, usersData] = await Promise.all([
          adminApi.getStats(),
          adminApi.getReports(),
          adminApi.getUsers(),
        ])
        setStats(statsData)
        setReports(reportsData?.items || [])
        setUsers(usersData?.items || [])
      } catch {
        setError('Could not load admin dashboard')
      } finally {
        setLoading(false)
      }
    }
    loadAdminData()
  }, [])

  const suspendUser = async (userId) => {
    await adminApi.suspendUser(userId)
    setUsers((previous) =>
      previous.map((user) => (user.id === userId ? { ...user, status: 'Suspended' } : user)),
    )
    addToast({ type: 'info', message: 'User suspended' })
  }

  const deleteUser = async (userId) => {
    await adminApi.deleteUser(userId)
    setUsers((previous) => previous.filter((user) => user.id !== userId))
    addToast({ type: 'success', message: 'User deleted' })
  }

  const updateReportStatus = async (reportId, status) => {
    await adminApi.updateReportStatus(reportId, status)
    setReports((previous) =>
      previous.map((report) => (report.id === reportId ? { ...report, status } : report)),
    )
    if (status === 'Resolved' || status === 'Dismissed') {
      setStats((previous) =>
        previous
          ? { ...previous, reportsOpen: Math.max(0, Number(previous.reportsOpen || 0) - 1) }
          : previous,
      )
    }
    addToast({ type: 'success', message: `Report ${status.toLowerCase()}` })
  }

  if (loading) return <Skeleton className="h-72 w-full" />
  if (error) return <ErrorState title="Admin dashboard unavailable" description={error} />

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
      <StatsCards stats={stats} />
      <Card>
        <h3 className="mb-3 text-lg font-semibold text-slate-900">Current Admin Account</h3>
        <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          <p><span className="font-semibold">Email:</span> {currentUser?.email || 'Unknown'}</p>
          <p><span className="font-semibold">Name:</span> {currentUser?.fullName || 'Admin User'}</p>
          <p><span className="font-semibold">Role:</span> {currentUser?.role || 'admin'}</p>
          <p><span className="font-semibold">Status:</span> Active Admin</p>
        </div>
      </Card>
      <Card>
        <h3 className="mb-3 text-lg font-semibold text-slate-900">Inventory Snapshot</h3>
        <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Units Being Tracked</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats?.totalInventoryUnits ?? 0}</p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
            <p className="text-xs uppercase tracking-wide text-amber-700">Low Stock Listings</p>
            <p className="mt-1 text-2xl font-bold text-amber-900">{stats?.lowStockListings ?? 0}</p>
          </div>
          <div className="rounded-xl border border-rose-100 bg-rose-50 p-3">
            <p className="text-xs uppercase tracking-wide text-rose-700">Sold Out Listings</p>
            <p className="mt-1 text-2xl font-bold text-rose-900">{stats?.soldOutListings ?? 0}</p>
          </div>
        </div>
      </Card>
      <ReportsTable
        reports={reports}
        onResolve={(reportId) => updateReportStatus(reportId, 'Resolved')}
        onDismiss={(reportId) => updateReportStatus(reportId, 'Dismissed')}
      />
      <UserManagementTable users={users} onSuspend={suspendUser} onDelete={deleteUser} />
    </div>
  )
}

export default AdminDashboardPage
