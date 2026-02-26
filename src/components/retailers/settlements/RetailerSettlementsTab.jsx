import React, { useState, useEffect, useCallback } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import SettlementSummaryCards from "./SettlementSummaryCards";
import InitiatePayoutModal from "./InitiatePayoutModal";
import SettlementLedgerTable from "./SettlementLedgerTable";
import PayoutHistoryTable from "./PayoutHistoryTable";
import api from "../../../services/api";
import { useToast } from "../../../context/ToastContext";

const InnerTab = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`pb-3 text-sm font-medium transition-colors relative ${
      isActive ? "text-orange-500" : "text-slate-500 hover:text-slate-700"
    }`}
  >
    {label}
    {isActive && (
      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500 rounded-t-full" />
    )}
  </button>
);

const ErrorBanner = ({ message, onRetry }) => (
  <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
    <div className="flex items-center gap-2">
      <AlertCircle size={16} className="shrink-0" />
      <span>{message}</span>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
      >
        <RefreshCw size={13} />
        Retry
      </button>
    )}
  </div>
);

const RetailerSettlementsTab = ({ retailerId }) => {
  const toast = useToast();

  // Summary state
  const [summary, setSummary] = useState(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(null);

  // Ledgers state
  const [ledgers, setLedgers] = useState([]);
  const [isLedgersLoading, setIsLedgersLoading] = useState(true);
  const [ledgersError, setLedgersError] = useState(null);

  // Payout history state
  const [history, setHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);

  // Payout modal
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

  // Inner tab: 'unsettled' | 'history'
  const [innerTab, setInnerTab] = useState("unsettled");

  const fetchSummary = useCallback(async () => {
    setIsSummaryLoading(true);
    setSummaryError(null);
    try {
      const res = await api.get(
        `/settlements/admin/retailers/${retailerId}/summary`,
      );
      setSummary(res.data?.data || res.data);
    } catch (err) {
      console.error("Settlement summary fetch failed:", err);
      setSummaryError("Failed to load settlement summary.");
    } finally {
      setIsSummaryLoading(false);
    }
  }, [retailerId]);

  const fetchLedgers = useCallback(async () => {
    setIsLedgersLoading(true);
    setLedgersError(null);
    try {
      const res = await api.get(
        `/settlements/admin/retailers/${retailerId}/ledgers/unsettled`,
      );
      setLedgers(res.data?.data || []);
    } catch (err) {
      console.error("Ledgers fetch failed:", err);
      setLedgersError("Failed to load unsettled ledger entries.");
    } finally {
      setIsLedgersLoading(false);
    }
  }, [retailerId]);

  const fetchHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await api.get(
        `/settlements/admin/retailers/${retailerId}/history`,
      );
      setHistory(res.data?.data || []);
    } catch (err) {
      console.error("Payout history fetch failed:", err);
      setHistoryError("Failed to load payout history.");
    } finally {
      setIsHistoryLoading(false);
    }
  }, [retailerId]);

  const fetchAll = useCallback(() => {
    fetchSummary();
    fetchLedgers();
    fetchHistory();
  }, [fetchSummary, fetchLedgers, fetchHistory]);

  useEffect(() => {
    if (retailerId) {
      fetchAll();
    }
  }, [retailerId, fetchAll]);

  const handlePayoutSuccess = () => {
    // Re-fetch summary and ledgers after a payout (balance + unsettled list change)
    fetchSummary();
    fetchLedgers();
    fetchHistory();
  };

  const totalOwed = Number(summary?.totalOwed) || 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      {/* Summary error */}
      {summaryError && (
        <ErrorBanner message={summaryError} onRetry={fetchSummary} />
      )}

      {/* KPI Summary Cards */}
      <SettlementSummaryCards
        summary={summary}
        isLoading={isSummaryLoading}
        onSettleClick={() => setIsPayoutModalOpen(true)}
      />

      {/* Dual-Tab Data Tables */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {/* Inner Tabs */}
        <div className="flex gap-8 px-6 pt-4 border-b border-slate-200">
          <InnerTab
            label="Current Cycle (Unsettled)"
            isActive={innerTab === "unsettled"}
            onClick={() => setInnerTab("unsettled")}
          />
          <InnerTab
            label="Payout History"
            isActive={innerTab === "history"}
            onClick={() => setInnerTab("history")}
          />
        </div>

        {/* Table Content */}
        <div className="p-6">
          {innerTab === "unsettled" && (
            <>
              {ledgersError && (
                <ErrorBanner message={ledgersError} onRetry={fetchLedgers} />
              )}
              <SettlementLedgerTable
                ledgers={ledgers}
                isLoading={isLedgersLoading}
              />
            </>
          )}

          {innerTab === "history" && (
            <>
              {historyError && (
                <ErrorBanner message={historyError} onRetry={fetchHistory} />
              )}
              <PayoutHistoryTable
                history={history}
                isLoading={isHistoryLoading}
              />
            </>
          )}
        </div>
      </div>

      {/* Payout Modal */}
      <InitiatePayoutModal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        retailerId={retailerId}
        totalOwed={totalOwed}
        onSuccess={handlePayoutSuccess}
      />
    </div>
  );
};

export default RetailerSettlementsTab;
