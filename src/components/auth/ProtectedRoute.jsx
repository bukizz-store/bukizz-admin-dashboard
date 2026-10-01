import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Loader2, ShieldAlert } from "lucide-react";

/**
 * ProtectedRoute
 * Route guard component handling authentication & RBAC permission evaluation.
 *
 * @param {Object} props
 * @param {string} [props.requiredPermission] - Optional single permission required to access route
 * @param {string[]} [props.anyPermissions] - Optional list of permissions (ANY grants access)
 * @param {string[]} [props.allPermissions] - Optional list of permissions (ALL required)
 * @param {string} [props.redirectTo="/"] - Fallback redirect path when unauthorized
 * @param {React.ReactNode} [props.children] - Optional custom child elements (defaults to <Outlet />)
 */
const ProtectedRoute = ({
  requiredPermission,
  anyPermissions,
  allPermissions,
  redirectTo = "/",
  children,
}) => {
  const {
    isAuthenticated,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-bukizz-orange animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Permission Checks
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4 my-12 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
          <ShieldAlert size={24} />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Access Restricted</h2>
        <p className="text-sm text-slate-500">
          Your assigned administrative role does not have permission to view this section (
          <code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono font-semibold text-slate-700">
            {requiredPermission}
          </code>
          ).
        </p>
      </div>
    );
  }

  if (anyPermissions && anyPermissions.length > 0 && !hasAnyPermission(anyPermissions)) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4 my-12 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
          <ShieldAlert size={24} />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Access Restricted</h2>
        <p className="text-sm text-slate-500">
          Your assigned administrative role does not have permission to access this resource.
        </p>
      </div>
    );
  }

  if (allPermissions && allPermissions.length > 0 && !hasAllPermissions(allPermissions)) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4 my-12 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
          <ShieldAlert size={24} />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Access Restricted</h2>
        <p className="text-sm text-slate-500">
          Your assigned administrative role does not have permission to access this resource.
        </p>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
