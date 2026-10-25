import React from 'react';
import { Navigate, useLocation, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '@saksham/shared';
import { ShieldAlert } from 'lucide-react';
import { CouncilEmblem } from './GovtEmblem';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { currentUser, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 1. Loading state while verifying authoritative server-side session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 selection:bg-gov-navy-800 selection:text-white">
        <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center space-y-4">
          <div className="flex justify-center">
            <CouncilEmblem size={56} />
          </div>
          <div className="flex items-center justify-center space-x-2 text-gov-navy-900 font-bold text-sm">
            <svg className="w-5 h-5 animate-spin text-gov-navy-700" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Verifying Officer Digital Credentials...</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Contacting PRAVAH authoritative server-side identity provider.
          </p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: Redirect to login
  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Role authorization check
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow-md border border-rose-200 space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Statutory Jurisdiction & RBAC Restriction
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your authenticated role (<strong>{currentUser.role.replace(/_/g, ' ')}</strong>) is not authorized to access this module under AICTE approval regulations.
          </p>
          <div className="bg-slate-50 p-3 rounded text-[11px] font-mono text-slate-700 border border-slate-200 text-left">
            <div>Authorized Roles: <strong>{allowedRoles.join(', ')}</strong></div>
            <div>Current Officer: <strong>{currentUser.fullName} ({currentUser.username})</strong></div>
            <div>Jurisdiction: <strong>{currentUser.region || 'National Pool'}</strong></div>
          </div>
          <div className="pt-2">
            <Link
              to={currentUser.role === 'INSTITUTION_USER' ? '/institution/dashboard' : '/dashboard'}
              className="inline-flex items-center px-4 py-2 rounded-md bg-gov-navy-900 text-white text-xs font-semibold hover:bg-gov-navy-800 transition"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Return to {currentUser.role === 'INSTITUTION_USER' ? 'Institution Dashboard' : 'Executive Dashboard'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};
