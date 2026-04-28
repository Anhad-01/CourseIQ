import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BookMarked, BrainCircuit, LayoutDashboard, LogOut, Menu, Search, Settings, X } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'
import { useAuth } from '../../lib/AuthContext'

const navItems = [
  {
    to: '/',
    label: 'Search',
    icon: Search,
  },
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    to: '/recommendations',
    label: 'Recommendations',
    icon: BrainCircuit,
  },
  {
    to: '/saved',
    label: 'Saved',
    icon: BookMarked,
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: Settings,
  },
]

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-soft">
        <BrainCircuit className="size-5" />
      </div>
      <div>
        <p className="font-heading text-lg font-semibold leading-none text-foreground">
          CourseIQ
        </p>
        <p className="text-xs text-muted-foreground">
          Search, save, and discover smarter
        </p>
      </div>
    </Link>
  )
}

function NavItem({ item, mobile = false, onClick }) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all',
          mobile
            ? 'w-full justify-start rounded-2xl px-4 py-3'
            : 'border-transparent',
          isActive
            ? 'border-primary/20 bg-primary/10 text-primary'
            : 'text-muted-foreground hover:border-border hover:bg-white/80 hover:text-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn(
              'size-4 transition-transform group-hover:scale-110',
              isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
            )}
          />
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    setMobileOpen(false)
    navigate('/login')
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="section-shell py-4">
          <div className="glass-panel flex items-center justify-between px-4 py-3 sm:px-6">
            <Brand />

            <nav className="hidden items-center gap-2 lg:flex">
              {navItems.map((item) => (
                <NavItem key={item.to} item={item} />
              ))}
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {user?.full_name || 'Learner'}
                </p>
              </div>

              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 size-4" />
                Logout
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen((value) => !value)}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {mobileOpen ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="overflow-hidden border-t border-border/60 bg-background/95 lg:hidden"
            >
              <div className="section-shell py-4">
                <div className="glass-panel space-y-4 p-4">
                 <div className="rounded-2xl bg-muted/70 p-4">
                   <p className="text-sm font-medium text-foreground">
                     {user?.full_name || 'Learner'}
                   </p>
                 </div>

                  <nav className="grid gap-2">
                    {navItems.map((item) => (
                      <NavItem
                        key={item.to}
                        item={item}
                        mobile
                        onClick={() => setMobileOpen(false)}
                      />
                    ))}
                  </nav>

                  <Button
                    variant="outline"
                    className="w-full justify-center"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 size-4" />
                    Logout
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>

      <main>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  )
}
