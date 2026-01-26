import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Search, X, Loader2 } from "lucide-react";

// Simple internal debounce if hook doesn't exist, but I'll check/implement inline to be safe
const useInternalDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const AsyncSelect = ({
  label,
  placeholder = "Select...",
  loadOptions,
  value,
  onChange,
  error,
  disabled = false,
  className = "",
  renderOption, // Optional custom renderer for options
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  const debouncedSearch = useInternalDebounce(searchTerm, 500);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch options when search changes or opened
  useEffect(() => {
    let active = true;

    const fetchOptions = async () => {
      if (!isOpen) return;

      setLoading(true);
      try {
        const results = await loadOptions(debouncedSearch);
        if (active) setOptions(results || []);
      } catch (err) {
        console.error("AsyncSelect load error:", err);
        if (active) setOptions([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchOptions();

    return () => {
      active = false;
    };
  }, [debouncedSearch, isOpen, loadOptions]);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
  };

  const displayValue = value ? value.label || value.name || value.title : "";

  return (
    <div
      className={`w-full flex flex-col gap-1.5 ${className}`}
      ref={wrapperRef}
    >
      {label && (
        <label className="text-sm font-medium text-slate-700">{label}</label>
      )}

      <div className="relative">
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`
            w-full flex items-center justify-between px-3 py-2 bg-white border rounded-lg text-sm transition-all cursor-pointer
            ${disabled ? "bg-slate-100 cursor-not-allowed text-slate-400" : "hover:border-slate-300"}
            ${error ? "border-red-500 focus:ring-red-500" : "border-slate-200 focus:ring-bukizz-orange"}
            ${isOpen ? "ring-2 ring-bukizz-orange/10 border-bukizz-orange" : ""}
          `}
        >
          <span
            className={`block truncate ${!value ? "text-slate-400" : "text-slate-900"}`}
          >
            {value ? displayValue : placeholder}
          </span>

          <div className="flex items-center gap-1">
            {value && !disabled && (
              <div
                onClick={handleClear}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={14} />
              </div>
            )}
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </div>
        </div>

        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="p-2 border-b border-slate-50 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
              />
              <input
                autoFocus
                type="text"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-bukizz-orange text-slate-700 placeholder:text-slate-400"
                placeholder="Type to search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div className="max-h-60 overflow-y-auto p-1">
              {loading ? (
                <div className="flex items-center justify-center py-4 text-slate-400 text-xs">
                  <Loader2 className="animate-spin mr-2" size={14} />
                  Loading...
                </div>
              ) : options.length > 0 ? (
                options.map((option, idx) => (
                  <div
                    key={option.id || idx}
                    onClick={() => handleSelect(option)}
                    className={`
                      px-3 py-2 text-sm rounded-md cursor-pointer transition-colors
                      ${value?.id === option.id ? "bg-bukizz-orange/10 text-bukizz-orange font-medium" : "hover:bg-slate-50 text-slate-700"}
                    `}
                  >
                    {renderOption
                      ? renderOption(option)
                      : option.label || option.name || option.title}
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-slate-400 text-xs">
                  No results found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};

export default AsyncSelect;
