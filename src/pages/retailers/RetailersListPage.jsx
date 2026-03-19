import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  Loader2,
  MoreVertical,
  Eye,
  Trash2,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
} from "lucide-react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import {
  FilterBar,
  DataTable,
  Pagination,
  StatusBadge,
} from "../../components/common";
import { Button, ConfirmationModal, Tooltip } from "../../components/ui";

const RetailersListPage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. URL State
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const currentLimit = parseInt(searchParams.get("limit") || "10", 10);
  const currentSearch = searchParams.get("search") || "";
  const currentStatus = searchParams.get("status") || "";
  const currentCity = searchParams.get("city") || "";

  // 2. Local State
  const [retailers, setRetailers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paginationMetadata, setPaginationMetadata] = useState({
    total: 0,
    totalPages: 1,
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedRetailer, setSelectedRetailer] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState(currentSearch);

  // Sync search term
  useEffect(() => {
    setSearchTerm(currentSearch);
  }, [currentSearch]);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== currentSearch) {
        setSearchParams((prev) => {
          const newParams = new URLSearchParams(prev);
          if (searchTerm) {
            newParams.set("search", searchTerm);
            newParams.set("page", "1");
          } else {
            newParams.delete("search");
          }
          return newParams;
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, currentSearch, setSearchParams]);

  // 3. Fetch Data
  const fetchRetailers = async () => {
    setIsLoading(true);
    try {
      // Construct params
      const params = {
        role: "retailer",
        q: currentSearch || undefined, // Search query
        status: currentStatus || undefined,
        city: currentCity || undefined,
        page: currentPage,
        limit: currentLimit,
      };

      // Clean empty params
      Object.keys(params).forEach((key) => !params[key] && delete params[key]);

      const response = await api.get("/users/admin/search", { params });

      console.log("Response Data:", response.data);

      const result = response.data;
      const users = result.data?.users || [];
      const pagination = result.data?.pagination || {};

      const total = pagination.total || users.length;
      const totalPages =
        pagination.pages || Math.ceil(total / currentLimit) || 1;

      setRetailers(users);
      setPaginationMetadata({
        total: total,
        totalPages: totalPages,
      });
    } catch (error) {
      console.error("Fetch Retailers Error:", error);
      toast.error("Failed to fetch retailers");
      setRetailers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRetailers();
  }, [currentPage, currentLimit, currentSearch, currentStatus, currentCity]);

  // 4. Handlers
  const handleFilterChange = (key, value) => {
    setSearchParams((prev) => {
      const ps = new URLSearchParams(prev);
      if (value) ps.set(key, value);
      else ps.delete(key);
      if (key !== "page") ps.set("page", "1");
      return ps;
    });
  };

  const handleStatusToggle = async (id, currentStatus) => {
    // Optimistic Update
    setRetailers((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_active: !currentStatus } : r)),
    );

    try {
      // await api.patch(`/users/${id}/activate`, { is_active: !currentStatus });
      toast.success(
        `Retailer ${!currentStatus ? "activated" : "deactivated"} successfully`,
      );
    } catch (error) {
      // Revert on error
      setRetailers((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_active: currentStatus } : r)),
      );
      toast.error("Failed to update status");
    }
  };

  const confirmDelete = (retailer) => {
    setSelectedRetailer(retailer);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedRetailer) return;
    setIsDeleting(true);
    try {
      // await api.delete(`/users/${selectedRetailer.id}`);
      setRetailers((prev) => prev.filter((r) => r.id !== selectedRetailer.id));
      toast.success("Retailer deleted successfully");
      setDeleteModalOpen(false);
    } catch (error) {
      toast.error("Failed to delete retailer");
    } finally {
      setIsDeleting(false);
      setSelectedRetailer(null);
    }
  };

  // 5. Columns
  const columns = [
    {
      header: "User Info",
      accessor: "full_name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold overflow-hidden">
            {row.image ? (
              <img
                src={row.image}
                alt={row.full_name}
                className="w-full h-full object-cover"
              />
            ) : (
              row.full_name.charAt(0)
            )}
          </div>
          <div>
            <div className="font-bold text-slate-900">{row.full_name}</div>
            <div className="text-xs text-slate-500">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Contact",
      accessor: "phone",
      render: (row) => (
        <div className="text-sm">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Phone size={14} className="text-slate-400" /> {row.phone}
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-0.5">
            <MapPin size={12} /> {row.city}, {row.state}
          </div>
        </div>
      ),
    },
    {
      header: "Role",
      accessor: "role",
      render: () => (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          Retailer
        </span>
      ),
    },
    {
      header: "Verification",
      accessor: "verified",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Tooltip
            content={row.email_verified ? "Email Verified" : "Email Pending"}
          >
            {row.email_verified ? (
              <CheckCircle size={16} className="text-green-500" />
            ) : (
              <XCircle size={16} className="text-slate-300" />
            )}
          </Tooltip>
          <Tooltip
            content={row.phone_verified ? "Phone Verified" : "Phone Pending"}
          >
            {row.phone_verified ? (
              <CheckCircle size={16} className="text-green-500" />
            ) : (
              <XCircle size={16} className="text-slate-300" />
            )}
          </Tooltip>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "is_active",
      render: (row) => (
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={row.is_active}
            onChange={() => handleStatusToggle(row.id, row.is_active)}
          />
          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          <span className="ml-2 text-xs font-medium text-slate-600">
            {row.is_active ? "Active" : "Inactive"}
          </span>
        </label>
      ),
    },
    {
      header: "", // Actions
      accessor: "actions",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Tooltip content="View Details">
            <button
              onClick={() => navigate(`/retailers/${row.id}`)}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              <Eye size={18} />
            </button>
          </Tooltip>
          <Tooltip content="Delete Retailer">
            <button
              onClick={() => confirmDelete(row)}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-bukizz-bg min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-bukizz-navy">
            Retailer Management
          </h1>
          <p className="text-sm text-slate-500">
            Manage your registered retailers and their account access
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => navigate("/retailers/create")}
        >
          Add Retailer
        </Button>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchTerm={searchTerm}
        onSearch={(val) => setSearchTerm(val)}
        filterConfig={[
          {
            label: "Status",
            options: ["Active", "Inactive"],
            value: currentStatus
              ? currentStatus === "active"
                ? "Active"
                : "Inactive"
              : "",
            onChange: (val) =>
              handleFilterChange("status", val ? val.toLowerCase() : ""),
          },
          {
            label: "City",
            options: ["New Delhi", "Mumbai", "Bangalore", "Gurugram"],
            value: currentCity,
            onChange: (val) => handleFilterChange("city", val),
          },
        ]}
        searchPlaceholder="Search by Name, Email or Phone..."
      />

      {/* Content */}
      <div className="min-h-96 mt-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-slate-400">
            <Loader2 className="animate-spin w-8 h-8 text-bukizz-orange" />
            <span className="ml-3 font-medium">Loading retailers...</span>
          </div>
        ) : retailers.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-slate-400 bg-white rounded-lg border border-slate-100 border-dashed">
            <p>No retailers found matching your filters.</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={retailers}
            pagination={false} // Internal pagination handled by Pagination component below
          />
        )}
      </div>

      {/* Pagination */}
      {!isLoading && retailers.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={paginationMetadata.totalPages}
          itemsPerPage={currentLimit}
          totalItems={paginationMetadata.total}
          onPageChange={(p) => handleFilterChange("page", p)}
          onItemsPerPageChange={(l) => handleFilterChange("limit", l)}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Retailer"
        message={`Are you sure you want to delete ${selectedRetailer?.full_name}? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete Retailer"}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default RetailersListPage;
