import { NavLink, Outlet } from 'react-router-dom'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import campusMark from '@/assets/campus-mark.svg'

export function MainLayout() {
  const { isAuthenticated, isAdmin, logout } = useAuth()
  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/messages', label: 'Messages' },
    { to: '/saved', label: 'Saved' },
    { to: '/profile', label: 'Profile' },
    { to: '/sell', label: 'Sell' },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin' }] : []),
  ]

  return (
    <div className="min-h-screen bg-campus-gradient dark:bg-campus-gradient-dark">
      <header className="sticky top-0 z-30 border-b border-brand-100/60 bg-white/80 backdrop-blur-xl dark:border-[#2b386f] dark:bg-[#0f1838]/85">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <NavLink to="/" className="font-display flex items-center gap-2 text-xl font-black tracking-tight text-brand-700 dark:text-brand-200">
            <img src={campusMark} alt="CampusTrade" className="h-8 w-8" />
            CampusTrade
          </NavLink>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-brand-100 text-brand-700 shadow-sm dark:bg-brand-900/50 dark:text-brand-200'
                      : 'text-slate-600 hover:bg-white hover:text-brand-700 dark:text-slate-300 dark:hover:bg-[#1a254f] dark:hover:text-brand-200'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
            {isAuthenticated ? (
              <Button variant="secondary" onClick={logout}>
                Logout
              </Button>
            ) : (
              <NavLink to="/login" className="btn-secondary">
                Login
              </NavLink>
            )}
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-3 md:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-brand-100 text-brand-700 shadow-sm dark:bg-brand-900/50 dark:text-brand-200'
                    : 'text-slate-600 hover:bg-white hover:text-brand-700 dark:text-slate-300 dark:hover:bg-[#1a254f] dark:hover:text-brand-200'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
