import React, { useState, useEffect, useCallback } from "react";
import { Wallet, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { DataTable } from "../../components/common";
import { Button } from "../../components/ui";
import InitiatePayoutModal from "../../components/retailers/settlements/InitiatePayoutModal";
import { useToast } from "../../context/ToastContext";
import api from "../../services/api";

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const isUrgent = (dateStr) => {
  if (!dateStr) return false;
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays > 3;
  } catch {
    return false;
  }
};

// ─── Skeleton Row ────────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <tr className="border-b border-slate-100 animate-pulse">
    {[180, 120, 120, 100, 90].map((w, i) => (
      <td key={i} className="px-6 py-4">
        <div
          className="h-4 bg-slate-200 rounded"
          style={{ width: `${w}px`, maxWidth: "100%" }}
        />
      </td>
    ))}
  </tr>
);

// ─── Empty State ─────────────────────────────────────────────────────────────

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
      <CheckCircle size={32} className="text-emerald-500" />
    </div>
    <h3 className="text-lg font-semibold text-slate-800 mb-1">
      All caught up!
    </h3>
    <p className="text-sm text-slate-500">No settlements due today.</p>
  </div>
);

// ─── Main component ──────────────────────────────────────────────────────────

const AdminGlobalSettlements = () => {
  const toast = useToast();

  const [settlements, setSettlements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchData = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      try {
        const res = await api.get("/settlements/admin/due-today");
        // Support both { data: [...] } and { data: { data: [...] } } shapes
        const list =
          res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
        setSettlements(list);
      } catch (err) {
        console.error("Failed to fetch due settlements:", err);
        toast.error("Failed to load due settlements. Please try again.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Modal handlers ───────────────────────────────────────────────────────

  const handlePayNow = (row) => {
    setSelectedRow(row);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedRow(null);
  };

  const handlePayoutSuccess = () => {
    setModalOpen(false);
    setSelectedRow(null);
    toast.success("Payout executed! Refreshing the list…");
    fetchData(true);
  };

  // ── Table columns ────────────────────────────────────────────────────────

  const columns = [
    {
      header: "Retailer Name",
      accessor: "retailer_name",
      render: (row) => (
        <span className="font-medium text-slate-800">
          {row.retailer_name || "—"}
        </span>
      ),
    },
    {
      header: "Total Owed",
      accessor: "total_owed",
      render: (row) => (
        <span className="font-bold text-green-600">
          {formatINR(row.total_owed)}
        </span>
      ),
    },
    {
      header: "Oldest Due Date",
      accessor: "oldest_due_date",
      render: (row) => {
        const urgent = isUrgent(row.oldest_due_date);
        return (
          <span
            className={`inline-flex items-center gap-1.5 text-sm ${
              urgent ? "text-red-600 font-medium" : "text-slate-600"
            }`}
          >
            {urgent && <AlertTriangle size={14} className="shrink-0" />}
            {formatDate(row.oldest_due_date)}
          </span>
        );
      },
    },
    {
      header: "Pending Items",
      accessor: "unsettled_ledgers_count",
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">
          {row.unsettled_ledgers_count ?? 0} items
        </span>
      ),
    },
    {
      header: <div className="text-right">Action</div>,
      accessor: "action",
      render: (row) => (
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handlePayNow(row);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 text-white whitespace-nowrap"
          >
            Pay Now
          </Button>
        </div>
      ),
    },
  ];

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 bg-bukizz-bg min-h-screen space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Wallet size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Due Settlements
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Retailers pending payment today across the platform
            </p>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => fetchData(true)}
          disabled={isRefreshing || isLoading}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-white rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats summary pill */}
      {!isLoading && settlements.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {settlements.length} retailer{settlements.length !== 1 ? "s" : ""}{" "}
            pending
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm font-medium">
            Total:{" "}
            <span className="text-green-600 font-bold">
              {formatINR(
                settlements.reduce(
                  (acc, r) => acc + (Number(r.total_owed) || 0),
                  0,
                ),
              )}
            </span>
          </span>
        </div>
      )}

      {/* Table card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          /* Skeleton */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  {[
                    "Retailer Name",
                    "Total Owed",
                    "Oldest Due Date",
                    "Pending Items",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </tbody>
            </table>
          </div>
        ) : settlements.length === 0 ? (
          <EmptyState />
        ) : (
          <DataTable
            columns={columns}
            data={settlements}
            emptyMessage="No settlements due today."
          />
        )}
      </div>

      {/* Initiate Payout Modal */}
      <InitiatePayoutModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        retailerId={selectedRow?.retailer_id}
        totalOwed={selectedRow?.total_owed}
        onSuccess={handlePayoutSuccess}
      />
    </div>
  );
};

export default AdminGlobalSettlements;
