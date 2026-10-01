import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Package,
  Store,
  GraduationCap,
  Truck,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Eye,
  ShieldCheck,
  CreditCard,
  Wallet,
  Smartphone,
  MessageSquare,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Filter,
  Search,
  X,
  Check,
  SlidersHorizontal,
} from "lucide-react";
import { getAdminDashboardOverview } from "../../services/dashboardService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

// ─── LocalStorage Persistence Config ─────────────────────────────────────────
const STORAGE_KEY = "bukizz_admin_dashboard_selected_retailers";

const getSavedRetailerIds = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Failed to parse saved retailer IDs from localStorage:", e);
  }
  return null;
};

const saveRetailerIds = (ids) => {
  try {
    if (Array.isArray(ids)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    }
  } catch (e) {
    console.error("Failed to save retailer IDs to localStorage:", e);
  }
};


// ─── Number / Currency Formatters ───────────────────────────────────────────
const formatINR = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
};

const formatCompactINR = (val) => {
  const num = Number(val) || 0;
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}k`;
  return `₹${num.toFixed(0)}`;
};

const formatNumber = (val) => {
  return new Intl.NumberFormat("en-IN").format(Number(val) || 0);
};

// ─── Status Config ──────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  processed: {
    label: "Processed",
    bg: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    color: "#3b82f6",
  },
  initialized: {
    label: "Initialized",
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    color: "#f59e0b",
  },
  shipped: {
    label: "Shipped",
    bg: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
    color: "#a855f7",
  },
  delivered: {
    label: "Delivered",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    color: "#10b981",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
    color: "#f43f5e",
  },
};

const PAYMENT_METHOD_CONFIG = {
  upi: { label: "UPI", icon: Smartphone, color: "#10b981", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cod: { label: "Cash on Delivery", icon: Wallet, color: "#f59e0b", bg: "bg-amber-50 text-amber-700 border-amber-200" },
  card: { label: "Card / Netbanking", icon: CreditCard, color: "#3b82f6", bg: "bg-blue-50 text-blue-700 border-blue-200" },
  wallet: { label: "Wallet", icon: Wallet, color: "#8b5cf6", bg: "bg-purple-50 text-purple-700 border-purple-200" },
};

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { user, isSuperAdmin, hasPermission } = useAuth();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeChartPoint, setActiveChartPoint] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // ─── Retailer Multi-Select Filter State ──────────────────────────────────
  const [selectedRetailerIds, setSelectedRetailerIds] = useState(() => getSavedRetailerIds());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [retailerSearch, setRetailerSearch] = useState("");
  const [tempSelectedIds, setTempSelectedIds] = useState([]);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Derived retailer lists from backend data
  const availableRetailers = useMemo(() => data?.availableRetailers || [], [data?.availableRetailers]);
  const activeRetailers = useMemo(() => availableRetailers.filter((r) => r.isActive), [availableRetailers]);
  const isFiltered = Boolean(data?.isFiltered || (selectedRetailerIds && selectedRetailerIds.length > 0));

  const selectedRetailersList = useMemo(() => {
    if (!selectedRetailerIds || selectedRetailerIds.length === 0) return [];
    const idSet = new Set(selectedRetailerIds);
    return availableRetailers.filter((r) => idSet.has(r.id));
  }, [availableRetailers, selectedRetailerIds]);

  const isAllActiveSelected = useMemo(() => {
    if (!selectedRetailerIds || activeRetailers.length === 0) return false;
    if (selectedRetailerIds.length !== activeRetailers.length) return false;
    const currentSet = new Set(selectedRetailerIds);
    return activeRetailers.every((r) => currentSet.has(r.id));
  }, [selectedRetailerIds, activeRetailers]);

  const filteredRetailersForDropdown = useMemo(() => {
    const q = retailerSearch.trim().toLowerCase();
    if (!q) return availableRetailers;
    return availableRetailers.filter(
      (r) =>
        (r.storeName && r.storeName.toLowerCase().includes(q)) ||
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q))
    );
  }, [availableRetailers, retailerSearch]);

  const fetchDashboardData = useCallback(async (idsToFetch = selectedRetailerIds, isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await getAdminDashboardOverview(idsToFetch || []);
      setData(res);
      setLastUpdated(new Date());

      // If user had never set localStorage, auto-default to all active retailers
      if (idsToFetch === null && res.availableRetailers?.length > 0) {
        const activeIds = res.availableRetailers
          .filter((r) => r.isActive)
          .map((r) => r.id);

        setSelectedRetailerIds(activeIds);
        saveRetailerIds(activeIds);

        // If dummy accounts exist, immediately re-fetch with clean active set
        const hasDummy = res.availableRetailers.some((r) => !r.isActive);
        if (hasDummy && activeIds.length > 0) {
          const cleanRes = await getAdminDashboardOverview(activeIds);
          setData(cleanRes);
        }
      }

      if (isManual) {
        toast.success("Dashboard metrics refreshed");
      }
    } catch (err) {
      console.error("Dashboard overview fetch error:", err);
      if (isManual) {
        toast.error("Failed to refresh dashboard data");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedRetailerIds, toast]);

  useEffect(() => {
    fetchDashboardData(selectedRetailerIds);
  }, []); // Run on mount

  // ─── Filter Action Handlers ──────────────────────────────────────────────
  const handleOpenDropdown = () => {
    setTempSelectedIds(selectedRetailerIds || []);
    setRetailerSearch("");
    setIsDropdownOpen((prev) => !prev);
  };

  const handleToggleTempRetailer = (retailerId) => {
    setTempSelectedIds((prev) => {
      if (prev.includes(retailerId)) {
        return prev.filter((id) => id !== retailerId);
      } else {
        return [...prev, retailerId];
      }
    });
  };

  const handleTempSelectAllActive = () => {
    const activeIds = availableRetailers.filter((r) => r.isActive).map((r) => r.id);
    setTempSelectedIds(activeIds);
  };

  const handleTempSelectAll = () => {
    const allIds = availableRetailers.map((r) => r.id);
    setTempSelectedIds(allIds);
  };

  const handleTempClear = () => {
    setTempSelectedIds([]);
  };

  const handleApplyDropdown = () => {
    setSelectedRetailerIds(tempSelectedIds);
    saveRetailerIds(tempSelectedIds);
    setIsDropdownOpen(false);
    fetchDashboardData(tempSelectedIds, true);
  };

  const handleRemoveChip = (retailerId) => {
    const updated = (selectedRetailerIds || []).filter((id) => id !== retailerId);
    setSelectedRetailerIds(updated);
    saveRetailerIds(updated);
    fetchDashboardData(updated, true);
  };

  const handleSelectAllActive = () => {
    const activeIds = availableRetailers.filter((r) => r.isActive).map((r) => r.id);
    setSelectedRetailerIds(activeIds);
    saveRetailerIds(activeIds);
    setIsDropdownOpen(false);
    fetchDashboardData(activeIds, true);
  };

  const handleShowAllPlatform = () => {
    setSelectedRetailerIds([]);
    saveRetailerIds([]);
    setIsDropdownOpen(false);
    fetchDashboardData([], true);
  };


  // Derived KPI values
  const kpis = data?.kpis || {
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    activeCustomers: 0,
    activeSchools: 0,
    activeRetailers: 0,
    totalProducts: 0,
    activeDeliveryPartners: 0,
  };

  const orderMetrics = data?.orderMetrics || { byStatus: {}, byPaymentMethod: {} };
  const pendingActions = data?.pendingActions || { pendingRetailers: 0, pendingSchoolRetailers: 0, openQueries: 0 };
  const timeline = data?.revenueTimeline || [];
  const recentOrders = data?.recentOrders || [];

  // Total pending alerts count
  const totalPendingAlerts =
    (pendingActions.pendingRetailers || 0) +
    (pendingActions.pendingSchoolRetailers || 0) +
    (pendingActions.openQueries || 0);

  // Status breakdown calculations
  const statusBreakdown = useMemo(() => {
    const total = kpis.totalOrders || 1;
    const items = Object.entries(orderMetrics.byStatus || {}).map(([status, stat]) => {
      const cfg = STATUS_CONFIG[status] || {
        label: status,
        bg: "bg-slate-100 text-slate-700 border-slate-200",
        dot: "bg-slate-400",
        color: "#64748b",
      };
      const count = stat.count || 0;
      const percentage = ((count / total) * 100).toFixed(1);
      return {
        status,
        label: cfg.label,
        count,
        revenue: stat.revenue || 0,
        percentage: Number(percentage),
        color: cfg.color,
        dot: cfg.dot,
        bg: cfg.bg,
      };
    });
    return items.sort((a, b) => b.count - a.count);
  }, [orderMetrics.byStatus, kpis.totalOrders]);

  // Payment method calculations
  const paymentBreakdown = useMemo(() => {
    const total = kpis.totalOrders || 1;
    return Object.entries(orderMetrics.byPaymentMethod || {}).map(([method, stat]) => {
      const cfg = PAYMENT_METHOD_CONFIG[method] || {
        label: method.toUpperCase(),
        icon: CreditCard,
        color: "#64748b",
        bg: "bg-slate-50 text-slate-700 border-slate-200",
      };
      const count = stat.count || 0;
      const percentage = ((count / total) * 100).toFixed(1);
      return {
        method,
        label: cfg.label,
        count,
        revenue: stat.revenue || 0,
        percentage: Number(percentage),
        color: cfg.color,
        icon: cfg.icon,
        bg: cfg.bg,
      };
    }).sort((a, b) => b.count - a.count);
  }, [orderMetrics.byPaymentMethod, kpis.totalOrders]);

  // SVG Chart Dimensions & Computations
  const chartHeight = 220;
  const chartWidth = 640;
  const padding = { top: 25, right: 30, bottom: 35, left: 60 };

  const chartData = useMemo(() => {
    if (!timeline || timeline.length === 0) {
      return [
        { period: "No Data", revenue: 0, orders: 0 },
        { period: "Current", revenue: 0, orders: 0 },
      ];
    }
    return timeline;
  }, [timeline]);

  const maxRevenue = useMemo(() => {
    const maxVal = Math.max(...chartData.map((d) => d.revenue || 0), 1000);
    return Math.ceil(maxVal * 1.15); // Add headroom
  }, [chartData]);

  // Compute SVG Points for Area & Line
  const points = useMemo(() => {
    const usableWidth = chartWidth - padding.left - padding.right;
    const usableHeight = chartHeight - padding.top - padding.bottom;
    const count = chartData.length;

    return chartData.map((item, idx) => {
      const x = padding.left + (idx / Math.max(count - 1, 1)) * usableWidth;
      const normalizedY = (item.revenue || 0) / maxRevenue;
      const y = chartHeight - padding.bottom - normalizedY * usableHeight;
      return { x, y, item, idx };
    });
  }, [chartData, maxRevenue, chartWidth, chartHeight, padding]);

  const linePathD = useMemo(() => {
    if (points.length === 0) return "";
    return points.reduce((acc, p, idx) => {
      if (idx === 0) return `M ${p.x} ${p.y}`;
      // Smooth cubic bezier curves between points
      const prev = points[idx - 1];
      const cp1x = prev.x + (p.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (p.x - prev.x) / 2;
      const cp2y = p.y;
      return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`;
    }, "");
  }, [points]);

  const areaPathD = useMemo(() => {
    if (points.length === 0) return "";
    const bottomY = chartHeight - padding.bottom;
    const first = points[0];
    const last = points[points.length - 1];
    return `${linePathD} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
  }, [linePathD, points, chartHeight, padding.bottom]);

  // Donut chart path calculations
  const donutSize = 180;
  const center = donutSize / 2;
  const radius = 64;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;
  const donutSlices = statusBreakdown.map((slice) => {
    const strokeDasharray = `${(slice.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -currentOffset;
    currentOffset += (slice.percentage / 100) * circumference;
    return {
      ...slice,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  if (isLoading && !data) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-200">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-200 rounded-lg"></div>
            <div className="h-4 w-96 bg-slate-100 rounded-lg"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-28 bg-slate-200 rounded-lg"></div>
            <div className="h-9 w-28 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-xl border border-slate-200"></div>
          ))}
        </div>
        <div className="h-80 bg-slate-100 rounded-xl border border-slate-200"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ─── Top Header Bar ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Executive Dashboard
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
              Admin Portal
            </span>
            {isFiltered && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Filtered ({selectedRetailerIds?.length} Vendors)
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            Real-time platform sales analytics, order fulfillment velocity, and operational triage.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Retailer Multi-Select Filter Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={handleOpenDropdown}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border transition-all cursor-pointer shadow-xs ${
                selectedRetailerIds && selectedRetailerIds.length > 0
                  ? "bg-orange-50 text-orange-950 border-orange-300 hover:bg-orange-100"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Store size={15} className={selectedRetailerIds?.length > 0 ? "text-orange-600" : "text-slate-500"} />
              <span className="font-semibold">Vendors</span>
              <span
                className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                  selectedRetailerIds?.length > 0
                    ? "bg-orange-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {selectedRetailerIds ? selectedRetailerIds.length : availableRetailers.length} / {availableRetailers.length}
              </span>
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown Menu Modal */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Header */}
                <div className="p-3.5 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900">
                      <SlidersHorizontal size={15} className="text-orange-600" />
                      <span>Filter Vendors</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {tempSelectedIds.length} of {availableRetailers.length} selected
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Filter metrics by vendors. Excludes dummy testing accounts from analytics.
                  </p>

                  {/* Search Vendor */}
                  <div className="mt-2.5 relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search vendor, store, or email..."
                      value={retailerSearch}
                      onChange={(e) => setRetailerSearch(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                    />
                    {retailerSearch && (
                      <button
                        type="button"
                        onClick={() => setRetailerSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={handleTempSelectAllActive}
                      className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      ★ Select All Active ({activeRetailers.length})
                    </button>
                    <button
                      type="button"
                      onClick={handleTempSelectAll}
                      className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      All ({availableRetailers.length})
                    </button>
                    <button
                      type="button"
                      onClick={handleTempClear}
                      className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Retailer items list */}
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 p-1">
                  {filteredRetailersForDropdown.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No retailers found matching "{retailerSearch}"
                    </div>
                  ) : (
                    filteredRetailersForDropdown.map((r) => {
                      const isSelected = tempSelectedIds.includes(r.id);
                      return (
                        <div
                          key={r.id}
                          onClick={() => handleToggleTempRetailer(r.id)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected ? "bg-orange-50/70" : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-orange-600 border-slate-300 focus:ring-orange-500 cursor-pointer pointer-events-none"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {r.name}
                                {r.storeName && r.storeName !== r.name && (
                                  <span className="font-normal text-slate-500 ml-1">
                                    ({r.storeName})
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                {r.email}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {r.isActive ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                Dummy / Test
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(false)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyDropdown}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-bukizz-navy hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <Check size={13} />
                    <span>Apply Filter ({tempSelectedIds.length})</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => fetchDashboardData(selectedRetailerIds, true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-xs hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={15} className={isRefreshing ? "animate-spin text-orange-500" : "text-slate-400"} />
            <span>Refresh</span>
          </button>

          <Link
            to="/orders"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-bukizz-navy hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
          >
            <ShoppingBag size={15} />
            <span>View Orders</span>
          </Link>
        </div>
      </div>

      {/* ─── Retailer Filter Active Status Bar & Chips ──────────────── */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider shrink-0">
            <Filter size={13} className="text-orange-600" />
            <span>Vendors Filter:</span>
          </div>

          {selectedRetailerIds && selectedRetailerIds.length > 0 ? (
            <>
              {selectedRetailersList.map((ret) => (
                <span
                  key={ret.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white text-slate-800 border border-slate-300 shadow-2xs hover:border-orange-300 transition-colors"
                >
                  <span className="truncate max-w-[140px] font-medium">
                    {ret.name}
                  </span>
                  {ret.isActive ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Active Retailer" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" title="Dummy/Test Retailer" />
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveChip(ret.id)}
                    className="text-slate-400 hover:text-rose-600 cursor-pointer p-0.5 rounded transition-colors"
                    title={`Remove ${ret.name} from filter`}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </>
          ) : (
            <span className="text-xs text-slate-600 italic">
              Showing platform-wide metrics (All vendors included, including dummy test accounts)
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end md:self-auto text-xs">
          {!isAllActiveSelected && (
            <button
              type="button"
              onClick={handleSelectAllActive}
              className="font-semibold text-orange-600 hover:text-orange-800 underline underline-offset-2 cursor-pointer transition-colors"
            >
              Select All Active ({activeRetailers.length})
            </button>
          )}
          {selectedRetailerIds && selectedRetailerIds.length > 0 && (
            <button
              type="button"
              onClick={handleShowAllPlatform}
              className="font-medium text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
            >
              Reset to All Vendors
            </button>
          )}
        </div>
      </div>


      {/* ─── Operational Triage / Attention Alert Bar ──────────────── */}
      {totalPendingAlerts > 0 && (
        <div className="bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 text-white rounded-lg shadow-xs shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  {totalPendingAlerts} Pending Operational Actions Require Attention
                </h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  Actionable onboarding requests, vendor links, and support tickets pending admin resolution.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {pendingActions.pendingRetailers > 0 && (
                <Link
                  to="/approvals/retailers"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 transition-colors shadow-2xs"
                >
                  <Store size={14} className="text-amber-600" />
                  <span>Retailers ({pendingActions.pendingRetailers})</span>
                  <ChevronRight size={12} />
                </Link>
              )}
              {pendingActions.openQueries > 0 && (
                <Link
                  to="/orderqueries"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 transition-colors shadow-2xs"
                >
                  <MessageSquare size={14} className="text-amber-600" />
                  <span>Open Queries ({pendingActions.openQueries})</span>
                  <ChevronRight size={12} />
                </Link>
              )}
              <Link
                to="/settlements/due-today"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 transition-colors shadow-2xs"
              >
                <Wallet size={14} className="text-amber-600" />
                <span>Due Settlements</span>
                <ChevronRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ─── Primary 4 KPI Metric Cards ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gross Sales Revenue */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative overflow-hidden transition-all hover:shadow-md hover:border-slate-300 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Gross Merchandise Value
            </span>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatINR(kpis.totalRevenue)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="inline-flex items-center font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                AOV: {formatINR(kpis.averageOrderValue)}
              </span>
              <span>across lifetime volume</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-emerald-500 to-teal-400" />
        </div>

        {/* Card 2: Total Orders */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative overflow-hidden transition-all hover:shadow-md hover:border-slate-300 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Order Volume
            </span>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:scale-105 transition-transform">
              <ShoppingBag size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatNumber(kpis.totalOrders)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="inline-flex items-center font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                {orderMetrics.byStatus?.processed?.count || 0} Processed
              </span>
              <span>• {orderMetrics.byStatus?.shipped?.count || 0} In-Transit</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-blue-500 to-indigo-400" />
        </div>

        {/* Card 3: Customer Ecosystem */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative overflow-hidden transition-all hover:shadow-md hover:border-slate-300 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Customer Base
            </span>
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 group-hover:scale-105 transition-transform">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatNumber(kpis.activeCustomers)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="inline-flex items-center font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                {kpis.activeSchools} Partner Schools
              </span>
              <span>• {kpis.activeRetailers} Retailers</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-purple-500 to-pink-400" />
        </div>

        {/* Card 4: Catalog & Logistics Fleet */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative overflow-hidden transition-all hover:shadow-md hover:border-slate-300 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Products & Logistics
            </span>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 group-hover:scale-105 transition-transform">
              <Package size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatNumber(kpis.totalProducts)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="inline-flex items-center font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                {kpis.activeDeliveryPartners} DP Fleet
              </span>
              <span>available for fulfillment</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-amber-500 to-orange-400" />
        </div>
      </div>

      {/* ─── Visual Analytics Section (2 Columns) ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Revenue Trend Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp size={18} className="text-orange-500" />
                  <span>Revenue & Order Volume Trajectory</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aggregated gross transaction flow over recent billing cycles
                </p>
              </div>

              {activeChartPoint && (
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-mono">
                    {activeChartPoint.item.period}:
                  </span>{" "}
                  <span className="text-sm font-bold text-slate-800">
                    {formatINR(activeChartPoint.item.revenue)}
                  </span>
                  <span className="text-xs text-slate-500 ml-1.5 font-medium">
                    ({activeChartPoint.item.orders} orders)
                  </span>
                </div>
              )}
            </div>

            {/* SVG Interactive Area Chart */}
            <div className="relative mt-4 w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-[220px] overflow-visible"
              >
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.32" />
                    <stop offset="90%" stopColor="#f97316" stopOpacity="0.02" />
                  </linearGradient>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ea580c" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>

                {/* Horizontal Guide Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                  const y = chartHeight - padding.bottom - pct * (chartHeight - padding.top - padding.bottom);
                  const labelVal = maxRevenue * pct;
                  return (
                    <g key={idx}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={chartWidth - padding.right}
                        y2={y}
                        stroke="#f1f5f9"
                        strokeDasharray={pct > 0 && pct < 1 ? "4 4" : "0"}
                        strokeWidth="1"
                      />
                      <text
                        x={padding.left - 8}
                        y={y + 3.5}
                        textAnchor="end"
                        className="text-[10px] fill-slate-400 font-mono"
                      >
                        {formatCompactINR(labelVal)}
                      </text>
                    </g>
                  );
                })}

                {/* Area Fill */}
                {areaPathD && (
                  <path d={areaPathD} fill="url(#revenueGradient)" />
                )}

                {/* Smooth Curve Line */}
                {linePathD && (
                  <path
                    d={linePathD}
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data Points & X-Axis Labels */}
                {points.map((p) => {
                  const isHovered = activeChartPoint?.idx === p.idx;
                  return (
                    <g
                      key={p.idx}
                      className="cursor-pointer group"
                      onMouseEnter={() => setActiveChartPoint(p)}
                      onMouseLeave={() => setActiveChartPoint(null)}
                    >
                      {/* Invisible hover trigger area */}
                      <rect
                        x={p.x - 20}
                        y={padding.top}
                        width={40}
                        height={chartHeight - padding.top - padding.bottom}
                        fill="transparent"
                      />

                      {/* Vertical crosshair line when hovered */}
                      {isHovered && (
                        <line
                          x1={p.x}
                          y1={padding.top}
                          x2={p.x}
                          y2={chartHeight - padding.bottom}
                          stroke="#cbd5e1"
                          strokeDasharray="3 3"
                          strokeWidth="1.5"
                        />
                      )}

                      {/* Point Outer Ring */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isHovered ? 7 : 4.5}
                        fill="#ffffff"
                        stroke="#ea580c"
                        strokeWidth={isHovered ? 3 : 2}
                        className="transition-all duration-150"
                      />

                      {/* X-Axis Month Label */}
                      <text
                        x={p.x}
                        y={chartHeight - 12}
                        textAnchor="middle"
                        className={`text-[11px] font-medium transition-colors ${
                          isHovered ? "fill-orange-600 font-bold" : "fill-slate-500"
                        }`}
                      >
                        {p.item.period}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
              <span>Gross Order Value Processed (₹)</span>
            </span>
            <span className="font-mono text-slate-400">Hover nodes to inspect month details</span>
          </div>
        </div>

        {/* Right: Order Status Distribution (Donut & Status Breakdown) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-blue-500" />
                <span>Fulfillment Status Mix</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribution across lifecycle pipeline
              </p>
            </div>

            {/* Donut Chart Visual */}
            <div className="mt-4 flex items-center justify-center relative">
              <svg width={donutSize} height={donutSize} className="transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke="#f1f5f9"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />

                {/* Slices */}
                {donutSlices.map((slice, idx) => (
                  <circle
                    key={idx}
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={slice.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={slice.strokeDasharray}
                    strokeDashoffset={slice.strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-300 hover:opacity-85"
                  />
                ))}
              </svg>

              {/* Center Metrics */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {formatNumber(kpis.totalOrders)}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Total Orders
                </span>
              </div>
            </div>

            {/* Status Legend Breakdown */}
            <div className="mt-4 space-y-2">
              {statusBreakdown.map((s) => (
                <div
                  key={s.status}
                  className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="font-medium text-slate-700">{s.label}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-900 font-bold">{formatNumber(s.count)}</span>
                    <span className="text-slate-400 text-[11px]">({s.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Terminal rate</span>
            <span className="font-semibold text-slate-700">
              {(((orderMetrics.byStatus?.delivered?.count || 0) / (kpis.totalOrders || 1)) * 100).toFixed(1)}% Completed
            </span>
          </div>
        </div>
      </div>

      {/* ─── Operational Command Center & Recent Orders (2 Columns) ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Orders Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag size={18} className="text-blue-600" />
                <span>Recent Platform Orders</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Latest customer purchases requiring verification and dispatch
              </p>
            </div>

            <Link
              to="/orders"
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No recent orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((ord) => {
                    const statusCfg = STATUS_CONFIG[ord.status] || {
                      label: ord.status,
                      bg: "bg-slate-100 text-slate-700 border-slate-200",
                    };
                    const payCfg = PAYMENT_METHOD_CONFIG[ord.paymentMethod] || {
                      label: (ord.paymentMethod || "COD").toUpperCase(),
                      bg: "bg-slate-50 text-slate-700 border-slate-200",
                    };

                    return (
                      <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                          {ord.id.substring(0, 8)}...
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{ord.customerName}</div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                            {ord.customerEmail}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${payCfg.bg}`}
                          >
                            {payCfg.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-right">
                          {formatINR(ord.totalAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusCfg.bg}`}
                          >
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Link
                            to={`/orders/${ord.id}`}
                            className="inline-flex items-center justify-center p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
                            title="Inspect Order Details"
                          >
                            <Eye size={15} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Showing latest {recentOrders.length} orders</span>
            <Link to="/orders" className="font-semibold text-slate-700 hover:text-orange-600">
              Manage Orders Directory →
            </Link>
          </div>
        </div>

        {/* Right Column: Payment Channels & Operational Shortcuts */}
        <div className="space-y-6">
          {/* Payment Method Share Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard size={18} className="text-emerald-600" />
                <span>Payment Channel Mix</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Transaction volume distribution by gateway
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {paymentBreakdown.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.method} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Icon size={14} style={{ color: item.color }} />
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-900 font-semibold">
                          {formatCompactINR(item.revenue)}
                        </span>
                        <span className="text-slate-400 text-[11px] font-mono">
                          ({item.percentage}%)
                        </span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Shortcuts & Navigation Hub */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-xs mb-3 text-slate-500">
              Operational Shortcuts
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to="/schools"
                className="flex flex-col p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all group"
              >
                <div className="flex items-center justify-between text-slate-600 group-hover:text-orange-600">
                  <GraduationCap size={18} />
                  <ArrowUpRight size={13} className="text-slate-400 group-hover:text-orange-500" />
                </div>
                <span className="font-bold text-slate-900 text-xs mt-2">Schools Directory</span>
                <span className="text-[11px] text-slate-400">{kpis.activeSchools} Active</span>
              </Link>

              <Link
                to="/retailers"
                className="flex flex-col p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all group"
              >
                <div className="flex items-center justify-between text-slate-600 group-hover:text-orange-600">
                  <Store size={18} />
                  <ArrowUpRight size={13} className="text-slate-400 group-hover:text-orange-500" />
                </div>
                <span className="font-bold text-slate-900 text-xs mt-2">Retailer Network</span>
                <span className="text-[11px] text-slate-400">{kpis.activeRetailers} Vendors</span>
              </Link>

              <Link
                to="/admin/delivery-partners"
                className="flex flex-col p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all group"
              >
                <div className="flex items-center justify-between text-slate-600 group-hover:text-orange-600">
                  <Truck size={18} />
                  <ArrowUpRight size={13} className="text-slate-400 group-hover:text-orange-500" />
                </div>
                <span className="font-bold text-slate-900 text-xs mt-2">Delivery Fleet</span>
                <span className="text-[11px] text-slate-400">{kpis.activeDeliveryPartners} Active DPs</span>
              </Link>

              <Link
                to="/admin/users/roles"
                className="flex flex-col p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all group"
              >
                <div className="flex items-center justify-between text-slate-600 group-hover:text-orange-600">
                  <ShieldCheck size={18} />
                  <ArrowUpRight size={13} className="text-slate-400 group-hover:text-orange-500" />
                </div>
                <span className="font-bold text-slate-900 text-xs mt-2">Access Control</span>
                <span className="text-[11px] text-slate-400">RBAC Directory</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
