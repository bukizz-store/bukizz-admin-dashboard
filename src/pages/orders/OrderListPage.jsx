import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Search, Eye, Filter } from "lucide-react";
import { DataTable, Pagination } from "../../components/common";
import { fetchOrders, updateOrderStatus } from "../../services/orderService";
import { searchRetailers } from "../../services/retailerService";

// Helper for Status Badges
const STATUS_STYLES = {
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  CANCELLED: "bg-red-100 text-red-700",
  DEFAULT: "bg-slate-100 text-slate-700",
};

const PAYMENT_STYLES = {
  PAID: "text-green-600 bg-green-50",
  UNPAID: "text-yellow-600 bg-yellow-50",
  REFUNDED: "text-slate-500 bg-slate-100 line-through",
};

const StatusBadge = ({ status, type = "status" }) => {
  const styles = type === "payment" ? PAYMENT_STYLES : STATUS_STYLES;
  // Normalize status to uppercase for matching
  const key = status?.toUpperCase();
  const className = styles[key] || styles.DEFAULT || "text-slate-500";

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${className}`}
    >
      {status}
    </span>
  );
};

// Custom Debounce Hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const OrderListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [retailers, setRetailers] = useState([]);

  // Filters State
  const [filters, setFilters] = useState({
    search: "",
    status: "ALL",
    retailerId: "",
    page: 1,
    limit: 20,
  });

  const debouncedSearch = useDebounce(filters.search, 500);

  // Fetch Retailers on Mount
  useEffect(() => {
    const fetchRetailersData = async () => {
      try {
        const api_data = await searchRetailers();
        const data = api_data.data.users;
        // Assuming API returns array of retailers directly or inside data property
        // Adjust based on actual API response structure if needed
        console.log("retailers data", data);
        setRetailers(Array.isArray(data) ? data : data || []);
      } catch (error) {
        console.error("Failed to fetch retailers", error);
      }
    };
    fetchRetailersData();
  }, []);

  // Fetch Orders
  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        search: debouncedSearch,
      };

      // Remove empty filters
      if (params.status === "ALL") delete params.status;
      if (!params.retailerId) delete params.retailerId;

      const api_data = await fetchOrders(params);
      const data = api_data.data;
      setOrders(data.orders || []);
      setTotalCount(data.pagination?.total || 0);
      console.log("orders data", data);
    } catch (error) {
      console.error("Failed to fetch orders", error);
      setOrders([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [
    filters.page,
    filters.limit,
    filters.status,
    filters.retailerId,
    debouncedSearch,
  ]);

  // Trigger fetch when dependencies change
  useEffect(() => {
    loadOrders();
    // Update URL params
    const params = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (filters.status !== "ALL") params.status = filters.status;
    if (filters.retailerId) params.retailerId = filters.retailerId;
    if (filters.page > 1) params.page = filters.page;
    setSearchParams(params, { replace: true });
  }, [
    loadOrders,
    debouncedSearch,
    filters.status,
    filters.retailerId,
    filters.page,
    setSearchParams,
  ]);

  // Handlers
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page on filter change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit) => {
    setFilters((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  // formatting currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Columns Configuration
  const columns = [
    {
      header: "ORDER #",
      accessor: "orderNumber", // Assuming API returns orderNumber
      render: (row) => (
        <span className="font-bold text-slate-900">
          {row.orderNumber || row.id?.substring(0, 8).toUpperCase()}
        </span>
      ),
    },
    {
      header: "CUSTOMER",
      accessor: "customer",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-900">
            {row.customerName || row.user?.name || "Unknown"}
          </span>
          <span className="text-xs text-slate-500">
            {row.customerEmail || row.user?.email}
          </span>
        </div>
      ),
    },
    {
      header: "DATE",
      accessor: "createdAt",
      render: (row) => (
        <span className="text-sm text-slate-600">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"}
        </span>
      ),
    },
    {
      header: "STATUS",
      accessor: "status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "PAYMENT",
      accessor: "paymentStatus",
      render: (row) => (
        <StatusBadge status={row.paymentStatus} type="payment" />
      ),
    },
    {
      header: "TOTAL",
      accessor: "totalAmount",
      render: (row) => (
        <span className="font-medium text-slate-700">
          {formatCurrency(row.totalAmount || 0)}
        </span>
      ),
    },
    {
      header: "ACTIONS",
      accessor: "id",
      render: (row) => (
        <Link
          to={`/admin/orders/${row.id}`}
          className="p-2 text-slate-400 hover:text-bukizz-blue hover:bg-blue-50 rounded-full transition-colors inline-flex"
        >
          <Eye size={18} />
        </Link>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Orders</h1>

      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by Order #, Email, or Name..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Retailer Select */}
          <select
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-400 min-w-37.5"
            value={filters.retailerId}
            onChange={(e) => handleFilterChange("retailerId", e.target.value)}
          >
            <option value="">Select Retailer</option>
            {retailers.map((retailer) => (
              <option key={retailer.id} value={retailer.id}>
                {retailer.name || retailer.email}
              </option>
            ))}
          </select>

          {/* Status Select */}
          <select
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-400 min-w-37.5"
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={orders}
          emptyMessage={
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Filter className="w-12 h-12 text-slate-200 mb-3" />
              <p className="text-lg font-medium">No orders found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          }
        />

        {/* Pagination */}
        {!loading && orders.length > 0 && (
          <div className="px-6 pb-4 border-t border-slate-100">
            <Pagination
              currentPage={filters.page}
              totalPages={Math.ceil(totalCount / filters.limit)}
              itemsPerPage={filters.limit}
              totalItems={totalCount}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleLimitChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderListPage;
