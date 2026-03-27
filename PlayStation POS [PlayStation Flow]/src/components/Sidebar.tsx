import { useNavigate, useLocation } from 'react-router-dom';
import { History, MonitorPlay, PackageOpen, Sliders, Sun, Moon, Zap } from 'lucide-react';
import { cn } from '../utils';
import { useStore } from '../store';

interface SidebarProps {
  onSettingsClick: () => void;
}

const navItems = [
  { path: '/dashboard', label: 'لوحة التحكم',    icon: Zap         },
  { path: '/devices',   label: 'إدارة الأجهزة',  icon: MonitorPlay },
  { path: '/inventory', label: 'المتجر والمخزن', icon: PackageOpen },
  { path: '/reports',   label: 'سجل التقارير',   icon: History     },
];

export default function Sidebar({ onSettingsClick }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useStore();

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-l border-blue-100 dark:border-slate-800 flex flex-col transition-colors duration-300 shadow-sm">

      {/* Logo */}
      <div className="p-6 border-b border-blue-100 dark:border-slate-800">
        <h1 className="text-2xl font-black text-blue-950 dark:text-white leading-tight">
          PlayStation Flow
        </h1>
        <p className="text-[10px] uppercase font-bold tracking-widest text-blue-500/80 dark:text-blue-400 mt-1">
          Management System
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-linear-to-r from-blue-500 to-purple-500 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-slate-200'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-4 border-t border-blue-100 dark:border-slate-800 space-y-2">
        <button
          onClick={onSettingsClick}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700"
        >
          <Sliders className="w-5 h-5" />
          <span className="font-medium">تعديل الإعدادات</span>
        </button>

        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700"
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-5 h-5" />
              <span className="font-medium">الوضع الليلي</span>
            </>
          ) : (
            <>
              <Sun className="w-5 h-5" />
              <span className="font-medium">الوضع النهاري</span>
            </>
          )}
        </button>
      </div>

    </aside>
  );
}