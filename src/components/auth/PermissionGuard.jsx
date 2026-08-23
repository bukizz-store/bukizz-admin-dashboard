import React from "react";
import { useAuth } from "../../context/AuthContext";

/**
 * PermissionGuard
 * Declarative component for conditional UI rendering based on RBAC permissions.
 *
 * @param {Object} props
 * @param {string} [props.permission] - Single required permission string (e.g. 'schools:manage')
 * @param {string[]} [props.anyPermissions] - Array of permissions where ANY match grants access
 * @param {string[]} [props.allPermissions] - Array of permissions where ALL must match to grant access
 * @param {React.ReactNode} [props.fallback=null] - Optional fallback component when access is denied
 * @param {React.ReactNode} props.children - Child elements to render if authorized
 */
const PermissionGuard = ({
  permission,
  anyPermissions,
  allPermissions,
  fallback = null,
  children,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  let isAllowed = true;

  if (permission) {
    isAllowed = isAllowed && hasPermission(permission);
  }

  if (anyPermissions && anyPermissions.length > 0) {
    isAllowed = isAllowed && hasAnyPermission(anyPermissions);
  }

  if (allPermissions && allPermissions.length > 0) {
    isAllowed = isAllowed && hasAllPermissions(allPermissions);
  }

  if (!isAllowed) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

export default PermissionGuard;
