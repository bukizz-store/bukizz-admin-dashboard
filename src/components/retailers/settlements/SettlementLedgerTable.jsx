import React from "react";
import { FileText } from "lucide-react";

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
  });
};

const StatusPill = ({ status }) => {
  const s = status?.toUpperCase();
  const styles = {
    PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
    CLEARING: "bg-blue-50 text-blue-700 border border-blue-200",
    SETTLED: "bg-green-50 text-green-700 border border-green-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[s] || "bg-slate-100 text-slate-600"}`}
    >
      {status || "—"}
    </span>
  );
};

const SettlementLedgerTable = ({ ledgers, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-slate-100 rounded-md animate-pulse" />
        ))}
      </div>
    );
  }

  if (!ledgers || ledgers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <FileText size={36} className="mb-3" />
        <p className="text-sm font-medium">No unsettled ledger entries</p>
        <p className="text-xs mt-1">
          All entries for this retailer are settled.
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
              "Order ID",
              "Product",
              "Amount",
              "Type",
              "Clearing Date",
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
          {ledgers.map((entry, idx) => {
            const isDebit = entry.entry_type === "DEBIT";
            const productName = isDebit
              ? `${entry.order_items?.title || entry.description || "—"} (Platform Fee)`
              : entry.order_items?.title || entry.description || "—";
            const amountDisplay = isDebit
              ? `−${formatINR(entry.amount)}`
              : formatINR(entry.amount);

            return (
              <tr
                key={entry.id || idx}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                  #{entry.orders?.order_number || entry.order_id || "N/A"}
                </td>
                <td className="px-4 py-3 text-slate-700 max-w-50 truncate">
                  {productName}
                </td>
                <td
                  className={`px-4 py-3 font-semibold whitespace-nowrap ${
                    isDebit ? "text-red-600" : "text-slate-800"
                  }`}
                >
                  {amountDisplay}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      isDebit
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-green-50 text-green-700 border border-green-200"
                    }`}
                  >
                    {isDebit ? "Debit" : "Credit"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                  {formatDate(entry.trigger_date)}
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={entry.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SettlementLedgerTable;
