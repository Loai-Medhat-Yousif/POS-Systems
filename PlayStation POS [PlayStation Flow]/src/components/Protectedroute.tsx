// ─────────────────────────────────────────────
//  ProtectedRoute.tsx
//  Guards any route — redirects to /login if not authenticated.
//  Saves the attempted URL and restores it after login.
// ─────────────────────────────────────────────

import React, { type ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import AuthService from "../services/AuthService";

interface Props {
  children: ReactElement;
  redirectTo?: string; // default: "/login"
}

/**
 * Usage inside your <Routes>:
 *
 *   <Route
 *     path="/dashboard"
 *     element={
 *       <ProtectedRoute>
 *         <Dashboard />
 *       </ProtectedRoute>
 *     }
 *   />
 */
const ProtectedRoute: React.FC<Props> = ({ children, redirectTo = "/login" }) => {
  const location = useLocation();

  if (!AuthService.isAuthenticated()) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;