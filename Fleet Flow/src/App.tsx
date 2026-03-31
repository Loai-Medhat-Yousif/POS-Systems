/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { Layout } from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Drivers from '@/pages/Drivers';
import Orders from '@/pages/Orders';
import Reports from '@/pages/Reports';
import AuthService from '@/services/AuthService';
import '@/i18n';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  if (!AuthService.isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="drivers" element={
            <ProtectedRoute>
              <Drivers />
            </ProtectedRoute>
          } />
          <Route path="orders" element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          } />
          <Route path="reports" element={<ProtectedRoute>
            <Reports />
            </ProtectedRoute>} />
        </Route>
      </Routes>
      <Toaster position="top-center" />
    </HashRouter>
  );
}