import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Package,
  Printer,
  CheckCircle,
  MapPin,
  Phone,
  Mail,
  User,
  CreditCard,
  Truck,
  ShoppingBag,
  GraduationCap,
  Hash,
  Box,
  RefreshCw,
  Clock,
  XCircle,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import {
  fetchAdminOrderById,
  updateOrderItemStatus,
  updatePaymentInfo,
} from "../../services/orderService";

// ─────────────────────────────────────────────────────────────────────────────
// Constants / Helpers
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_FLOW = [
  "initialized",
  "processed",
  "shipped",
  "out_for_delivery",
  "delivered",
];

const STATUS_LABEL = {
  initialized: "New",
  processed: "Processed",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const STATUS_BADGE_CLASS = {
  initialized: "bg-yellow-100 text-yellow-800",
  processed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  out_for_delivery: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-slate-100 text-slate-700",
};

const STATUS_OPTIONS = [
  { value: "initialized", label: "New", color: "text-yellow-700 bg-yellow-50" },
  { value: "processed", label: "Processed", color: "text-blue-700 bg-blue-50" },
  { value: "shipped", label: "Shipped", color: "text-purple-700 bg-purple-50" },
  {
    value: "out_for_delivery",
    label: "Out for Delivery",
    color: "text-indigo-700 bg-indigo-50",
  },
  {
    value: "delivered",
    label: "Delivered",
    color: "text-green-700 bg-green-50",
  },
  { value: "cancelled", label: "Cancelled", color: "text-red-700 bg-red-50" },
  {
    value: "refunded",
    label: "Refunded",
    color: "text-slate-700 bg-slate-100",
  },
];

const PAYMENT_STATUS_CLASS = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-slate-100 text-slate-700",
};

const PAYMENT_STATUS_OPTIONS = [
  { value: "pending",  label: "Pending",  color: "text-yellow-700 bg-yellow-50" },
  { value: "paid",     label: "Paid",     color: "text-green-700 bg-green-50" },
  { value: "failed",   label: "Failed",   color: "text-red-700 bg-red-50" },
  { value: "refunded", label: "Refunded", color: "text-slate-700 bg-slate-100" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "cod",        label: "COD" },
  { value: "upi",        label: "UPI" },
  { value: "card",       label: "Card" },
  { value: "netbanking", label: "Netbanking" },
  { value: "wallet",     label: "Wallet" },
];

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function getOverallStatus(order) {
  const items = order?.items || [];
  if (!items.length) return order?.status || "initialized";
  const PRIORITY = [
    "initialized",
    "processed",
    "shipped",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "refunded",
  ];
  const idx = Math.min(
    ...items.map((i) => PRIORITY.indexOf(i.status)).filter((i) => i >= 0),
  );
  return idx < PRIORITY.length ? PRIORITY[idx] : order?.status || "initialized";
}

