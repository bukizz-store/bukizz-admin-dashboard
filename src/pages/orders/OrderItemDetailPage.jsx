import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Package,
  CheckCircle,
  Hash,
  Box,
  RefreshCw,
  Clock,
  XCircle,
  Truck,
  MapPin,
  Building2,
  Tag,
  ChevronDown,
  GraduationCap,
  ShoppingBag,
  Info,
} from "lucide-react";
import {
  fetchAdminOrderById,
  updateOrderItemStatus,
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

const STATUS_OPTIONS = [
  {
    value: "initialized",
    label: "New",
    dot: "bg-yellow-400",
    card: "bg-yellow-50 border-yellow-200 text-yellow-800",
  },
  {
    value: "processed",
    label: "Processed",
    dot: "bg-blue-400",
    card: "bg-blue-50 border-blue-200 text-blue-800",
  },
  {
    value: "shipped",
    label: "Shipped",
    dot: "bg-purple-400",
    card: "bg-purple-50 border-purple-200 text-purple-800",
  },
  {
    value: "out_for_delivery",
    label: "Out for Delivery",
    dot: "bg-indigo-400",
    card: "bg-indigo-50 border-indigo-200 text-indigo-800",
  },
  {
    value: "delivered",
    label: "Delivered",
    dot: "bg-green-400",
    card: "bg-green-50 border-green-200 text-green-800",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    dot: "bg-red-400",
    card: "bg-red-50 border-red-200 text-red-800",
  },
  {
    value: "refunded",
    label: "Refunded",
    dot: "bg-slate-400",
    card: "bg-slate-50 border-slate-200 text-slate-600",
  },
];

const getOpt = (val) =>
  STATUS_OPTIONS.find((o) => o.value === val) || STATUS_OPTIONS[0];

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

// ─────────────────────────────────────────────────────────────────────────────
// Custom Status Select — no browser default option styling
// ─────────────────────────────────────────────────────────────────────────────

function StatusSelect({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = getOpt(value);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center justify-between w-full gap-3 px-4 py-3 rounded-xl border font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all hover:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed ${selected.card}`}
      >
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${selected.dot}`} />
          {selected.label}
        </div>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70 py-1.5 overflow-hidden">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-50 ${opt.value === value ? `${opt.card} border-0` : "text-slate-700"}`}
            >
              <span className={`h-2 w-2 rounded-full shrink-0 ${opt.dot}`} />
              {opt.label}
              {opt.value === value && (
                <span className="ml-auto text-xs text-slate-400 font-normal">
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
// Card helpers
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
  <div className={`px-6 py-5 ${className}`}>{children}</div>
);

const DataRow = ({ label, value, mono = false }) => (
  <div className="flex justify-between items-start gap-4 py-2.5 border-b border-slate-50 last:border-0">
    <span className="text-sm text-slate-500 shrink-0">{label}</span>
    <span
      className={`text-sm font-semibold text-slate-900 text-right ${mono ? "font-mono text-xs" : ""}`}
    >
      {value || "—"}
    </span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

const OrderItemDetailPage = () => {
  const { id: orderId, itemId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchAdminOrderById(orderId);
      const orderData = res?.data || res;
      setOrder(orderData);

      const found = (orderData.items || []).find((i) => i.id === itemId);
      if (!found) throw new Error("Item not found in this order.");
      setItem(found);
      setSelectedStatus(found.status || "initialized");
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to load item.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [orderId, itemId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdate = async () => {
    if (!selectedStatus || selectedStatus === item?.status) return;
    setIsUpdating(true);
    setError(null);
    setSuccess(null);
    try {
      await updateOrderItemStatus(orderId, itemId, selectedStatus);
      setItem((prev) => ({ ...prev, status: selectedStatus }));
      setSuccess("Item status updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update status.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <span className="ml-3 text-slate-500">Loading item…</span>
      </div>
    );
  }

  if (error && !item) {
    return (
      <div className="p-8 space-y-4">
        <button
          onClick={() => navigate(`/orders/${orderId}`)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Order
        </button>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
          <p className="text-lg font-semibold text-slate-700">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 flex items-center gap-2 text-sm px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!item || !order) return null;

  const snap = item.productSnapshot || {};
  const img =
    item.variant?.options?.find((o) => o.imageUrl)?.imageUrl ||
    snap.image ||
    snap.image_url;
  const isBookset = snap.productType === "bookset";
  const currentOpt = getOpt(item.status);
  const currentStepIdx = STATUS_FLOW.indexOf(item.status || "initialized");
  const orderEvents = (order.events || order.timeline || []).filter(
    (e) => e.orderItemId === itemId || e.order_item_id === itemId,
  );

  return (
    <div className="p-6 space-y-6 bg-[#F8F9FC] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/orders/${orderId}`)}
            className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-all text-slate-400"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 font-mono">
                {item.dispatchId || item.id?.substring(0, 12)}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${currentOpt.card}`}
              >
                {currentOpt.label}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              Order:{" "}
              <button
                onClick={() => navigate(`/orders/${orderId}`)}
                className="text-blue-600 hover:underline font-medium"
              >
                {order.orderNumber || orderId?.substring(0, 12)}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}
      {success && (
        <div className="flex gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
          <p className="text-sm text-green-700 flex-1">{success}</p>
          <button
            onClick={() => setSuccess(null)}
            className="text-green-400 hover:text-green-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Status Progress */}
      {!["cancelled", "refunded"].includes(item.status) ? (
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
            This item has been {item.status}.
          </span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Detail */}
          <Card>
            <CardHeader>
              <CardTitle icon={Package}>Product Detail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-5">
                {/* Image */}
                <div
                  className={`h-24 w-24 shrink-0 rounded-2xl flex items-center justify-center overflow-hidden border-2 ${img ? "bg-slate-50 border-slate-200" : isBookset ? "bg-violet-50 border-violet-200" : "bg-slate-100 border-slate-200"}`}
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
                    <GraduationCap className="h-10 w-10 text-violet-400" />
                  ) : (
                    <ShoppingBag className="h-10 w-10 text-slate-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-lg font-bold text-slate-900 leading-tight">
                    {item.title || snap.title || "Product"}
                  </p>
                  {item.schoolName && (
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <GraduationCap className="h-3.5 w-3.5" />{" "}
                      {item.schoolName}
                    </p>
                  )}

                  {/* Variant Options */}
                  {item.variant?.options?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.variant.options
                        .sort(
                          (a, b) =>
                            (a.attribute?.position || 0) -
                            (b.attribute?.position || 0),
                        )
                        .map((opt) => (
                          <span
                            key={opt.id}
                            className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1 font-medium"
                          >
                            {opt.imageUrl && (
                              <img
                                src={opt.imageUrl}
                                alt={opt.value}
                                className="h-3.5 w-3.5 rounded-full object-cover"
                              />
                            )}
                            <span className="text-slate-500 capitalize">
                              {opt.attribute?.name}:
                            </span>
                            <span className="capitalize">{opt.value}</span>
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-400 mb-1">Unit Price</p>
                  <p className="text-base font-bold text-slate-900">
                    {formatCurrency(item.unitPrice)}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-400 mb-1">Quantity</p>
                  <p className="text-base font-bold text-slate-900">
                    × {item.quantity}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 text-center col-span-2">
                  <p className="text-xs text-orange-500 mb-1 font-semibold">
                    Item Total
                  </p>
                  <p className="text-xl font-bold text-orange-600">
                    {formatCurrency(
                      item.totalPrice || item.unitPrice * item.quantity,
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-0">
                {item.sku && <DataRow label="SKU" value={item.sku} mono />}
                {snap.productType && (
                  <DataRow label="Type" value={snap.productType} />
                )}
                {snap.brand && <DataRow label="Brand" value={snap.brand} />}
                {snap.category && (
                  <DataRow label="Category" value={snap.category} />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Warehouse Details */}
          <Card>
            <CardHeader>
              <CardTitle icon={Building2}>Warehouse</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <DataRow label="Warehouse ID" value={item.warehouseId} mono />
              {item.orderId && (
                <DataRow label="Order ID" value={item.orderId} mono />
              )}
              {item.id && <DataRow label="Item ID" value={item.id} mono />}
            </CardContent>
          </Card>

          {/* Shipping Address (from order) */}
          {order.shippingAddress && (
            <Card>
              <CardHeader>
                <CardTitle icon={MapPin}>Delivery Address</CardTitle>
              </CardHeader>
              <CardContent>
                <address className="not-italic text-sm text-slate-700 leading-relaxed space-y-0.5">
                  {order.shippingAddress.recipientName && (
                    <p className="font-semibold text-slate-900">
                      {order.shippingAddress.recipientName}
                    </p>
                  )}
                  {order.shippingAddress.studentName && (
                    <p className="text-xs text-slate-500">
                      Student: {order.shippingAddress.studentName}
                    </p>
                  )}
                  {[
                    order.shippingAddress.line1,
                    order.shippingAddress.line2,
                    [order.shippingAddress.city, order.shippingAddress.state]
                      .filter(Boolean)
                      .join(", "),
                    order.shippingAddress.postalCode,
                    order.shippingAddress.country,
                  ]
                    .filter(Boolean)
                    .map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  {order.shippingAddress.phone && (
                    <p className="mt-1 text-slate-500">
                      {order.shippingAddress.phone}
                    </p>
                  )}
                </address>
              </CardContent>
            </Card>
          )}

          {/* Item Activity History */}
          {orderEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle icon={Clock}>Item Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pl-3 space-y-5">
                  <div className="absolute left-4.5 top-2 bottom-2 w-px bg-slate-200" />
                  {orderEvents.map((event, idx) => (
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
                        {(event.users?.full_name || event.changedBy) && (
                          <p className="text-xs text-slate-400">
                            by {event.users?.full_name || event.changedBy}
                          </p>
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
          {/* Update Status */}
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wider">
                  Current
                </p>
                <div
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border font-bold text-sm ${currentOpt.card}`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${currentOpt.dot}`}
                  />
                  {currentOpt.label}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wider">
                  Change To
                </p>
                <StatusSelect
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  disabled={isUpdating}
                />
              </div>
              <button
                onClick={handleUpdate}
                disabled={isUpdating || selectedStatus === item.status}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3 rounded-xl shadow-sm shadow-orange-100 hover:shadow-orange-200 transition-all text-sm flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Updating…
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" /> Apply Status Change
                  </>
                )}
              </button>
            </CardContent>
          </Card>

          {/* Order Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle icon={Info}>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <DataRow label="Order #" value={order.orderNumber} mono />
              <DataRow label="Order Date" value={formatDate(order.createdAt)} />
              <DataRow label="Payment" value={order.paymentStatus} />
              <DataRow
                label="Method"
                value={order.paymentMethod?.toUpperCase()}
              />
              <div className="flex justify-between items-center pt-3 mt-1 border-t border-slate-100">
                <span className="text-sm text-slate-500">Order Total</span>
                <span className="text-base font-bold text-orange-500">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <DataRow
                label="Name"
                value={order.shippingAddress?.recipientName}
              />
              <DataRow label="Email" value={order.contactEmail} />
              <DataRow
                label="Phone"
                value={order.contactPhone || order.shippingAddress?.phone}
              />
              {order.shippingAddress?.studentName && (
                <DataRow
                  label="Student"
                  value={order.shippingAddress.studentName}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderItemDetailPage;
