import React from "react";

const Input = ({ label, error, icon: Icon, className = "", ...props }) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-slate-700">{label}</label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon size={18} />
          </div>
        )}

        <input
          className={`
            w-full h-10 px-3 rounded-md border text-sm transition-all
            focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400
            placeholder:text-slate-400
            ${Icon ? "pl-10" : ""}
            ${
              error
                ? "border-red-300 focus:ring-red-100 focus:border-red-400"
                : "border-slate-200 bg-white"
            }
            ${className}
          `}
          {...props}
        />
      </div>

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};

export default Input;
