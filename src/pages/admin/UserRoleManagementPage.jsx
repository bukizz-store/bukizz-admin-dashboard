import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Shield,
  Search,
  UserCheck,
  Filter,
  RefreshCw,
  Edit,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle,
  Users,
  X,
  Plus,
  Trash2,
  Globe,
  UserPlus,
  Layers,
  GraduationCap,
  Store,
} from "lucide-react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { DataTable, Pagination, StatusBadge } from "../../components/common";
import { Button, Select, Input } from "../../components/ui";
import PermissionGuard from "../../components/auth/PermissionGuard";
import {
  getRolesAPI,
  getAdminUsersAPI,
  setUserRolesAPI,
  getUserScopesAPI,
  assignUserScopeAPI,
  removeUserScopeAPI,
} from "../../services/accessControlService";

const ROLE_BADGE_STYLES = {
  superadmin: "bg-purple-100 text-purple-800 border-purple-200",
  manager: "bg-blue-100 text-blue-800 border-blue-200",
  support: "bg-teal-100 text-teal-800 border-teal-200",
  "settlement-manager": "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const DEFAULT_ROLE_STYLE = "bg-indigo-100 text-indigo-800 border-indigo-200";

const SCOPE_TYPE_ICONS = {
  ALL: Globe,
  SCHOOL: GraduationCap,
  CATEGORY: Layers,
  RETAILER: Store,
};

const SCOPE_TYPE_COLORS = {
  ALL: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SCHOOL: "bg-blue-50 text-blue-700 border-blue-200",
  CATEGORY: "bg-purple-50 text-purple-700 border-purple-200",
  RETAILER: "bg-amber-50 text-amber-700 border-amber-200",
};

const UserRoleManagementPage = () => {
  const toast = useToast();

  // Directory State
  const [users, setUsers] = useState([]);
  const [adminRoles, setAdminRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Manage Access Modal State
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState("rbac"); // "rbac" | "abac"
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // ABAC Scopes State for Selected User
  const [userScopes, setUserScopes] = useState([]);
  const [isLoadingScopes, setIsLoadingScopes] = useState(false);
  const [newScopeType, setNewScopeType] = useState("SCHOOL");
  const [newScopeEntityId, setNewScopeEntityId] = useState("");
  const [isAddingScope, setIsAddingScope] = useState(false);

  // Add Admin Staff Modal State
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const [staffSearchResults, setStaffSearchResults] = useState([]);
  const [isSearchingStaff, setIsSearchingStaff] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidateRoleId, setCandidateRoleId] = useState("");
  const [isGrantingAccess, setIsGrantingAccess] = useState(false);

  // Load administrative roles from admin_roles table
  const loadRoles = useCallback(async () => {
    try {
      const roles = await getRolesAPI();
      setAdminRoles(roles || []);
      if (roles && roles.length > 0 && !candidateRoleId) {
        setCandidateRoleId(roles[0].id);
      }
    } catch (err) {
      console.error("Failed to load admin roles:", err);
    }
  }, [candidateRoleId]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  // Available administrative role options for dropdowns
  const availableRoleOptions = useMemo(() => {
    return adminRoles.map((r) => ({
      value: r.id,
      roleName: r.role_name,
      label: `${r.role_name.charAt(0).toUpperCase() + r.role_name.slice(1).replace(/-/g, " ")}${
        r.description ? ` (${r.description.slice(0, 35)}...)` : ""
      }`,
    }));
  }, [adminRoles]);

  // Fetch admin users via dedicated /api/v1/admin/access/users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAdminUsersAPI({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery.trim(),
        role: roleFilter,
      });

      if (data) {
        const userList = data.users || [];
        setUsers(userList);
        const total = data.total ?? userList.length;
        const pages =
          data.totalPages ??
          data.pages ??
          Math.max(1, Math.ceil(total / itemsPerPage));
        setTotalUsers(total);
        setTotalPages(pages);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Failed to load admin users:", error);
      toast.error(error.response?.data?.message || "Failed to load admin users list");
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, searchQuery, roleFilter, toast]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [fetchUsers]);

  // Open Manage Access Modal for a staff member
  const handleOpenAccessModal = async (user) => {
    setSelectedUser(user);
    setActiveTab("rbac");

    // Pre-select primary role if exists
    if (user.roles && user.roles.length > 0) {
      setSelectedRoleId(user.roles[0].roleId || "");
    } else if (adminRoles.length > 0) {
      setSelectedRoleId(adminRoles[0].id);
    } else {
      setSelectedRoleId("");
    }

    // Load scopes
    setIsLoadingScopes(true);
    try {
      const scopes = await getUserScopesAPI(user.id);
      setUserScopes(scopes || []);
    } catch (err) {
      console.warn("Failed to load user scopes:", err);
      setUserScopes(user.scopes || []);
    } finally {
      setIsLoadingScopes(false);
    }

    setIsAccessModalOpen(true);
  };

  // Submit role update (admin_user_roles)
  const handleSaveRole = async () => {
    if (!selectedUser || !selectedRoleId) return;

    setIsUpdatingRole(true);
    try {
      await setUserRolesAPI(selectedUser.id, [selectedRoleId]);
      const matched = adminRoles.find((r) => r.id === selectedRoleId);
      toast.success(
        `Role updated to '${matched?.role_name || "Admin"}' for ${
          selectedUser.fullName || selectedUser.email
        }`
      );
      setIsAccessModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Failed to update user role:", error);
      toast.error(error.response?.data?.message || "Failed to update role");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // Revoke admin access completely (clears admin_user_roles & sets portal role to customer)
  const handleRevokeAdminAccess = async () => {
    if (!selectedUser) return;
    if (
      !window.confirm(
        `Revoke administrative access for ${
          selectedUser.fullName || selectedUser.email
        }? They will no longer be able to log into the admin dashboard.`
      )
    ) {
      return;
    }

    setIsUpdatingRole(true);
    try {
      await setUserRolesAPI(selectedUser.id, []);
      toast.success(
        `Administrative access revoked for ${
          selectedUser.fullName || selectedUser.email
        }`
      );
      setIsAccessModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Failed to revoke admin access:", error);
      toast.error(error.response?.data?.message || "Failed to revoke access");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // Add ABAC Scope constraint
  const handleAddScope = async () => {
    if (!selectedUser) return;
    if (newScopeType !== "ALL" && !newScopeEntityId.trim()) {
      toast.error(`Please provide an Entity ID for scope '${newScopeType}'`);
      return;
    }

    setIsAddingScope(true);
    try {
      await assignUserScopeAPI(selectedUser.id, {
        entityType: newScopeType,
        entityId: newScopeType === "ALL" ? null : newScopeEntityId.trim(),
      });
      toast.success(`Assigned ${newScopeType} scope`);
      setNewScopeEntityId("");
      const updatedScopes = await getUserScopesAPI(selectedUser.id);
      setUserScopes(updatedScopes || []);
      fetchUsers();
    } catch (error) {
      console.error("Failed to add scope:", error);
      toast.error(error.response?.data?.message || "Failed to add scope");
    } finally {
      setIsAddingScope(false);
    }
  };

  // Remove ABAC Scope constraint
  const handleRemoveScope = async (scopeId) => {
    if (!selectedUser) return;
    try {
      await removeUserScopeAPI(selectedUser.id, scopeId);
      toast.success("Scope removed successfully");
      setUserScopes((prev) => prev.filter((s) => s.id !== scopeId));
      fetchUsers();
    } catch (error) {
      console.error("Failed to remove scope:", error);
      toast.error(error.response?.data?.message || "Failed to remove scope");
    }
  };

  // Candidate staff search (debounced)
  useEffect(() => {
    if (!isAddStaffOpen) {
      setStaffSearchQuery("");
      setStaffSearchResults([]);
      setSelectedCandidate(null);
      return;
    }

    if (!staffSearchQuery.trim() || staffSearchQuery.trim().length < 2) {
      setStaffSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingStaff(true);
      try {
        const response = await api.get("/users/admin/search", {
          params: { search: staffSearchQuery.trim(), limit: 5 },
        });
        if (response.data?.success) {
          const list =
            response.data.data?.users ||
            response.data.data?.data ||
            (Array.isArray(response.data.data) ? response.data.data : []);
          setStaffSearchResults(list);
        }
      } catch (err) {
        console.error("Candidate search failed:", err);
      } finally {
        setIsSearchingStaff(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [staffSearchQuery, isAddStaffOpen]);

  // Grant admin role to a platform user
  const handleGrantAdminRole = async () => {
    if (!selectedCandidate || !candidateRoleId) {
      toast.error("Please select a candidate user and an admin role");
      return;
    }

    setIsGrantingAccess(true);
    try {
      await setUserRolesAPI(selectedCandidate.id, [candidateRoleId]);
      const matched = adminRoles.find((r) => r.id === candidateRoleId);
      toast.success(
        `Granted '${matched?.role_name || "Admin"}' role to ${
          selectedCandidate.fullName || selectedCandidate.email
        }`
      );
      setIsAddStaffOpen(false);
      setSelectedCandidate(null);
      setStaffSearchQuery("");
      fetchUsers();
    } catch (error) {
      console.error("Failed to grant admin role:", error);
      toast.error(error.response?.data?.message || "Failed to grant role");
    } finally {
      setIsGrantingAccess(false);
    }
  };

  // Selected role object in modal
  const activeRoleObj = useMemo(() => {
    return adminRoles.find((r) => r.id === selectedRoleId);
  }, [adminRoles, selectedRoleId]);

  // DataTable columns definition
  const columns = [
    {
      header: "Admin Staff Member",
      accessor: "user",
      render: (row) => {
        const displayName =
          row.fullName ||
          row.full_name ||
          (row.email ? row.email.split("@")[0] : "Unnamed User");
        const initial = (
          row.fullName ||
          row.full_name ||
          row.email ||
          "A"
        )
          .charAt(0)
          .toUpperCase();

        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-sm shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-900 text-sm truncate flex items-center gap-2">
                <span>{displayName}</span>
              </div>
              <div className="text-xs text-slate-500 truncate flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1">
                  <Mail size={12} className="text-slate-400" /> {row.email}
                </span>
                {row.phone && (
                  <span className="flex items-center gap-1">
                    • <Phone size={12} className="text-slate-400" /> {row.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: "Assigned Role (RBAC)",
      accessor: "roles",
      render: (row) => {
        const assigned = row.roles || [];
        if (assigned.length === 0) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <AlertCircle size={12} className="mr-1 text-amber-600" />
              Unassigned Role
            </span>
          );
        }

        return (
          <div className="flex flex-wrap gap-1.5">
            {assigned.map((r) => {
              const roleKey = String(r.roleName || "").toLowerCase();
              const badgeStyle = ROLE_BADGE_STYLES[roleKey] || DEFAULT_ROLE_STYLE;
              const formattedRole = roleKey
                .split(/[-_]/)
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ");

              return (
                <span
                  key={r.id || r.roleId || roleKey}
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle}`}
                  title={r.description || ""}
                >
                  <Shield size={12} className="mr-1 opacity-70" />
                  {formattedRole}
                </span>
              );
            })}
          </div>
        );
      },
    },
    {
      header: "Data Scopes (ABAC)",
      accessor: "scopes",
      render: (row) => {
        const scopes = row.scopes || [];
        if (scopes.length === 0) {
          return (
            <span className="text-xs text-slate-400 italic">
              Global Access (No Scopes)
            </span>
          );
        }

        return (
          <div className="flex flex-wrap gap-1">
            {scopes.map((scope) => {
              const IconComponent = SCOPE_TYPE_ICONS[scope.entityType] || Globe;
              const colorClass =
                SCOPE_TYPE_COLORS[scope.entityType] ||
                "bg-slate-100 text-slate-700 border-slate-200";

              return (
                <span
                  key={scope.id}
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${colorClass}`}
                >
                  <IconComponent size={11} className="mr-1 opacity-80" />
                  <span>{scope.entityType}</span>
                  {scope.entityId && (
                    <span className="ml-1 opacity-70 font-mono text-[10px]">
                      ({scope.entityId.slice(0, 6)}...)
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        );
      },
    },
    {
      header: "Status",
      accessor: "isActive",
      render: (row) => (
        <StatusBadge
          status={row.isActive ? "active" : "inactive"}
          customLabel={row.isActive ? "Active" : "Inactive"}
        />
      ),
    },
    {
      header: "Date Added",
      accessor: "createdAt",
      render: (row) => {
        const dateStr = row.createdAt;
        return (
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Calendar size={12} className="text-slate-400" />
            {dateStr ? new Date(dateStr).toLocaleDateString() : "—"}
          </span>
        );
      },
    },
    {
      header: <div className="text-right">Actions</div>,
      accessor: "actions",
      render: (row) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <PermissionGuard
            permission="users:manage"
            fallback={<span className="text-xs text-slate-400">View Only</span>}
          >
            <Button
              variant="outline"
              size="sm"
              icon={Edit}
              onClick={() => handleOpenAccessModal(row)}
              className="text-xs py-1 px-2.5 hover:border-bukizz-orange hover:text-bukizz-orange"
            >
              Manage Access
            </Button>
          </PermissionGuard>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-bukizz-bg min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-bukizz-navy">
              Admin Access Control
            </h1>
            <span className="bg-orange-100 text-bukizz-orange text-xs font-bold px-2.5 py-1 rounded-full">
              RBAC + ABAC
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage administrative staff roles (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded">admin_user_roles</code>) and entity scope restrictions (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded">admin_scopes</code>)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <PermissionGuard permission="users:manage">
            <Button
              variant="primary"
              size="sm"
              icon={UserPlus}
              onClick={() => setIsAddStaffOpen(true)}
            >
              Add Admin Staff
            </Button>
          </PermissionGuard>
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchUsers}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users size={24} />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Admin Staff
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {totalUsers.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Shield size={24} />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Configured Roles
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {adminRoles.length} Roles
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-50 text-green-600 flex items-center justify-center font-bold">
            <UserCheck size={24} />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Access Architecture
            </div>
            <div className="text-sm font-semibold text-emerald-700 mt-1 flex items-center gap-1">
              <CheckCircle size={14} /> Hybrid RBAC / ABAC Active
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search admin staff by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-9 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-bukizz-orange/30 focus:border-bukizz-orange bg-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100"
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-sm text-slate-500 shrink-0">
            <Filter size={16} className="text-slate-400" />
            <span>Filter Role:</span>
          </div>
          <div className="w-56">
            <Select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: "all", label: "All Admin Roles" },
                ...adminRoles.map((role) => ({
                  value: role.role_name,
                  label: role.role_name.charAt(0).toUpperCase() + role.role_name.slice(1).replace(/-/g, " "),
                })),
              ]}
              placeholder="All Admin Roles"
            />
          </div>
        </div>
      </div>

      {/* Admin Users DataTable */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={users}
          isLoading={isLoading}
          emptyMessage="No administrative staff members found."
        />

        {/* Pagination */}
        {!isLoading && users.length > 0 && (
          <div className="p-4 border-t border-slate-100">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={(limit) => {
                setItemsPerPage(limit);
                setCurrentPage(1);
              }}
              totalItems={totalUsers}
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MANAGE ACCESS MODAL (RBAC Role + ABAC Scopes)                             */}
      {/* ========================================================================= */}
      {isAccessModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-50 text-bukizz-orange flex items-center justify-center">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    Manage Staff Access
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure RBAC role tier and ABAC scope restrictions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAccessModalOpen(false);
                  setSelectedUser(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* User Details Summary */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <div className="text-sm font-semibold text-slate-800">
                {selectedUser.fullName || "Unnamed Staff Member"}
              </div>
              <div className="text-xs text-slate-500">{selectedUser.email}</div>
              <div className="text-xs text-slate-400 font-mono">
                User ID: {selectedUser.id}
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab("rbac")}
                className={`flex-1 py-2 text-xs font-semibold border-b-2 text-center transition-colors ${
                  activeTab === "rbac"
                    ? "border-bukizz-orange text-bukizz-orange"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                1. Role Assignment (RBAC)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("abac")}
                className={`flex-1 py-2 text-xs font-semibold border-b-2 text-center transition-colors ${
                  activeTab === "abac"
                    ? "border-bukizz-orange text-bukizz-orange"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                2. Entity Scopes (ABAC) ({userScopes.length})
              </button>
            </div>

            {/* TAB 1: RBAC ROLE ASSIGNMENT */}
            {activeTab === "rbac" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Select Administrative Role
                  </label>
                  <Select
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    options={availableRoleOptions}
                    placeholder="Select an admin role..."
                  />
                  {activeRoleObj?.description && (
                    <p className="text-xs text-slate-500 mt-1 italic">
                      {activeRoleObj.description}
                    </p>
                  )}
                </div>

                {/* High Privilege Warning */}
                {activeRoleObj?.role_name === "superadmin" && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-lg flex items-start gap-2">
                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                    <span>
                      <strong>Super Admin Warning:</strong> Super Administrator role bypasses all RBAC permission checks and grants unrestricted authority across catalog, orders, security, and financial settlements.
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleRevokeAdminAccess}
                    disabled={isUpdatingRole}
                  >
                    Revoke Admin Access
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAccessModalOpen(false)}
                      disabled={isUpdatingRole}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveRole}
                      isLoading={isUpdatingRole}
                    >
                      Save Role
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ABAC SCOPE RESTRICTIONS */}
            {activeTab === "abac" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Restrict this administrator's operations to specific schools, categories, or retailers. An <strong className="text-slate-700">ALL</strong> scope or no scopes grants global multi-tenant access.
                </p>

                {/* Existing Scopes List */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Current Scopes
                  </div>
                  {isLoadingScopes ? (
                    <div className="text-xs text-slate-400 py-3 text-center">Loading scopes...</div>
                  ) : userScopes.length === 0 ? (
                    <div className="text-xs text-slate-500 bg-slate-50 border border-dashed border-slate-200 p-3 rounded-lg text-center">
                      No restrictive scopes assigned. User has global access across all entities.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {userScopes.map((scope) => {
                        const IconComponent = SCOPE_TYPE_ICONS[scope.entity_type] || Globe;
                        return (
                          <div
                            key={scope.id}
                            className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="p-1 rounded bg-white border border-slate-200 text-slate-600">
                                <IconComponent size={14} />
                              </span>
                              <div>
                                <span className="font-semibold text-slate-800">
                                  {scope.entity_type}
                                </span>
                                {scope.entity_id ? (
                                  <span className="text-slate-500 font-mono ml-1.5 text-[11px]">
                                    ID: {scope.entity_id}
                                  </span>
                                ) : (
                                  <span className="text-emerald-600 font-medium ml-1.5">
                                    (All Entities)
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveScope(scope.id)}
                              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                              title="Delete scope"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Add Scope Form */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                  <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Add Scope Restriction
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Entity Type
                      </label>
                      <Select
                        value={newScopeType}
                        onChange={(e) => setNewScopeType(e.target.value)}
                        options={[
                          { value: "ALL", label: "ALL (Global Access)" },
                          { value: "SCHOOL", label: "SCHOOL" },
                          { value: "CATEGORY", label: "CATEGORY" },
                          { value: "RETAILER", label: "RETAILER" },
                        ]}
                      />
                    </div>
                    {newScopeType !== "ALL" && (
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          Entity UUID (Optional for all)
                        </label>
                        <Input
                          placeholder="e.g. school UUID"
                          value={newScopeEntityId}
                          onChange={(e) => setNewScopeEntityId(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Plus}
                      onClick={handleAddScope}
                      isLoading={isAddingScope}
                    >
                      Add Scope
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsAccessModalOpen(false);
                      setSelectedUser(null);
                    }}
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD ADMIN STAFF MODAL                                                     */}
      {/* ========================================================================= */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    Add Admin Staff
                  </h3>
                  <p className="text-xs text-slate-500">
                    Grant administrative role to an existing platform user
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStaffOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Candidate Search */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                1. Search User by Email or Phone
              </label>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Enter email or phone..."
                  value={staffSearchQuery}
                  onChange={(e) => setStaffSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bukizz-orange/30 focus:border-bukizz-orange bg-white"
                />
              </div>

              {/* Search Results */}
              {isSearchingStaff && (
                <div className="text-xs text-slate-400 py-2 text-center">Searching...</div>
              )}
              {staffSearchResults.length > 0 && !selectedCandidate && (
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-40 overflow-y-auto mt-2">
                  {staffSearchResults.map((candidate) => (
                    <div
                      key={candidate.id}
                      onClick={() => setSelectedCandidate(candidate)}
                      className="p-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-800">
                          {candidate.fullName || candidate.full_name || "Unnamed"}
                        </div>
                        <div className="text-slate-500">{candidate.email}</div>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase font-mono">
                        {candidate.role || "customer"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Candidate Card */}
              {selectedCandidate && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between mt-2">
                  <div>
                    <div className="text-xs font-semibold text-blue-900">
                      {selectedCandidate.fullName || selectedCandidate.full_name || "Unnamed"}
                    </div>
                    <div className="text-xs text-blue-700">{selectedCandidate.email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCandidate(null)}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            {/* Role Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                2. Assign Administrative Role
              </label>
              <Select
                value={candidateRoleId}
                onChange={(e) => setCandidateRoleId(e.target.value)}
                options={availableRoleOptions}
                placeholder="Select an admin role..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddStaffOpen(false)}
                disabled={isGrantingAccess}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGrantAdminRole}
                disabled={!selectedCandidate || !candidateRoleId}
                isLoading={isGrantingAccess}
              >
                Grant Admin Access
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRoleManagementPage;
