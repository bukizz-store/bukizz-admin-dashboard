import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Loader2 } from "lucide-react";

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
    return <Navigate to={redirectTo} state={{ unauthorized: true, from: location }} replace />;
  }

  if (anyPermissions && anyPermissions.length > 0 && !hasAnyPermission(anyPermissions)) {
    return <Navigate to={redirectTo} state={{ unauthorized: true, from: location }} replace />;
  }

  if (allPermissions && allPermissions.length > 0 && !hasAllPermissions(allPermissions)) {
    return <Navigate to={redirectTo} state={{ unauthorized: true, from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
