import React from "react";

const StatusBadge = ({ status, type = "neutral" }) => {
  const getStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-100 text-green-700 border-green-200";
      case "warning":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "error":
        return "bg-red-100 text-red-700 border-red-200";
      case "neutral":
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStyles()}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
