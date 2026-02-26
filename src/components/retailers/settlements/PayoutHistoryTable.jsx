import React from "react";
import { History, ExternalLink, FileText } from "lucide-react";

const formatINR = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(num);
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const StatusPill = ({ status }) => {
  const s = status?.toUpperCase();
  const isCompleted = s === "COMPLETED" || s === "SUCCESS" || s === "PAID";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
        isCompleted
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-amber-50 text-amber-700 border-amber-200"
      }`}
    >
      {isCompleted ? (
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
      )}
      {isCompleted ? "Completed" : status || "Pending"}
    </span>
  );
};

const PayoutHistoryTable = ({ history, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-slate-100 rounded-md animate-pulse" />
        ))}
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <History size={36} className="mb-3" />
        <p className="text-sm font-medium">No payout history yet</p>
        <p className="text-xs mt-1">
          Settlements will appear here once processed.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {[
              "Date",
              "Amount Paid",
              "Payment Mode",
              "UTR / Reference",
              "Receipt",
              "Status",
            ].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {history.map((payout, idx) => (
            <tr
              key={payout.id || idx}
              className="hover:bg-slate-50 transition-colors"
            >
              <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                {formatDate(payout.created_at || payout.date)}
              </td>
              <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                {formatINR(payout.total_amount)}
              </td>
              <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono">
                  {payout.paymentMode || payout.payment_mode || "—"}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                {payout.reference_number || "—"}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {payout.receiptUrl || payout.receipt_url ? (
                  <a
                    href={payout.receiptUrl || payout.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors"
                  >
                    <FileText size={14} />
                    View Receipt
                  </a>
                ) : (
                  <span className="text-slate-400 text-xs">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <StatusPill status={payout.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PayoutHistoryTable;
