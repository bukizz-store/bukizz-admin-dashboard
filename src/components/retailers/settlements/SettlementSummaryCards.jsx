import React from "react";
import { TrendingUp, Clock, CheckCircle2, IndianRupee } from "lucide-react";
import { Button } from "../../ui";

const formatINR = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(num);
};

const KpiCard = ({
  label,
  value,
  icon: Icon,
  colorScheme,
  subLabel,
  action,
}) => {
  const schemes = {
    green: {
      bg: "bg-emerald-50",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      valueColor: "text-emerald-700",
      border: "border-emerald-100",
    },
    amber: {
      bg: "bg-amber-50",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      valueColor: "text-amber-700",
      border: "border-amber-100",
    },
    slate: {
      bg: "bg-slate-50",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      valueColor: "text-slate-700",
      border: "border-slate-200",
    },
  };
  const s = schemes[colorScheme] || schemes.slate;

  return (
    <div
      className={`${s.bg} border ${s.border} rounded-xl p-5 flex flex-col gap-3`}
    >
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${s.iconBg}`}>
          <Icon size={20} className={s.iconColor} />
        </div>
        {action}
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {label}
        </p>
        <p className={`text-2xl font-bold mt-1 ${s.valueColor}`}>{value}</p>
        {subLabel && (
          <p className="text-xs text-slate-400 mt-0.5">{subLabel}</p>
        )}
      </div>
    </div>
  );
};

const SettlementSummaryCards = ({ summary, isLoading, onSettleClick }) => {
  const totalOwed = Number(summary?.totalOwed) || 0;
  const pendingEscrow = Number(summary?.pendingEscrow) || 0;
  const lifetimePaid = Number(summary?.lifetimePaid) || 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-slate-50 border border-slate-200 rounded-xl p-5 h-32 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <KpiCard
        label="Total Owed (Available for Payout)"
        value={formatINR(totalOwed)}
        icon={IndianRupee}
        colorScheme="green"
        subLabel="Ready to transfer today"
        action={
          <Button
            size="sm"
            onClick={onSettleClick}
            disabled={totalOwed <= 0}
            className="shrink-0"
          >
            Settle Balance
          </Button>
        }
      />
      <KpiCard
        label="Pending Escrow (Clearing)"
        value={formatINR(pendingEscrow)}
        icon={Clock}
        colorScheme="amber"
        subLabel="3-day hold period in progress"
      />
      <KpiCard
        label="Lifetime Paid"
        value={formatINR(lifetimePaid)}
        icon={CheckCircle2}
        colorScheme="slate"
        subLabel="Total settled historically"
      />
    </div>
  );
};

export default SettlementSummaryCards;
