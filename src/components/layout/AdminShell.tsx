import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Star, CreditCard,
  Sparkles, Settings, LogOut, Shield, Bell,
} from 'lucide-react';
import { useAdminAuthStore } from '../../stores/auth.store';
import type { ReactNode } from 'react';

const NAV = [
  { label: 'Dashboard',     icon: LayoutDashboard, path: '/' },
  { label: 'Users',         icon: Users,           path: '/users' },
  { label: 'Astrologers',   icon: Star,            path: '/astrologers' },
  { label: 'Subscriptions', icon: CreditCard,      path: '/subscriptions' },
  { label: 'AI Usage',       icon: Sparkles,  path: '/ai-usage' },
  { label: 'Notifications',  icon: Bell,      path: '/notifications' },
  { label: 'Settings',       icon: Settings,  path: '/settings' },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const { logout, user } = useAdminAuthStore();
  return (
    <div className="flex h-screen bg-cosmic-gradient bg-grid overflow-hidden">
      <aside className="w-60 flex flex-col bg-cosmic-900/80 backdrop-blur-xl border-r border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl bg-red-600/80 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-white text-sm">ASTRO Admin</p>
            <p className="text-white/30 text-[10px]">Control Panel</p>
          </div>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {NAV.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'text-white bg-red-600/20 border border-red-500/30'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-7 h-7 rounded-lg bg-red-600/20 flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <p className="text-white/60 text-xs flex-1 truncate">{user?.name ?? 'Admin'}</p>
            <button onClick={logout} className="text-white/30 hover:text-red-400 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
