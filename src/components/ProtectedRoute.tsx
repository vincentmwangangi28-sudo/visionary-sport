import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, checking: adminChecking } = useAdmin();
  const location = useLocation();

  if (authLoading || (adminOnly && adminChecking)) {
    return (
      <main id="main-content" className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" role="status" aria-label="Loading account session" />
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Strict enforcement: Vincent Mwangangi is the only administrator
  if (adminOnly && !isAdmin) {
    return <Navigate to="/auth" state={{ from: location, unauthorized: true }} replace />;
  }

  return <>{children}</>;
};
