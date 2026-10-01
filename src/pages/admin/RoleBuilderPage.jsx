import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Shield,
  Plus,
  Search,
  Check,
  CheckSquare,
  Square,
  Edit2,
  Trash2,
  Copy,
  Info,
  Layers,
  Sparkles,
  Lock,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { Button, ConfirmationModal, Input, Tooltip } from "../../components/ui";
import PermissionGuard from "../../components/auth/PermissionGuard";
import {
  SYSTEM_PERMISSIONS_CATALOG,
  parseAndGroupPermissions,
  formatResourceName,
} from "../../utils/permissionParser";
import {
  getRolesAPI,
  getRolePermissionsAPI,
  createRoleAPI,
  updateRoleAPI,
  deleteRoleAPI,
  getPermissionsCatalogAPI,
  refreshRbacCacheAPI,
} from "../../services/accessControlService";

// Default initial roles for platform bootstrapping
const DEFAULT_ROLES = [
  {
    id: "superadmin",
    name: "Super Administrator",
    roleKey: "superadmin",
    description: "Root platform administrator with unrestricted access to all resources, configurations, and financial actions.",
    isSystem: true,
    permissions: SYSTEM_PERMISSIONS_CATALOG.map((p) => p.action_name),
  },
  {
    id: "manager",
    name: "Operations Manager",
    roleKey: "manager",
    description: "Operations manager with comprehensive catalog, order, school, and retailer management authority.",
    isSystem: true,
    permissions: SYSTEM_PERMISSIONS_CATALOG.map((p) => p.action_name).filter(
      (p) => !p.includes("export")
    ),
  },
  {
    id: "support",
    name: "Customer Support Specialist",
    roleKey: "support",
    description: "Support team member specialized in viewing orders, resolving queries, and tracking deliveries.",
    isSystem: true,
    permissions: [
      "orders:read",
      "support:queries:read",
      "support:queries:manage",
      "schools:read",
      "products:read",
      "delivery_partners:read",
    ],
  },
];

