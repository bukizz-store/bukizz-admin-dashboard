import api from "./api";

/**
 * Access Control Service (RBAC & ABAC)
 * Communicates with backend /api/v1/admin/access endpoints.
 */

// ─── Platform Roles ──────────────────────────────────────────────────────────
export const getRolesAPI = async () => {
  const response = await api.get("/admin/access/roles");
  return response.data?.data || [];
};

export const getRoleByIdAPI = async (id) => {
  const response = await api.get(`/admin/access/roles/${id}`);
  return response.data?.data || null;
};

export const createRoleAPI = async ({ roleName, description, permissions }) => {
  const response = await api.post("/admin/access/roles", {
    roleName,
    description,
    permissions,
  });
  return response.data?.data;
};

export const updateRoleAPI = async (id, { roleName, description, permissions }) => {
  const response = await api.put(`/admin/access/roles/${id}`, {
    roleName,
    description,
    permissions,
  });
  return response.data?.data;
};

export const deleteRoleAPI = async (id) => {
  const response = await api.delete(`/admin/access/roles/${id}`);
  return response.data;
};

// ─── Platform Permissions Catalog ────────────────────────────────────────────
export const getPermissionsCatalogAPI = async () => {
  const response = await api.get("/admin/access/permissions");
  return response.data?.data || [];
};

export const getRolePermissionsAPI = async (roleId) => {
  const response = await api.get(`/admin/access/roles/${roleId}/permissions`);
  return response.data?.data || [];
};

export const updateRolePermissionsAPI = async (roleId, permissions) => {
  const response = await api.put(`/admin/access/roles/${roleId}/permissions`, {
    permissions,
  });
  return response.data?.data;
};

// ─── Admin Users Directory ──────────────────────────────────────────────────
export const getAdminUsersAPI = async ({
  page = 1,
  limit = 20,
  search = "",
  role = "all",
} = {}) => {
  const params = { page, limit };
  if (search) params.search = search;
  if (role && role !== "all") params.role = role;
  const response = await api.get("/admin/access/users", { params });
  return response.data?.data;
};

// ─── User Role Assignments ───────────────────────────────────────────────────
export const getUserAdminRolesAPI = async (userId) => {
  const response = await api.get(`/admin/access/users/${userId}/roles`);
  return response.data?.data || [];
};

export const assignUserRoleAPI = async (userId, roleId) => {
  const response = await api.post(`/admin/access/users/${userId}/roles`, {
    roleId,
  });
  return response.data?.data;
};

export const setUserRolesAPI = async (userId, roleIds) => {
  const response = await api.put(`/admin/access/users/${userId}/roles`, {
    roleIds,
  });
  return response.data?.data;
};

export const removeUserRoleAPI = async (userId, roleId) => {
  const response = await api.delete(`/admin/access/users/${userId}/roles/${roleId}`);
  return response.data;
};

// ─── User Scopes (ABAC) ──────────────────────────────────────────────────────
export const getUserScopesAPI = async (userId) => {
  const response = await api.get(`/admin/access/users/${userId}/scopes`);
  return response.data?.data || [];
};

export const assignUserScopeAPI = async (userId, { entityType, entityId }) => {
  const response = await api.post(`/admin/access/users/${userId}/scopes`, {
    entityType,
    entityId,
  });
  return response.data?.data;
};

export const removeUserScopeAPI = async (userId, scopeId) => {
  const response = await api.delete(`/admin/access/users/${userId}/scopes/${scopeId}`);
  return response.data;
};

// ─── Cache Management ────────────────────────────────────────────────────────
export const refreshRbacCacheAPI = async () => {
  const response = await api.post("/admin/access/cache/refresh");
  return response.data?.data;
};
