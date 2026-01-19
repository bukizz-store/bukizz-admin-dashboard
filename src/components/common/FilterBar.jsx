import React, { useState, useRef, useEffect } from "react";
import { Search, LayoutGrid, List, ChevronDown, Check } from "lucide-react";

const FilterBar = ({
  onSearch,
  searchTerm,
  filterConfig = [],
  view,
  onViewChange,
  primaryAction,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Search Only */}
        <div className="flex-1 max-w-md relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm || ""}
            onChange={(e) => onSearch && onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-md text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-bukizz-orange/20 focus:outline-none transition-all"
          />
        </div>

        {/* Right Side: Filters, View Toggle & Primary Action */}
        <div className="flex items-center gap-3">
          {/* Dynamic Filters (Custom Dropdowns) */}
          {filterConfig.map((filter, index) => (
            <FilterDropdown key={index} filter={filter} />
          ))}

          {/* Divider if filters exist */}
          {filterConfig.length > 0 && (
            <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block" />
          )}

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

// Internal Custom Dropdown Component
const FilterDropdown = ({ filter }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync local selection if filter.value changes (external control)
  useEffect(() => {
    if (filter.value !== undefined) {
      setSelected(filter.value);
    }
  }, [filter.value]);

  const handleSelect = (value) => {
    setSelected(value);
    setIsOpen(false);
    if (filter.onChange) filter.onChange(value);
  };

  return (
    <div className="hidden md:block relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 bg-white border rounded-md text-sm transition-all outline-none ${
          isOpen
            ? "border-bukizz-orange ring-1 ring-bukizz-orange text-bukizz-orange"
            : "border-slate-200 text-slate-600 hover:border-slate-300"
        }`}
      >
        <span className="font-medium">{filter.label}</span>
        {selected && <span className="text-slate-900">: {selected}</span>}
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-50 mb-1">
            Select {filter.label}
          </div>

          <button
            onClick={() => handleSelect("")}
            className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-50 ${
              selected === ""
                ? "text-bukizz-orange font-medium"
                : "text-slate-600"
            }`}
          >
            <span>All</span>
            {selected === "" && <Check size={14} />}
          </button>

          {filter.options.map((opt) => (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-50 ${
                selected === opt
                  ? "text-bukizz-orange font-medium"
                  : "text-slate-600"
              }`}
            >
              <span>{opt}</span>
              {selected === opt && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
