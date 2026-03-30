import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Truck, Package, FileText, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export function Layout() {
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const navItems = [
    { name: t('nav.dashboard'), href: '/', icon: LayoutDashboard },
    { name: t('nav.orders'), href: '/orders', icon: Package },
    { name: t('nav.drivers'), href: '/drivers', icon: Truck },
    { name: t('nav.reports'), href: '/reports', icon: FileText },
  ];

  const handleLogout = () => {
    localStorage.removeItem('fleet_flow_auth');
    window.location.href = '/#/login';
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1F3B61] text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight">Fleet Flow</h1>
          <p className="text-slate-300 text-sm mt-1">{t('app.subtitle')}</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  isActive 
                    ? "bg-white/10 text-white font-medium" 
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-3 px-3 py-2 w-full text-left text-slate-300 hover:bg-white/5 hover:text-white rounded-md transition-colors"
          >
            <span className="w-5 h-5 flex items-center justify-center font-bold text-xs border border-current rounded">
              {i18n.language === 'ar' ? 'EN' : 'ع'}
            </span>
            {i18n.language === 'ar' ? 'English' : 'العربية'}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full text-left text-slate-300 hover:bg-white/5 hover:text-white rounded-md transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
