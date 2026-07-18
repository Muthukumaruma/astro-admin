import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, Users, Star, CreditCard,
  Sparkles, Settings, LogOut, Shield, Bell, Layers, Megaphone, Menu, X, BookOpen, UserCog, ArrowUpDown,
  Camera, ArrowUpCircle, Wrench, LogIn, Gift,
} from 'lucide-react';
import { useAdminAuthStore } from '../../stores/auth.store';
import type { ReactNode } from 'react';

type NavItem = { label: string; icon: React.ElementType; path: string; permission: string };
type NavSection = { section: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard',     icon: LayoutDashboard, path: '/',            permission: 'dashboard' },
    ],
  },
  {
    section: 'Users & Revenue',
    items: [
      { label: 'Users',         icon: Users,           path: '/users',       permission: 'users' },
      { label: 'Astrologers',   icon: Star,            path: '/astrologers', permission: 'astrologers' },
      { label: 'Plans',         icon: Layers,          path: '/plans',       permission: 'plans' },
      { label: 'Subscriptions', icon: CreditCard,      path: '/subscriptions', permission: 'subscriptions' },
      { label: 'Payments',      icon: CreditCard,      path: '/payments',    permission: 'payments' },
      { label: 'AI Usage',      icon: Sparkles,        path: '/ai-usage',    permission: 'ai-usage' },
    ],
  },
  {
    section: 'Content',
    items: [
      { label: 'Jothisham Knowledge', icon: BookOpen, path: '/jothisham-knowledge', permission: 'jothisham' },
      { label: 'Books — Categories',  icon: Layers,   path: '/cms/books/categories', permission: 'cms' },
      { label: 'Books — Content',     icon: BookOpen, path: '/cms/books/content',    permission: 'cms' },
      { label: 'Books — Priority',    icon: ArrowUpDown, path: '/cms/books/content/priority', permission: 'cms' },
      { label: 'Books — Settings',    icon: Settings, path: '/cms/books/settings',   permission: 'cms' },
    ],
  },
  {
    section: 'Engagement',
    items: [
      { label: 'Notifications', icon: Bell,      path: '/notifications', permission: 'notifications' },
      { label: 'Promo Modals',  icon: Megaphone, path: '/promos',        permission: 'promos' },
    ],
  },
  {
    section: 'Settings',
    items: [
      { label: 'Screenshot Security', icon: Camera,        path: '/settings/security',     permission: 'settings' },
      { label: 'Force Update',        icon: ArrowUpCircle,  path: '/settings/force-update', permission: 'settings' },
      { label: 'Maintenance Mode',    icon: Wrench,         path: '/settings/maintenance',  permission: 'settings' },
      { label: 'Jothisham AI',        icon: Sparkles,       path: '/settings/ai',           permission: 'settings' },
      { label: 'Guest Access',        icon: LogIn,          path: '/settings/guest-access', permission: 'settings' },
      { label: 'Referral Program',    icon: Gift,           path: '/settings/referral',     permission: 'settings' },
    ],
  },
  {
    section: 'Admin',
    items: [
      { label: 'Admins', icon: UserCog, path: '/admins', permission: 'admins' },
    ],
  },
];

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const { logout, user } = useAdminAuthStore();
  const permissions = user?.permissions;

  const visibleSections = NAV_SECTIONS.map(sec => ({
    ...sec,
    items: permissions
      ? sec.items.filter(item => permissions.includes(item.permission))
      : sec.items,
  })).filter(sec => sec.items.length > 0);

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-red-600/80 flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-sm">ASTRO Admin</p>
          <p className="text-white/30 text-[10px]">Control Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto space-y-4">
        {visibleSections.map(sec => (
          <div key={sec.section}>
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/20">
              {sec.section}
            </p>
            <div className="space-y-0.5">
              {sec.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onNavClick}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'text-white bg-red-600/20 border border-red-500/30'
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-lg bg-red-600/20 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <p className="text-white/60 text-xs flex-1 truncate">{user?.name ?? 'Admin'}</p>
          <button onClick={logout} className="text-white/30 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#04030E] overflow-hidden">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-60 flex-col bg-white/[0.03] backdrop-blur-xl border-r border-white/5 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer panel ── */}
      <aside className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-[#0d0b1e] border-r border-white/10
        flex flex-col transform transition-transform duration-300 md:hidden
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-600/80 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <p className="font-bold text-white text-sm">ASTRO Admin</p>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <SidebarContent onNavClick={() => setMobileOpen(false)} />
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-white/[0.03] flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-red-600/80 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="font-bold text-white text-sm">ASTRO Admin</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
