import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  Loader2,
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
} from "../../components/common";
import { Button, ConfirmationModal, Tooltip } from "../../components/ui";

const DeliveryPartnerList = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. URL State
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const currentLimit = parseInt(searchParams.get("limit") || "10", 10);
  const currentSearch = searchParams.get("search") || "";
  const currentStatus = searchParams.get("status") || "";
  const currentCity = searchParams.get("city") || "";
  const currentKyc = searchParams.get("kyc") || "";

  // 2. Local State
  const [partners, setPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paginationMetadata, setPaginationMetadata] = useState({
    total: 0,
    totalPages: 1,
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
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
  const fetchPartners = async () => {
    setIsLoading(true);
    try {
      // Construct params
      const params = {
        status: currentStatus || undefined,
        city: currentCity || undefined,
        kycStatus: currentKyc || undefined,
        page: currentPage,
        limit: currentLimit,
      };

      // Clean empty params
      Object.keys(params).forEach((key) => !params[key] && delete params[key]);

      const response = await api.get("/admin/delivery-partners", { params });

      const result = response.data;
      const users = result.data?.partners || [];
      const pagination = result.data?.pagination || {};

      const total = pagination.total || users.length;
      const totalPages = pagination.totalPages || Math.ceil(total / currentLimit) || 1;

      // Map API response to expected data structure
      const mappedUsers = users.map(u => {
         const dpData = u.delivery_partner_data || {};
         return {
            ...u,
            vehicle_type: dpData.vehicle_details?.type || "N/A",
            active_orders: u.activeOrderCount || 0,
            max_orders: 5,
            wallet_balance: u.walletBalance || 0,
            kyc_verified: dpData.kyc_status === "approved"
         };
      });

      setPartners(mappedUsers);
      setPaginationMetadata({
        total: total,
        totalPages: totalPages,
      });
    } catch (error) {
      console.error("Fetch Delivery Partners Error:", error);
      toast.error("Failed to fetch delivery partners");
      setPartners([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [currentPage, currentLimit, currentSearch, currentStatus, currentCity, currentKyc]);

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
    setPartners((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: !currentStatus } : p)),
    );

    try {
      // await api.patch(`/users/${id}/activate`, { is_active: !currentStatus });
      toast.success(
        `Delivery Partner ${!currentStatus ? "activated" : "deactivated"} successfully`,
      );
    } catch (error) {
      // Revert on error
      setPartners((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: currentStatus } : p)),
      );
      toast.error("Failed to update status");
    }
  };

  const confirmDelete = (partner) => {
    setSelectedPartner(partner);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedPartner) return;
    setIsDeleting(true);
    try {
      // await api.delete(`/users/${selectedPartner.id}`);
      setPartners((prev) => prev.filter((p) => p.id !== selectedPartner.id));
      toast.success("Delivery partner deleted successfully");
      setDeleteModalOpen(false);
    } catch (error) {
      toast.error("Failed to delete delivery partner");
    } finally {
      setIsDeleting(false);
      setSelectedPartner(null);
    }
  };

  // 5. Columns
  const columns = [
    {
      header: "DP Info",
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
              row.full_name?.charAt(0) || "D"
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
            <MapPin size={12} /> {row.city || "N/A"}, {row.state || "N/A"}
          </div>
        </div>
      ),
    },
    {
      header: "Vehicle",
      accessor: "vehicle_type",
      render: (row) => (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
          {row.vehicle_type}
        </span>
      ),
    },
    {
      header: "Current Load",
      accessor: "active_orders",
      render: (row) => {
        const isFull = row.active_orders >= row.max_orders;
        return (
            <div className={`font-medium text-sm ${isFull ? "text-amber-600" : "text-green-600"}`}>
                {row.active_orders}/{row.max_orders} Orders
            </div>
        );
      }
    },
    {
        header: "Wallet",
        accessor: "wallet_balance",
        render: (row) => (
            <div className="font-semibold text-sm text-slate-800">
                ₹{Number(row.wallet_balance).toLocaleString()}
            </div>
        )
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
          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
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
              onClick={() => navigate(`/admin/delivery-partners/${row.id}`)}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              <Eye size={18} />
            </button>
          </Tooltip>
          <Tooltip content="Delete Partner">
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
            Delivery Partner Hub
          </h1>
          <p className="text-sm text-slate-500">
            Manage your delivery fleet, loadouts, and settlements
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => console.log("Add Partner clicked")} // Placeholder, usually a modal or new route
        >
          Add Partner
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
             label: "KYC Status",
             options: ["Verified", "Pending"],
             value: currentKyc,
             onChange: (val) => handleFilterChange("kyc", val),
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
            <span className="ml-3 font-medium">Loading partners...</span>
          </div>
        ) : partners.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-slate-400 bg-white rounded-lg border border-slate-100 border-dashed">
            <p>No delivery partners found matching your filters.</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={partners}
            pagination={false} 
          />
        )}
      </div>

      {/* Pagination */}
      {!isLoading && partners.length > 0 && (
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
        title="Delete Delivery Partner"
        message={`Are you sure you want to delete ${selectedPartner?.full_name}? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete Partner"}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default DeliveryPartnerList;
