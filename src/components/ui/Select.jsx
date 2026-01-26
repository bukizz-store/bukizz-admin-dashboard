import React from "react";
import { ChevronDown } from "lucide-react";

const Select = ({
  label,
  options = [],
  error,
  className = "",
  placeholder = "Select an option",
  ...props
}) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-slate-700">{label}</label>
      )}

      <div className="relative">
        <select
          className={`
            w-full h-10 px-3 rounded-md border text-sm transition-all appearance-none cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400
            placeholder:text-slate-400 bg-white text-slate-700
            ${
              error
                ? "border-red-300 focus:ring-red-100 focus:border-red-400"
                : "border-slate-200"
            }
            ${className}
          `}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => {
            const isString = typeof opt === "string";
            const value = isString ? opt : opt.value;
            const label = isString ? opt : opt.label;
            return (
              <option key={value} value={value}>
                {label}
              </option>
            );
          })}
        </select>

        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <ChevronDown size={16} />
        </div>
      </div>

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};

export default Select;
