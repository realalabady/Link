import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, CheckCircle, CreditCard, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const adminNavItems = [
  { path: '/admin', labelKey: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { path: '/admin/users', labelKey: 'Users', icon: <Users className="h-5 w-5" /> },
  { path: '/admin/verifications', labelKey: 'Verifications', icon: <CheckCircle className="h-5 w-5" /> },
  { path: '/admin/payouts', labelKey: 'Payouts', icon: <CreditCard className="h-5 w-5" /> },
];

export const AdminLayout: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-e border-border bg-sidebar">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-sidebar-border p-4">
            <h1 className="text-xl font-bold text-sidebar-foreground">
              {t('common.appName')} Admin
            </h1>
            <LanguageSwitcher />
          </div>
          <nav className="flex-1 space-y-1 p-4">
            {adminNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )
                }
              >
                {item.icon}
                <span>{item.labelKey}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="ms-64 flex-1">
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
