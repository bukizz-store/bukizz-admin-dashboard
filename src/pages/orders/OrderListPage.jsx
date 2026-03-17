import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Package,
  Filter,
  RefreshCw,
  Eye,
} from "lucide-react";
import {
  fetchOrders,
  updateOrderItemStatus,
  fetchWarehousesByRetailer,
} from "../../services/orderService";
import { searchRetailers } from "../../services/retailerService";

// ─────────────────────────────────────────────────────────────────────────────
// Constants / Helpers
// ─────────────────────────────────────────────────────────────────────────────

const ALL_STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "initialized", label: "New" },
  { value: "processed", label: "Processed" },
  { value: "shipped", label: "Shipped" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

const STATUS_OPTIONS = [
  {
    value: "initialized",
    label: "New",
    dot: "bg-yellow-400",
    badge: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "processed",
    label: "Processed",
    dot: "bg-blue-400",
    badge: "bg-blue-100 text-blue-800",
  },
  {
    value: "shipped",
    label: "Shipped",
    dot: "bg-purple-400",
    badge: "bg-purple-100 text-purple-800",
  },
  {
    value: "out_for_delivery",
    label: "Out for Delivery",
    dot: "bg-indigo-400",
    badge: "bg-indigo-100 text-indigo-800",
  },
  {
    value: "delivered",
    label: "Delivered",
    dot: "bg-green-400",
    badge: "bg-green-100 text-green-800",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    dot: "bg-red-400",
    badge: "bg-red-100 text-red-800",
  },
  {
    value: "refunded",
    label: "Refunded",
    dot: "bg-slate-400",
    badge: "bg-slate-100 text-slate-700",
  },
];

const getOpt = (v) =>
  STATUS_OPTIONS.find((o) => o.value === v) || STATUS_OPTIONS[0];

const PAYMENT_STYLES = {
  paid: "bg-green-50 text-green-700",
  pending: "bg-yellow-50 text-yellow-700",
  failed: "bg-red-50 text-red-700",
  refunded: "bg-slate-100 text-slate-700",
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const truncateText = (text, limit = 20) => {
  if (!text) return "";
  return text.length > limit ? text.substring(0, limit) + "..." : text;
};

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const PaymentBadge = ({ status, method }) => (
  <div className="flex flex-col gap-0.5">
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize w-fit ${PAYMENT_STYLES[status] || "bg-slate-100 text-slate-700"}`}
    >
      {status || "—"}
    </span>
    {method && (
      <span className="text-xs text-slate-400 uppercase">{method}</span>
    )}
  </div>
);

// Custom status picker — no native browser select styling
function StatusPicker({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const opt = getOpt(value);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-all focus:outline-none disabled:opacity-50 hover:shadow-sm ${opt.badge}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${opt.dot}`} />
        {opt.label}
        <ChevronDown
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 min-w-44 rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70 py-1.5 overflow-hidden">
          {STATUS_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-colors hover:bg-slate-50 ${o.value === value ? o.badge : "text-slate-700"}`}
            >
              <span className={`h-2 w-2 rounded-full shrink-0 ${o.dot}`} />
              {o.label}
              {o.value === value && (
                <span className="ml-auto text-[10px] text-slate-400 font-normal">
                  current
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Expandable Order Row
// ─────────────────────────────────────────────────────────────────────────────

function OrderRow({ order, onItemStatusChange, onViewOrder, navigate }) {
  const [expanded, setExpanded] = useState(false);
  const [itemUpdating, setItemUpdating] = useState(null);
  const [localItems, setLocalItems] = useState(order.items || []);

  const dispatchId = localItems[0]?.dispatchId || null;
  const shortId =
    order.orderNumber ||
    `#${(order.id || "").replace(/-/g, "").slice(-8).toUpperCase()}`;
  const customerName =
    order.shippingAddress?.recipientName || order.contactEmail || "Customer";
  const studentName = order.shippingAddress?.studentName;
  const retailerWarehouse = order.warehouseId || "—";

  // Aggregate status = earliest in pipeline across all items
  const PRIO = [
    "initialized",
    "processed",
    "shipped",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "refunded",
  ];
  const idxList = localItems
    .map((i) => PRIO.indexOf(i.status))
    .filter((i) => i >= 0);
  const aggStatus = idxList.length
    ? PRIO[Math.min(...idxList)]
    : order.status || "initialized";
  const aggOpt = getOpt(aggStatus);

  const handleItemStatus = async (itemId, newStatus) => {
    setItemUpdating(itemId);
    try {
      await onItemStatusChange(order.id, itemId, newStatus);
      setLocalItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, status: newStatus } : i)),
      );
    } finally {
      setItemUpdating(null);
    }
  };

  return (
    <>
      {/* Summary Row */}
      <tr
        className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
        onClick={() => setExpanded((p) => !p)}
      >
        <td className="px-4 py-3 w-8">
          <span className="text-slate-400">
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
        </td>

        {/* Order ID */}
        <td className="px-4 py-3 min-w-32.5">
          <p className="font-mono text-sm font-bold text-blue-700 truncate">
            {dispatchId || shortId}
          </p>
          <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
            {order.orderNumber || order.id?.substring(0, 12)}
          </p>
        </td>

        {/* Date */}
        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
          <div className="flex flex-col">
            <span className="font-medium text-slate-900">
              {formatDate(order.createdAt)}
            </span>
            <span className="text-xs text-slate-400 mt-0.5">
              {formatTime(order.createdAt)}
            </span>
          </div>
        </td>

        {/* Product summary */}
        <td className="px-4 py-3 max-w-50">
          {localItems.length === 0 ? (
            <span className="text-xs text-slate-400">No items</span>
          ) : localItems.length === 1 ? (
            <p className="text-sm text-slate-800 font-medium line-clamp-2">
              {localItems[0].title}
              {localItems[0].schoolName ? ` — ${localItems[0].schoolName}` : ""}
            </p>
          ) : (
            <p className="text-sm text-slate-700">
              <span className="font-medium">{localItems.length} items</span>
              <span className="text-slate-400 ml-1 text-xs">
                (expand to manage)
              </span>
            </p>
          )}
        </td>

        {/* Customer */}
        <td className="px-4 py-3">
          <p
            className="text-sm font-medium text-slate-900 truncate max-w-35"
            title={customerName}
          >
            {truncateText(customerName, 20)}
          </p>
          {studentName && (
            <p
              className="text-xs text-slate-400 mt-0.5 truncate"
              title={studentName}
            >
              Student: {truncateText(studentName, 15)}
            </p>
          )}
        </td>

        {/* Payment */}
        <td className="px-4 py-3">
          <PaymentBadge
            status={order.paymentStatus}
            method={order.paymentMethod}
          />
        </td>

        {/* Retailer */}
        <td
          className="px-4 py-3 text-xs text-slate-500 max-w-30 truncate"
          title={retailerWarehouse}
        >
          {retailerWarehouse !== "—" ? (
            <span className="font-mono">
              {retailerWarehouse.substring(0, 12)}…
            </span>
          ) : (
            "—"
          )}
        </td>

        {/* Amount */}
        <td className="px-4 py-3 text-right text-sm font-bold text-slate-900 whitespace-nowrap">
          {formatCurrency(order.totalAmount)}
        </td>

        {/* Aggregate status (read-only — change per item by expanding) */}
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <span
            className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border w-fit ${aggOpt.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${aggOpt.dot}`} />
            {aggOpt.label}
          </span>
        </td>

        {/* View */}
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onViewOrder(order.id)}
            className="p-1.5 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="View Order"
          >
            <Eye className="h-4 w-4" />
          </button>
        </td>
      </tr>

      {/* Expanded Item Rows */}
      {expanded && localItems.length > 0 && (
        <>
          <tr className="bg-blue-50/60">
            <td colSpan={10} className="px-6 pt-2 pb-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Order Items ({localItems.length}) — update status per item below
              </span>
            </td>
          </tr>
          {localItems.map((item) => (
            <tr
              key={item.id}
              className="bg-slate-50/80 border-b border-slate-100 last:border-b-2 last:border-blue-100"
            >
              <td className="pl-10 pr-4 py-2.5" />

              {/* Item ID */}
              <td className="px-4 py-2.5">
                <p className="font-mono text-xs font-semibold text-slate-700">
                  {item.dispatchId || item.id?.substring(0, 12) || "—"}
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {item.sku || "—"}
                </p>
              </td>

              {/* Product image + title */}
              <td colSpan={3} className="px-4 py-2.5">
                <div className="flex items-center gap-3">
                  {item.productSnapshot?.image ||
                  item.productSnapshot?.image_url ? (
                    <img
                      src={
                        item.productSnapshot.image ||
                        item.productSnapshot.image_url
                      }
                      alt={item.title}
                      className="h-9 w-9 rounded-md object-cover border border-slate-200 shrink-0"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-md bg-slate-200 flex items-center justify-center shrink-0">
                      <Package className="h-4 w-4 text-slate-400" />
                    </div>
                  )}
                  <p className="text-sm font-medium text-slate-800 line-clamp-1">
                    {item.title}
                    {item.schoolName && (
                      <span className="text-slate-400 ml-1 font-normal">
                        — {item.schoolName}
                      </span>
                    )}
                  </p>
                </div>
              </td>

              {/* Qty */}
              <td className="px-4 py-2.5 text-center text-sm text-slate-600">
                ×{item.quantity || 1}
              </td>

              {/* Price */}
              <td className="px-4 py-2.5 text-right text-sm font-medium text-slate-700">
                {formatCurrency(
                  item.totalPrice || item.unitPrice * item.quantity,
                )}
              </td>

              {/* Per-item status picker */}
              <td className="px-4 py-2.5">
                <StatusPicker
                  value={item.status || "initialized"}
                  onChange={(s) => handleItemStatus(item.id, s)}
                  disabled={itemUpdating === item.id}
                />
              </td>

              {/* Item detail link */}
              <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() =>
                    navigate(`/orders/${order.id}/items/${item.id}`)
                  }
                  className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                >
                  Detail →
                </button>
              </td>
            </tr>
          ))}
        </>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

const OrderListPage = () => {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [retailers, setRetailers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    retailerId: "",
    warehouseId: "",
    city: "",
    page: 1,
    limit: 20,
  });

  const debouncedSearch = useDebounce(filters.search, 500);

  // Load retailers on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await searchRetailers();
        setRetailers(Array.isArray(res.data?.users) ? res.data.users : []);
      } catch {
        /* non-critical */
      }
    })();
  }, []);

  // When retailer changes → fetch their warehouses
  const handleRetailerChange = async (retailerId) => {
    setFilters((prev) => ({ ...prev, retailerId, warehouseId: "", page: 1 }));
    setWarehouses([]);
    if (!retailerId) return;
    setWarehousesLoading(true);
    try {
      const res = await fetchWarehousesByRetailer(retailerId);
      const list = res.data.warehouses ;
      console.log("warehouses: ", list);
      setWarehouses(Array.isArray(list) ? list : []);
    } catch {
      setWarehouses([]);
    } finally {
      setWarehousesLoading(false);
    }
  };

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchOrders({
        page: filters.page,
        limit: filters.limit,
        search: debouncedSearch,
        status: filters.status,
        retailerId: filters.retailerId,
        warehouseId: filters.warehouseId,
        city: filters.city,
      });
      const data = res.data;
      setOrders(data.orders || []);
      setTotalCount(data.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError("Failed to load orders. Please try again.");
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
    filters.warehouseId,
    filters.city,
    debouncedSearch,
  ]);

  useEffect(() => {
    loadOrders();
    const p = {};
    if (debouncedSearch) p.search = debouncedSearch;
    if (filters.status) p.status = filters.status;
    if (filters.retailerId) p.retailerId = filters.retailerId;
    if (filters.page > 1) p.page = filters.page;
    setSearchParams(p, { replace: true });
  }, [loadOrders]);

  const handleFilterChange = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));

  const handleItemStatusChange = async (orderId, itemId, newStatus) => {
    try {
      await updateOrderItemStatus(orderId, itemId, newStatus);
    } catch (err) {
      console.error("Failed to update item status:", err);
      setError("Failed to update item status.");
    }
  };

  const totalPages = Math.ceil(totalCount / filters.limit);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Orders</h1>
        <button
          onClick={loadOrders}
          disabled={loading}
          className="flex items-center gap-2 text-sm px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-3 items-center flex-wrap">
        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search order #, email, phone…"
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Step 1 — Retailer */}
          <select
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-400 min-w-44"
            value={filters.retailerId}
            onChange={(e) => handleRetailerChange(e.target.value)}
          >
            <option value="">All Retailers</option>
            {retailers.map((r) => (
              <option key={r.id} value={r.id}>
                {r.full_name || r.name || r.email}
              </option>
            ))}
          </select>

          {/* Step 2 — Warehouse (shown after retailer selected) */}
          {filters.retailerId && (
            <select
              className={`px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-400 min-w-44 transition-all ${warehousesLoading ? "border-blue-200 text-slate-400 animate-pulse" : "border-slate-200"}`}
              value={filters.warehouseId}
              onChange={(e) =>
                setFilters((p) => ({
                  ...p,
                  warehouseId: e.target.value,
                  page: 1,
                }))
              }
              disabled={warehousesLoading}
            >
              <option value="">
                {warehousesLoading ? "Loading…" : "All Warehouses"}
              </option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name || w.warehouse_name || w.id}
                </option>
              ))}
            </select>
          )}

          {/* Status */}
          <select
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-400 min-w-40"
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
          >
            {ALL_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* City */}
          <select
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-400 min-w-40"
            value={filters.city}
            onChange={(e) => handleFilterChange("city", e.target.value)}
          >
            <option value="">All Cities</option>
            <option value="gurugram">Gurugram</option>
            <option value="kanpur">Kanpur</option>
          </select>
        </div>

        {(filters.search || filters.status || filters.retailerId || filters.city) && (
          <button
            onClick={() =>
              setFilters({
                search: "",
                status: "",
                retailerId: "",
                warehouseId: "",
                city: "",
                page: 1,
                limit: 20,
              })
            }
            className="text-sm text-blue-600 hover:underline whitespace-nowrap"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 w-8" />
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Product Details
                </th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Retailer
                </th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                  Amount
                </th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={10}
                    className="py-16 text-center text-slate-500 text-sm"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
                      Loading orders…
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <Filter className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">
                      No orders found
                    </p>
                    <p className="text-slate-400 text-sm mt-1">
                      Try adjusting your filters
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    onItemStatusChange={handleItemStatusChange}
                    onViewOrder={(id) => navigate(`/orders/${id}`)}
                    navigate={navigate}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && orders.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <select
                className="rounded border border-slate-200 bg-white px-2 py-1 text-sm"
                value={filters.limit}
                onChange={(e) =>
                  handleFilterChange("limit", Number(e.target.value))
                }
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>per page</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <span>
                Page {filters.page} of {totalPages || 1} · {totalCount} total
              </span>
              <div className="flex gap-1">
                <button
                  disabled={filters.page <= 1}
                  onClick={() =>
                    setFilters((p) => ({ ...p, page: p.page - 1 }))
                  }
                  className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                <button
                  disabled={filters.page >= totalPages}
                  onClick={() =>
                    setFilters((p) => ({ ...p, page: p.page + 1 }))
                  }
                  className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderListPage;
