import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Briefcase,
  BookOpen,
  Lightbulb,
  GraduationCap,
  BarChart3,
  TrendingUp,
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/positions', label: 'Positions', icon: Briefcase },
  { path: '/journal', label: 'Trade Journal', icon: BookOpen },
  { path: '/strategies', label: 'Strategy Lab', icon: Lightbulb },
  { path: '/education', label: 'Learn Options', icon: GraduationCap },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function Sidebar() {
  return (
    <aside className="w-64 bg-dark-card border-r border-dark-border flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-dark-border">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-lg font-bold text-white">Options Trader</h1>
            <p className="text-xs text-gray-400">Paper Trading: $10,000</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-400 hover:text-white hover:bg-dark-border'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Quick Stats */}
      <div className="p-4 border-t border-dark-border">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Daily P&L</span>
            <span className="text-profit">+$124.50</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Open Positions</span>
            <span className="text-white">5</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Daily Theta</span>
            <span className="text-profit">+$18.42</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
