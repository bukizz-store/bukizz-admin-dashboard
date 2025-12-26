import React from "react";
import { Search, LayoutGrid, List } from "lucide-react";

const FilterBar = ({
  onSearch,
  filterConfig = [],
  view,
  onViewChange,
  primaryAction,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Search & Filters */}
        <div className="flex flex-1 items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search..."
              onChange={(e) => onSearch && onSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-md text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-bukizz-orange/20 focus:outline-none transition-all"
            />
          </div>

          {/* Dynamic Filters */}
          {filterConfig.map((filter, index) => (
            <div key={index} className="hidden md:block">
              <select
                onChange={(e) =>
                  filter.onChange && filter.onChange(e.target.value)
                }
                className="px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-600 focus:border-bukizz-orange focus:ring-1 focus:ring-bukizz-orange outline-none cursor-pointer"
              >
                <option value="">{filter.label}</option>
                {filter.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Right Side: View Toggle & Primary Action */}
        <div className="flex items-center gap-4">
          {/* View Toggle */}
          {onViewChange && (
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => onViewChange("list")}
                className={`p-1.5 rounded-md transition-all ${
                  view === "list"
                    ? "bg-white text-bukizz-orange shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <List size={18} />
              </button>
              <button
                onClick={() => onViewChange("grid")}
                className={`p-1.5 rounded-md transition-all ${
                  view === "grid"
                    ? "bg-white text-bukizz-orange shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <LayoutGrid size={18} />
              </button>
            </div>
          )}

          {/* Primary Action Button */}
          {primaryAction && <div>{primaryAction}</div>}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
