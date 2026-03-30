import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import DevicesManager from './components/DevicesManager';
import InventoryManager from './components/InventoryManager';
import Reports from './components/Reports';
import SettingsModal from './components/SettingsModal';
import LoginPage from './components/Loginpage';
import ProtectedRoute from './components/Protectedroute';

export default function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const theme = useStore((state) => state.theme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <div dir="rtl">
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — all app routes live inside this layout */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout isSettingsOpen={isSettingsOpen} setIsSettingsOpen={setIsSettingsOpen} />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

// ── Inner layout (only rendered when authenticated) ───────────────────────────
interface AppLayoutProps {
  isSettingsOpen: boolean;
  setIsSettingsOpen: (v: boolean) => void;
}

function AppLayout({ isSettingsOpen, setIsSettingsOpen }: AppLayoutProps) {
  return (
    <>
      <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans overflow-hidden selection:bg-blue-500/30 transition-colors duration-300">
        <Sidebar onSettingsClick={() => setIsSettingsOpen(true)} />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/"          element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/devices"   element={<DevicesManager />} />
              <Route path="/inventory" element={<InventoryManager />} />
              <Route path="/reports"   element={<Reports />} />
              <Route path="*"          element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </main>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}