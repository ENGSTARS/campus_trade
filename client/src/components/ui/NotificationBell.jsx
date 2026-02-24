import { useMemo, useState } from 'react'
import { formatDate } from '@/utils/formatters'
import { useNotifications } from '@/context/NotificationContext'
import { Button } from './Button'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications()

  const topNotifications = useMemo(() => notifications.slice(0, 6), [notifications])

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((previous) => !previous)}
        className="relative inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 shadow-sm transition hover:border-brand-200 hover:bg-brand-50 dark:border-[#2b386f] dark:bg-[#13204a] dark:text-slate-200 dark:hover:bg-[#1a2a5a]"
        aria-label="Notifications"
      >
        <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
        Alerts
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-xs font-semibold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="card-surface absolute right-0 z-40 mt-2 w-[330px] overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-[#2b386f]">
            <p className="font-semibold text-slate-900">Notifications</p>
            <Button variant="ghost" size="sm" onClick={markAllRead}>
              Mark all as read
            </Button>
          </div>
          <div className="max-h-80 overflow-auto">
            {topNotifications.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">No notifications yet</p>
            ) : (
              topNotifications.map((item) => (
                <button
                  key={item.id}
                  className="w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 dark:border-[#2b386f] dark:hover:bg-[#1b2b5d]"
                  onClick={() => markAsRead(item.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-800">{item.title}</p>
                    {!item.isRead ? <span className="mt-1 h-2 w-2 rounded-full bg-brand-500" /> : null}
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{item.body}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{formatDate(item.createdAt)}</p>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
