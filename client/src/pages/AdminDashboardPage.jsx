import { useEffect, useState } from 'react'
import { adminApi } from '@/api/adminApi'
import { useNotifications } from '@/context/NotificationContext'
import { StatsCards } from '@/components/admin/StatsCards'
import { ReportsTable } from '@/components/admin/ReportsTable'
import { UserManagementTable } from '@/components/admin/UserManagementTable'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'

function AdminDashboardPage() {
  const { addToast } = useNotifications()
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