const RoleBuilderPage = () => {
  const toast = useToast();

  // Role list state
  const [roles, setRoles] = useState(DEFAULT_ROLES);
  const [isLoading, setIsLoading] = useState(true);
  const [catalog, setCatalog] = useState(SYSTEM_PERMISSIONS_CATALOG);
  const [searchQuery, setSearchQuery] = useState("");

  // Builder Modal State
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleName, setRoleName] = useState("");
  const [roleKey, setRoleKey] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState(new Set());
  const [activeCategory, setActiveCategory] = useState("all");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, role: null });

  // Parse and group all available permissions dynamically
  const groupedPermissions = useMemo(() => {
    return parseAndGroupPermissions(catalog);
  }, [catalog]);

  // Category Keys
  const categoryKeys = useMemo(() => {
    return Object.keys(groupedPermissions).sort();
  }, [groupedPermissions]);

  // Fetch roles & permissions catalog from backend
  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const [backendRoles, backendCatalog] = await Promise.all([
        getRolesAPI().catch(() => []),
        getPermissionsCatalogAPI().catch(() => []),
      ]);

      if (backendCatalog && backendCatalog.length > 0) {
        setCatalog(backendCatalog);
      }

      if (backendRoles && backendRoles.length > 0) {
        const enriched = await Promise.all(
          backendRoles.map(async (r) => {
            try {
              const perms = await getRolePermissionsAPI(r.id);
              const isBuiltIn = ["superadmin", "manager", "support"].includes(r.role_name);
              const displayName =
                r.role_name === "superadmin"
                  ? "Super Administrator"
                  : r.role_name === "manager"
                  ? "Operations Manager"
                  : r.role_name === "support"
                  ? "Customer Support Specialist"
                  : formatResourceName(r.role_name);

              return {
                id: r.id,
                name: displayName,
                roleKey: r.role_name,
                description: r.description || "Operational access role",
                isSystem: isBuiltIn,
                permissions: (perms || []).map((p) => p.action_name),
              };
            } catch {
              return {
                id: r.id,
                name: formatResourceName(r.role_name),
                roleKey: r.role_name,
                description: r.description || "",
                isSystem: ["superadmin", "manager", "support"].includes(r.role_name),
                permissions: [],
              };
            }
          })
        );
        setRoles(enriched);
      }
    } catch (err) {
      console.error("Failed to load roles from backend:", err);
      toast.error("Failed to load roles from server");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Open builder to create a new role
  const handleOpenCreate = () => {
    setEditingRole(null);
    setRoleName("");
    setRoleKey("");
    setRoleDescription("");
    setSelectedPermissions(new Set());
    setActiveCategory("all");
    setPermissionSearch("");
    setIsBuilderOpen(true);
  };

  // Open builder to edit existing role
  const handleOpenEdit = (role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleKey(role.roleKey || role.id);
    setRoleDescription(role.description || "");
    setSelectedPermissions(new Set(role.permissions || []));
    setActiveCategory("all");
    setPermissionSearch("");
    setIsBuilderOpen(true);
  };

  // Toggle single permission
  const togglePermission = (actionName) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(actionName)) {
        next.delete(actionName);
      } else {
        next.add(actionName);
      }
      return next;
    });
  };

  // Bulk select all in active category
  const handleSelectCategory = (categoryKey) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (categoryKey === "all") {
        catalog.forEach((p) => next.add(p.action_name));
      } else {
        const catPerms = groupedPermissions[categoryKey]?.permissions || [];
        catPerms.forEach((p) => next.add(p.action_name));
      }
      return next;
    });
  };

  // Bulk deselect all in active category
  const handleDeselectCategory = (categoryKey) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (categoryKey === "all") {
        next.clear();
      } else {
        const catPerms = groupedPermissions[categoryKey]?.permissions || [];
        catPerms.forEach((p) => next.delete(p.action_name));
      }
      return next;
    });
  };

  // Save role to backend
  const handleSaveRole = async () => {
    if (!roleName.trim()) {
      return toast.error("Please enter a role name");
    }

    const generatedKey = (
      roleKey.trim() || roleName.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_")
    );

    if (selectedPermissions.size === 0) {
      return toast.error("Please select at least one permission for this role");
    }

    setIsSaving(true);
    try {
      if (editingRole) {
        await updateRoleAPI(editingRole.id, {
          roleName: editingRole.roleKey,
          description: roleDescription.trim(),
          permissions: Array.from(selectedPermissions),
        });
        toast.success(`Role '${roleName}' updated successfully`);
      } else {
        await createRoleAPI({
          roleName: generatedKey,
          description: roleDescription.trim() || "Custom user defined administrative role",
          permissions: Array.from(selectedPermissions),
        });
        toast.success(`Role '${roleName}' created successfully`);
      }

      setIsBuilderOpen(false);
      await fetchRoles();
    } catch (error) {
      console.error("Failed to save role:", error);
      toast.error(error.response?.data?.message || "Failed to save role configuration");
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm delete role
  const handleConfirmDelete = async () => {
    const role = deleteModalState.role;
    if (!role) return;

    if (role.isSystem) {
      toast.error(`System role '${role.name}' cannot be deleted`);
      setDeleteModalState({ isOpen: false, role: null });
      return;
    }

    try {
      await deleteRoleAPI(role.id);
      toast.success(`Role '${role.name}' deleted successfully`);
      setDeleteModalState({ isOpen: false, role: null });
      await fetchRoles();
    } catch (error) {
      console.error("Failed to delete role:", error);
      toast.error(error.response?.data?.message || "Failed to delete role");
    }
  };

  // Filtered displayed permissions based on category & search
  const visiblePermissions = useMemo(() => {
    let list = [];
    if (activeCategory === "all") {
      catalog.forEach((p) => {
        const colonIdx = p.action_name.indexOf(":");
        const resource = colonIdx !== -1 ? p.action_name.substring(0, colonIdx) : "general";
        list.push({
          ...p,
          resource,
          categoryLabel: formatResourceName(resource),
        });
      });
    } else {
      const cat = groupedPermissions[activeCategory];
      if (cat) {
        list = cat.permissions.map((p) => ({
          action_name: p.action_name,
          description: p.description,
          resource: p.resource,
          categoryLabel: cat.categoryLabel,
        }));
      }
    }

    if (permissionSearch.trim()) {
      const query = permissionSearch.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.action_name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.categoryLabel.toLowerCase().includes(query)
      );
    }

    return list;
  }, [activeCategory, catalog, groupedPermissions, permissionSearch]);

  // Selected counts helper
  const getCategorySelectedCount = (catKey) => {
    if (catKey === "all") return selectedPermissions.size;
    const catPerms = groupedPermissions[catKey]?.permissions || [];
    return catPerms.filter((p) => selectedPermissions.has(p.action_name)).length;
  };

  const getCategoryTotalCount = (catKey) => {
    if (catKey === "all") return catalog.length;
    return groupedPermissions[catKey]?.permissions?.length || 0;
  };

  return (
    <div className="p-6 bg-bukizz-bg min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-bukizz-navy">
              Role & Permission Builder
            </h1>
            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles size={12} /> Dynamic Matrix
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure fine-grained access policies by mapping system permissions into modular roles
          </p>
        </div>

        <PermissionGuard permission="users:manage">
          <Button
            variant="primary"
            icon={Plus}
            onClick={handleOpenCreate}
            className="shadow-sm"
          >
            Create Custom Role
          </Button>
        </PermissionGuard>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div
            key={role.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
          >
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-orange-50 text-bukizz-orange flex items-center justify-center font-bold">
                    <Shield size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 leading-tight">
                      {role.name}
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      key: {role.roleKey || role.id}
                    </span>
                  </div>
                </div>

                {role.isSystem ? (
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 flex items-center gap-1">
                    <Lock size={10} /> System
                  </span>
                ) : (
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    Custom
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {role.description}
              </p>

              {/* Permission Count Badge */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Layers size={14} className="text-slate-400" />
                  Authority:
                </span>
                <span className="font-semibold text-bukizz-navy bg-slate-100 px-2 py-0.5 rounded">
                  {role.permissions?.length || 0} / {catalog.length} permissions
                </span>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              {!role.isSystem && (
                <PermissionGuard permission="users:manage">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => setDeleteModalState({ isOpen: true, role })}
                    className="text-xs py-1 px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </PermissionGuard>
              )}
              <PermissionGuard permission="users:manage">
                <Button
                  variant="outline"
                  size="sm"
                  icon={Edit2}
                  onClick={() => handleOpenEdit(role)}
                  className="text-xs py-1 px-3"
                >
                  Configure
                </Button>
              </PermissionGuard>
            </div>
          </div>
        ))}
      </div>

      {/* ── Advanced Role Builder Modal ── */}
      {isBuilderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-bukizz-orange flex items-center justify-center">
                  <Shield size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingRole ? `Edit Role: ${editingRole.name}` : "Create New Access Role"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Select resource prefixes and granular action permissions for this profile
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                  Selected:{" "}
                  <span className="text-bukizz-orange font-bold">
                    {selectedPermissions.size}
                  </span>{" "}
                  / {catalog.length}
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Role Meta Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Role Display Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Catalog Specialist"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-bukizz-orange/30 focus:border-bukizz-orange"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Role Key Identifier
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. catalog_specialist"
                    value={roleKey}
                    onChange={(e) => setRoleKey(e.target.value)}
                    disabled={editingRole?.isSystem}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-bukizz-orange/30 focus:border-bukizz-orange disabled:bg-slate-100 disabled:text-slate-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Role Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe the operational scope and duties authorized for this role..."
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-bukizz-orange/30 focus:border-bukizz-orange resize-none"
                  />
                </div>
              </div>

              {/* ── Category Pills Horizontal Navigation ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={14} className="text-slate-400" />
                    Permission Resource Categories
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectCategory(activeCategory)}
                      className="text-xs font-medium text-bukizz-orange hover:text-orange-700 flex items-center gap-1"
                    >
                      <CheckSquare size={13} /> Select All in {formatResourceName(activeCategory)}
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => handleDeselectCategory(activeCategory)}
                      className="text-xs font-medium text-slate-500 hover:text-slate-700 flex items-center gap-1"
                    >
                      <Square size={13} /> Deselect All
                    </button>
                  </div>
                </div>

                {/* Horizontal Scrollable Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100 no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setActiveCategory("all")}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      activeCategory === "all"
                        ? "bg-bukizz-navy text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <span>All System</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        activeCategory === "all" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {getCategorySelectedCount("all")}/{getCategoryTotalCount("all")}
                    </span>
                  </button>

                  {categoryKeys.map((catKey) => {
                    const selCount = getCategorySelectedCount(catKey);
                    const totalCount = getCategoryTotalCount(catKey);
                    const isFullySelected = selCount === totalCount && totalCount > 0;

                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => setActiveCategory(catKey)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                          activeCategory === catKey
                            ? "bg-bukizz-orange text-white shadow-sm"
                            : isFullySelected
                            ? "bg-orange-50 text-bukizz-orange border border-orange-200 hover:bg-orange-100"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        <span>{formatResourceName(catKey)}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                            activeCategory === catKey
                              ? "bg-white/25 text-white"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {selCount}/{totalCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Permission Filter Search */}
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder={`Search ${activeCategory === "all" ? "all" : formatResourceName(activeCategory)} actions...`}
                  value={permissionSearch}
                  onChange={(e) => setPermissionSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-bukizz-orange/30 focus:border-bukizz-orange bg-slate-50"
                />
              </div>

              {/* Permission Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {visiblePermissions.map((perm) => {
                  const isChecked = selectedPermissions.has(perm.action_name);

                  return (
                    <div
                      key={perm.action_name}
                      onClick={() => togglePermission(perm.action_name)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        isChecked
                          ? "bg-orange-50/60 border-orange-300 shadow-sm"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded mt-0.5 flex items-center justify-center border transition-colors shrink-0 ${
                          isChecked
                            ? "bg-bukizz-orange border-bukizz-orange text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isChecked && <Check size={14} strokeWidth={3} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-xs text-slate-900">
                            {perm.action_name}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {perm.categoryLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                          {perm.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {visiblePermissions.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No permissions matching "{permissionSearch}"
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Granting <strong className="text-slate-900">{selectedPermissions.size}</strong> of {catalog.length} permissions
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setIsBuilderOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveRole}
                  isLoading={isSaving}
                >
                  {editingRole ? "Update Role" : "Create Role"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalState.isOpen}
        title="Delete Administrative Role"
        message={`Are you sure you want to delete the role '${deleteModalState.role?.name}'? Users assigned to this role will lose its permissions.`}
        confirmText="Delete Role"
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModalState({ isOpen: false, role: null })}
      />
    </div>
  );
};

export default RoleBuilderPage;
