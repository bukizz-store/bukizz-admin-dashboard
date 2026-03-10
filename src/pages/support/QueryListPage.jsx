import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  AlertCircle,
  Clock,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { fetchQueries } from "../../services/queryService";
import { DataTable } from "../../components/common";
import { Button } from "../../components/ui";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const TAB_STATUS_MAP = {
  all: "",
  open: "open",
  resolved: "resolved",
};

// ─── Component ────────────────────────────────────────────────────────────────

const QueryListPage = () => {
  const navigate = useNavigate();

  // Filter / pagination state
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Data state
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  // Stats Data (placeholder — no dedicated stats endpoint yet)
  const stats = {
    unassigned: 12,
    avgResponse: "1.4h",
    resolvedToday: 28,
  };

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const loadQueries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchQueries({
        page,
        limit,
        status: TAB_STATUS_MAP[activeTab],
        search: debouncedSearch,
      });
      console.log("query data: ", res.data);
      const data = res;
      setQueries(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to fetch queries:", err);
      setError("Failed to load support queries. Please try again.");
      setQueries([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, activeTab, debouncedSearch]);

  useEffect(() => {
    loadQueries();
  }, [loadQueries]);

  // Reset to page 1 when tab or search changes
  useEffect(() => {
    setPage(1);
  }, [activeTab, debouncedSearch]);

  // ── Column Definitions ────────────────────────────────────────────────────

  const columns = [
    {
      header: "TICKET ID",
      accessor: "ticketId",
      className: "w-[120px]",
      render: (row) => (
        <span
          className="font-bold text-slate-900 cursor-pointer hover:text-bukizz-orange"
          onClick={() => navigate(`/orderqueries/${row.id}`)}
        >
          {row.ticketId}
        </span>
      ),
    },
    {
      header: "SUBJECT",
      accessor: "subject",
      className: "w-[300px]",
      render: (row) => (
        <div
          onClick={() => navigate(`/orderqueries/${row.id}`)}
          className="cursor-pointer group"
        >
          <div className="font-bold text-slate-900 group-hover:text-bukizz-orange transition-colors">
            {row.subject}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Customer: {row.customer?.name || "—"}
          </div>
        </div>
      ),
    },
    {
      header: "ORDER #",
      accessor: "order",
      render: (row) => (
        <span
          className="font-bold text-orange-500 hover:text-orange-600 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            // Navigate to order if we can — orderId not in list response, so just display
          }}
        >
          {row.order?.orderNumber || "—"}
        </span>
      ),
    },
    {
      header: "PRIORITY",
      accessor: "priority",
      render: (row) => {
        const p = (row.priority || "").toLowerCase();
        const styles = {
          high: "bg-red-100 text-red-700",
          medium: "bg-orange-100 text-orange-700",
          low: "bg-blue-100 text-blue-700",
        };
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${styles[p] || "bg-slate-100 text-slate-600"}`}
          >
            {row.priority}
          </span>
        );
      },
    },
    {
      header: "STATUS",
      accessor: "status",
      render: (row) => {
        const s = (row.status || "").toLowerCase();
        const styles = {
          open: "text-slate-700",
          in_progress: "text-slate-700",
          resolved: "text-green-600",
        };
        return (
          <span
            className={`text-sm font-medium capitalize ${styles[s] || "text-slate-600"}`}
          >
            {row.status}
          </span>
        );
      },
    },
    {
      header: "CREATED AT",
      accessor: "createdAt",
      className: "text-right",
      render: (row) => {
        const date = new Date(row.createdAt);
        return (
          <span className="text-sm text-slate-500">
            {date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
            ,{" "}
            {date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        );
      },
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-8 bg-[#F8F9FC] min-h-screen font-sans">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        {/* Search */}
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-bukizz-orange transition-colors" />
          <input
            type="text"
            placeholder="Search by Ticket ID or Order #..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-bukizz-orange transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4">
          {/* Refresh */}
          <button
            onClick={loadQueries}
            disabled={loading}
            className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw
              size={20}
              className={loading ? "animate-spin" : ""}
            />
          </button>

          <Button className="bg-bukizz-orange hover:bg-orange-600 text-white font-bold px-6 py-2.5 shadow-md shadow-orange-200">
            <Plus size={18} className="mr-2" />
            New Ticket
          </Button>
        </div>
      </div>

      {/* Title & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            Support Queries
          </h1>
          <p className="text-slate-500 text-sm">
            Manage and respond to customer order inquiries
          </p>
        </div>

        <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
          {["all", "open", "resolved"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-1.5 text-sm font-semibold rounded-md transition-all ${
                activeTab === tab
                  ? "bg-bukizz-orange text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center gap-2 mb-6">
          <AlertCircle size={16} />
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
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-sm">
            <RefreshCw className="h-6 w-6 animate-spin text-bukizz-orange mb-3" />
            Loading queries…
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={queries}
            emptyMessage="No support queries found."
            onRowClick={(row) => navigate(`/orderqueries/${row.id}`)}
          />
        )}

        {/* Server-side Pagination */}
        {!loading && queries.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
            <div className="text-sm text-slate-600">
              {totalCount} total queries
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {/* Unassigned Tickets */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              Unassigned Tickets
            </p>
            <p className="text-3xl font-bold text-orange-500 mt-1">
              {stats.unassigned}
            </p>
          </div>
        </div>

        {/* Avg First Response */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              Avg. First Response
            </p>
            <p className="text-3xl font-bold text-orange-500 mt-1">
              {stats.avgResponse}
            </p>
          </div>
        </div>

        {/* Resolved Today */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Resolved Today</p>
            <p className="text-3xl font-bold text-orange-500 mt-1">
              {stats.resolvedToday}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueryListPage;