function shortenId(order) {
  if (order?.orderNumber) return order.orderNumber;
  return `#${(order?.id || "").replace(/-/g, "").slice(-8).toUpperCase()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Select Dropdown (no default browser option styling)
// ─────────────────────────────────────────────────────────────────────────────

function StatusSelect({ value, onChange, disabled = false, size = "md" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected =
    STATUS_OPTIONS.find((o) => o.value === value) || STATUS_OPTIONS[0];

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const sizeClass =
    size === "sm" ? "text-xs px-2.5 py-1.5" : "text-sm px-3 py-2.5";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center justify-between gap-2 w-full border rounded-xl font-semibold bg-white transition-all focus:outline-none focus:ring-2 focus:ring-orange-200 hover:border-slate-300 disabled:opacity-60 disabled:cursor-not-allowed ${sizeClass} ${selected.color} border-current/20 border`}
      >
        <span>{selected.label}</span>
        <ChevronDown
          className={`shrink-0 ${size === "sm" ? "h-3 w-3" : "h-4 w-4"} transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-48 rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 py-1 overflow-hidden">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left ${size === "sm" ? "text-xs px-3 py-1.5" : "text-sm px-4 py-2"} font-semibold flex items-center gap-2 transition-colors hover:bg-slate-50 ${opt.value === value ? `${opt.color} opacity-100` : "text-slate-700"}`}
            >
              <span
                className={`inline-block h-2 w-2 rounded-full shrink-0 ${opt.color.replace("text-", "bg-").split(" ")[0]}`}
              />
              {opt.label}
              {opt.value === value && (
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
// Reusable Cards
// ─────────────────────────────────────────────────────────────────────────────

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white rounded-2xl shadow-sm border border-slate-200 ${className}`}
  >
    {children}
  </div>
);
const CardHeader = ({ children }) => (
  <div className="px-6 pt-5 pb-4 border-b border-slate-100">{children}</div>
);
const CardTitle = ({ children, icon: Icon }) => (
  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
    {Icon && <Icon className="h-4 w-4" />}
    {children}
  </h3>
);
const CardContent = ({ children, className = "" }) => (
  <div className={`px-6 py-4 ${className}`}>{children}</div>
);
const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <Icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value || "—"}</p>
    </div>
  </div>
);
const SummaryRow = ({ label, value, className = "" }) => (
  <div className={`flex justify-between text-sm ${className}`}>
    <span className="text-slate-500">{label}</span>
    <span className="font-medium text-slate-800">{value}</span>
  </div>
);
const AddressBlock = ({ title, address }) => {
  if (!address) return null;
  const parts = [
    address.line1,
    address.line2,
    [address.city, address.state].filter(Boolean).join(", "),
    address.postalCode,
    address.country,
  ].filter(Boolean);
  return (
    <Card>
      <CardHeader>
        <CardTitle icon={MapPin}>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {parts.length === 0 ? (
          <p className="text-sm text-slate-400">No address on file</p>
        ) : (
          <address className="not-italic text-sm text-slate-700 leading-relaxed space-y-0.5">
            {address.recipientName && (
              <p className="font-semibold text-slate-900">
                {address.recipientName}
              </p>
            )}
            {address.studentName && (
              <p className="text-xs text-slate-500">
                Student: {address.studentName}
              </p>
            )}
            {parts.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {address.phone && (
              <p className="mt-1 text-slate-500">{address.phone}</p>
            )}
          </address>
        )}
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [error, setError] = useState(null);

  const fetchOrder = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchAdminOrderById(id);
      setOrder(res?.data || res);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to load order.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // ── Admin Override state ────────────────────────────────────────────────────
  const [overridePaymentStatus, setOverridePaymentStatus] = useState("");
  const [overridePaymentMethod, setOverridePaymentMethod] = useState("");
  const [overrideStatusMode, setOverrideStatusMode] = useState("single"); // "single" | "per-item"
  const [overrideSingleStatus, setOverrideSingleStatus] = useState("");
  const [overrideItemStatuses, setOverrideItemStatuses] = useState({});
  const [overrideSaving, setOverrideSaving] = useState(false);
  const [overrideSuccess, setOverrideSuccess] = useState("");

  // Sync override defaults when order loads
  useEffect(() => {
    if (order) {
      setOverridePaymentStatus(order.paymentStatus || "pending");
      setOverridePaymentMethod(order.paymentMethod || "cod");
      const items = order.items || [];
      const map = {};
      items.forEach((i) => { map[i.id] = i.status || "initialized"; });
      setOverrideItemStatuses(map);
      setOverrideSingleStatus(items[0]?.status || "initialized");
    }
  }, [order]);

  // Update a single item's status via /:orderId/items/:itemId/status
  const handleItemStatusChange = async (itemId, newStatus) => {
    setUpdatingItemId(itemId);
    setError(null);
    try {
      await updateOrderItemStatus(id, itemId, newStatus);
      setOrder((prev) => ({
        ...prev,
        items: (prev?.items || []).map((item) =>
          item.id === itemId ? { ...item, status: newStatus } : item,
        ),
      }));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update item status.",
      );
    } finally {
      setUpdatingItemId(null);
    }
  };

  // Admin override — save all changes
  const handleOverrideSave = async () => {
    setOverrideSaving(true);
    setError(null);
    setOverrideSuccess("");
    const promises = [];
    const items = order?.items || [];

    // 1. Payment update
    promises.push(
      updatePaymentInfo(id, {
        paymentStatus: overridePaymentStatus,
        paymentMethod: overridePaymentMethod,
      })
    );

    // 2. Item statuses
    if (overrideStatusMode === "single") {
      // Apply the same status to every item
      items.forEach((item) => {
        promises.push(updateOrderItemStatus(id, item.id, overrideSingleStatus));
      });
    } else {
      // Per-item
      items.forEach((item) => {
        const newS = overrideItemStatuses[item.id];
        if (newS && newS !== item.status) {
          promises.push(updateOrderItemStatus(id, item.id, newS));
        }
      });
    }

    try {
      await Promise.all(promises);
      // Refresh
      await fetchOrder();
      setOverrideSuccess("All changes saved successfully.");
      setTimeout(() => setOverrideSuccess(""), 4000);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to save some changes.",
      );
    } finally {
      setOverrideSaving(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <span className="ml-3 text-slate-500">Loading order…</span>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="p-8 space-y-4">
        <button
          onClick={() => navigate("/orders")}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </button>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
          <p className="text-lg font-semibold text-slate-700">{error}</p>
          <button
            onClick={fetchOrder}
            className="mt-4 flex items-center gap-2 text-sm px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const items = order.items || [];
  const shippingAddr = order.shippingAddress || {};
  const billingAddr = order.billingAddress || {};
  const summary = order.metadata?.orderSummary || {};
  const events = order.events || order.timeline || [];
  const status = getOverallStatus(order);
  const currentStepIdx = STATUS_FLOW.indexOf(status);
  const dispatchId = items[0]?.dispatchId;

  return (
    <div className="p-6 space-y-6 bg-[#F8F9FC] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/orders")}
            className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-all text-slate-400"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">
                {dispatchId || shortenId(order)}
              </h1>
              {dispatchId && (
                <span className="text-sm text-slate-400 font-mono">
                  {shortenId(order)}
                </span>
              )}
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${STATUS_BADGE_CLASS[status] || "bg-slate-100 text-slate-700"}`}
              >
                {STATUS_LABEL[status] || status}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-white hover:shadow-sm transition-all">
            <Printer className="h-4 w-4" /> Print Invoice
          </button>
          {order.contactEmail && (
            <a
              href={`mailto:${order.contactEmail}`}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-white hover:shadow-sm transition-all"
            >
              <Mail className="h-4 w-4" /> Contact Customer
            </a>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 text-sm font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Status Timeline */}
      {!["cancelled", "refunded"].includes(status) ? (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              {STATUS_FLOW.map((step, i) => {
                const done = currentStepIdx >= i;
                const current = currentStepIdx === i;
                return (
                  <React.Fragment key={step}>
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${done ? "border-orange-500 bg-orange-500 text-white" : "border-slate-200 bg-white text-slate-400"} ${current ? "ring-4 ring-orange-100" : ""}`}
                      >
                        {done ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <span className="text-xs font-bold">{i + 1}</span>
                        )}
                      </div>
                      <span
                        className={`text-xs font-medium text-center max-w-20 ${done ? "text-orange-700" : "text-slate-400"}`}
                      >
                        {STATUS_LABEL[step]}
                      </span>
                    </div>
                    {i < STATUS_FLOW.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-2 ${currentStepIdx > i ? "bg-orange-400" : "bg-slate-200"}`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <XCircle className="h-5 w-5 text-red-500" />
          <span className="text-sm font-semibold text-red-700">
            This order has been {status}.
          </span>
        </div>
      )}


      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle icon={Package}>Order Items ({items.length})</CardTitle>
            </CardHeader>
            <CardContent className="py-0">
              <div className="divide-y divide-slate-100">
                {items.map((item) => {
                  const snap = item.productSnapshot || {};
                  const img =
                    item.variant?.options?.find((o) => o.imageUrl)?.imageUrl ||
                    snap.image ||
                    snap.image_url;
                  const isBookset = snap.productType === "bookset";
                  const isUpdating = updatingItemId === item.id;

                  return (
                    <div key={item.id} className="py-5 space-y-3">
                      <div className="flex gap-4">
                        {/* Thumbnail */}
                        <div
                          className={`h-16 w-16 shrink-0 rounded-xl flex items-center justify-center overflow-hidden border ${img ? "bg-slate-50 border-slate-200" : isBookset ? "bg-violet-50 border-violet-100" : "bg-slate-100 border-slate-200"}`}
                        >
                          {img ? (
                            <img
                              src={img}
                              alt={item.title}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : isBookset ? (
                            <GraduationCap className="h-7 w-7 text-violet-400" />
                          ) : (
                            <ShoppingBag className="h-7 w-7 text-slate-300" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate">
                            {item.title || snap.title || "Product"}
                            {item.schoolName && (
                              <span className="text-slate-400 ml-1 font-normal text-sm">
                                — {item.schoolName}
                              </span>
                            )}
                          </p>

                          {/* Variant options */}
                          {item.variant?.options?.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {item.variant.options
                                .sort(
                                  (a, b) =>
                                    (a.attribute?.position || 0) -
                                    (b.attribute?.position || 0),
                                )
                                .map((opt) => (
                                  <span
                                    key={opt.id}
                                    className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 rounded-md px-2 py-0.5"
                                  >
                                    {opt.imageUrl && (
                                      <img
                                        src={opt.imageUrl}
                                        alt={opt.value}
                                        className="h-3 w-3 rounded-full object-cover"
                                      />
                                    )}
                                    <span className="font-medium capitalize">
                                      {opt.attribute?.name}:
                                    </span>
                                    <span className="capitalize">
                                      {opt.value}
                                    </span>
                                  </span>
                                ))}
                            </div>
                          )}

                          <div className="mt-1.5 flex flex-wrap gap-x-4 text-xs text-slate-500">
                            {item.sku && (
                              <span className="flex items-center gap-1">
                                <Hash className="h-3 w-3" />
                                {item.sku}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Box className="h-3 w-3" />
                              Qty: {item.quantity}
                            </span>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right shrink-0">
                          <p className="font-bold text-slate-900">
                            {formatCurrency(item.totalPrice)}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {formatCurrency(item.unitPrice)} × {item.quantity}
                          </p>
                        </div>
                      </div>

                      {/* Per-item controls: status dropdown + view detail link */}
                      <div className="flex items-center gap-3 pl-20">
                        <div className="w-48">
                          <StatusSelect
                            value={item.status || "initialized"}
                            onChange={(newStatus) =>
                              handleItemStatusChange(item.id, newStatus)
                            }
                            disabled={isUpdating}
                            size="sm"
                          />
                        </div>
                        {isUpdating && (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                        )}
                        <button
                          onClick={() =>
                            navigate(`/orders/${id}/items/${item.id}`)
                          }
                          className="ml-auto flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View Item Detail
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Summary */}
              <div className="border-t border-slate-100 pt-4 pb-4 space-y-2">
                <SummaryRow
                  label="Subtotal"
                  value={formatCurrency(summary.subtotal || order.totalAmount)}
                />
                {summary.discount > 0 && (
                  <SummaryRow
                    label="Discount"
                    value={`-${formatCurrency(summary.discount)}`}
                    className="text-emerald-600"
                  />
                )}
                {summary.deliveryFee > 0 && (
                  <SummaryRow
                    label="Delivery Fee"
                    value={formatCurrency(summary.deliveryFee)}
                  />
                )}
                {summary.platformFee > 0 && (
                  <SummaryRow
                    label="Platform Fee"
                    value={formatCurrency(summary.platformFee)}
                  />
                )}
                {summary.tax > 0 && (
                  <SummaryRow label="Tax" value={formatCurrency(summary.tax)} />
                )}
                <div className="flex justify-between font-bold text-base text-slate-900 pt-2 border-t border-slate-100">
                  <span>Total</span>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AddressBlock title="Shipping Address" address={shippingAddr} />
            <AddressBlock title="Billing Address" address={billingAddr} />
          </div>

          {/* Activity History */}
          {events.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle icon={Clock}>Activity History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pl-3 space-y-6">
                  <div className="absolute left-4.5 top-2 bottom-2 w-px bg-slate-200" />
                  {events.map((event, idx) => (
                    <div
                      key={event.id || idx}
                      className="relative flex gap-4 items-start"
                    >
                      <div
                        className={`z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm ${idx === 0 ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-500"}`}
                      >
                        {(event.newStatus || event.new_status) === "shipped" ? (
                          <Truck className="h-3.5 w-3.5" />
                        ) : (event.newStatus || event.new_status) ===
                          "delivered" ? (
                          <CheckCircle className="h-3.5 w-3.5" />
                        ) : (event.newStatus || event.new_status) ===
                          "cancelled" ? (
                          <XCircle className="h-3.5 w-3.5" />
                        ) : (
                          <RefreshCw
                            className={`h-3.5 w-3.5 ${idx === 0 ? "animate-spin" : ""}`}
                          />
                        )}
                      </div>
                      <div className="pt-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {STATUS_LABEL[event.newStatus || event.new_status] ||
                            event.newStatus ||
                            event.new_status ||
                            "Update"}
                        </p>
                        {event.note && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {event.note}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDate(event.createdAt || event.created_at)}
                        </p>
                        {(event.changedBy || event.changed_by) && (
                          <span className="text-xs text-slate-400">
                            by{" "}
                            {event.users?.full_name ||
                              event.changedBy ||
                              event.changed_by}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right — 1/3 */}
        <div className="space-y-6">
          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle icon={User}>Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-orange-50 text-orange-600 font-bold text-sm flex items-center justify-center border border-orange-100 shrink-0">
                  {(
                    order.shippingAddress?.recipientName ||
                    order.contactEmail ||
                    "C"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {order.shippingAddress?.recipientName ||
                      order.contactEmail ||
                      "Customer"}
                  </p>
                  <p className="text-xs text-slate-400">Customer</p>
                </div>
              </div>
              <div className="space-y-3">
                <InfoRow icon={Mail} label="Email" value={order.contactEmail} />
                <InfoRow
                  icon={Phone}
                  label="Phone"
                  value={order.contactPhone || order.shippingAddress?.phone}
                />
                {shippingAddr.studentName && (
                  <InfoRow
                    icon={GraduationCap}
                    label="Student"
                    value={shippingAddr.studentName}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle icon={CreditCard}>Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Method</span>
                  <span className="text-sm font-semibold text-slate-900 uppercase">
                    {order.paymentMethod || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Status</span>
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${PAYMENT_STATUS_CLASS[order.paymentStatus] || "bg-slate-100 text-slate-700"}`}
                  >
                    {order.paymentStatus || "—"}
                  </span>
                </div>
                {order.paymentCollectionMethod && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Collection</span>
                    <span className="text-sm font-semibold text-slate-900 uppercase">
                      {order.paymentCollectionMethod}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-sm font-bold text-slate-900">
                    Total
                  </span>
                  <span className="text-base font-bold text-orange-500">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warehouse */}
          {order.warehouseId && (
            <Card>
              <CardHeader>
                <CardTitle icon={Package}>Warehouse</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 font-mono">
                      {order.warehouseId}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Warehouse ID
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Admin Override Panel ──────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle icon={CreditCard}>Admin Override</CardTitle>
              <p className="text-xs text-slate-400 mt-1">Update payment &amp; status manually</p>
            </CardHeader>
            <CardContent>
              {overrideSuccess && (
                <div className="mb-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700 flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0" />{overrideSuccess}
                </div>
              )}

              <div className="space-y-4">
                {/* Payment Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Payment Status</label>
                  <select
                    value={overridePaymentStatus}
                    onChange={(e) => setOverridePaymentStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                  >
                    {PAYMENT_STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Payment Method</label>
                  <select
                    value={overridePaymentMethod}
                    onChange={(e) => setOverridePaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                  >
                    {PAYMENT_METHOD_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Order Item Statuses */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Item Status</label>
                  <div className="flex bg-slate-100 rounded-md p-0.5 text-[10px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setOverrideStatusMode("single")}
                      className={`px-2 py-1 rounded transition-all ${overrideStatusMode === "single" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setOverrideStatusMode("per-item")}
                      className={`px-2 py-1 rounded transition-all ${overrideStatusMode === "per-item" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                    >
                      Each
                    </button>
                  </div>
                </div>

                {overrideStatusMode === "single" ? (
                  <div className="bg-slate-50 rounded-xl border border-slate-100 p-3">
                    <p className="text-[10px] text-slate-400 mb-1.5">Applies to all {items.length} item(s)</p>
                    <StatusSelect
                      value={overrideSingleStatus}
                      onChange={setOverrideSingleStatus}
                      size="sm"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {items.map((item) => (
                      <div key={item.id} className="bg-slate-50 rounded-lg border border-slate-100 px-3 py-2">
                        <p className="text-xs font-medium text-slate-700 truncate mb-1">{item.title}</p>
                        <StatusSelect
                          value={overrideItemStatuses[item.id] || "initialized"}
                          onChange={(v) => setOverrideItemStatuses((prev) => ({ ...prev, [item.id]: v }))}
                          size="sm"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Save Button */}
              <button
                onClick={handleOverrideSave}
                disabled={overrideSaving}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                {overrideSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {overrideSaving ? "Saving…" : "Save All Changes"}
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
