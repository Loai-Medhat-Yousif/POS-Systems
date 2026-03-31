import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

import Layout            from "./components/Layout";
import SalesInterface    from "./components/SalesInterface";
import ProductManagement from "./components/ProductManagement";
import PurchaseInvoices  from "./components/PurchaseInvoices";
import ReportsSection    from "./components/ReportsSection";
import SalesInvoices     from "./components/SalesInvoices";
import NotFound          from "./pages/NotFound";
import SettingsSection from "./components/SettingsSection";
import LoginPage         from "./components/Loginpage";
import AuthService       from "./services/AuthService";

const queryClient = new QueryClient();

// Protected Route wrapper - redirects to login if not authenticated
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  useEffect(() => {
    setIsAuth(AuthService.isAuthenticated());
  }, []);

  // Show nothing while checking auth status
  if (isAuth === null) {
    return null;
  }

  // Redirect to login if not authenticated
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => AuthService.isAuthenticated());

  useEffect(() => {
    // Re-check authentication status when it might have changed
    setIsAuthenticated(AuthService.isAuthenticated());
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            {/* Login page - accessible without authentication */}
            <Route 
              path="/login" 
              element={
                isAuthenticated ? <Navigate to="/" replace /> : 
                <LoginPage onLogin={() => setIsAuthenticated(true)} />
              } 
            />

            {/* Protected routes - require authentication */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<SalesInterface />} />
              <Route path="products" element={<ProductManagement />} />
              <Route path="pos" element={<PurchaseInvoices />} />
              <Route path="reports" element={<ReportsSection />} />
              <Route path="sales" element={<SalesInvoices />} />
              <Route path="settings" element={<SettingsSection />} />
            </Route>

            {/* 404 — redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;