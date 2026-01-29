import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

const Select = ({
  label,
  options = [],
  error,
  className = "",
  placeholder = "Select an option",
  value,
  onChange,
  isDisabled = false,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get display label for current value
  const getDisplayLabel = () => {
    if (!value) return placeholder;
    const option = options.find((opt) => {
      const optValue = typeof opt === "string" ? opt : opt.value;
      return optValue === value;
    });
    if (!option) return placeholder;
    return typeof option === "string" ? option : option.label;
  };

  const handleSelect = (optValue) => {
    // Simulate native event structure
    onChange?.({ target: { value: optValue } });
    setIsOpen(false);
  };

  return (
    <div
      className={`w-full flex flex-col gap-1.5 ${className}`}
      ref={containerRef}
    >
      {label && (
        <label className="text-sm font-medium text-slate-700">{label}</label>
      )}

      <div className="relative">
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => !isDisabled && setIsOpen(!isOpen)}
          disabled={isDisabled}
          className={`
            w-full h-10 px-3 rounded-md border text-sm transition-all cursor-pointer
            flex items-center justify-between text-left
            focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400
            bg-white
            ${isDisabled ? "opacity-50 cursor-not-allowed bg-slate-50" : ""}
            ${error ? "border-red-300 focus:ring-red-100 focus:border-red-400" : "border-slate-200"}
            ${value ? "text-slate-700" : "text-slate-400"}
          `}
          {...props}
        >
          <span className="truncate">{getDisplayLabel()}</span>
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-400">No options</div>
            ) : (
              options.map((opt) => {
                const isString = typeof opt === "string";
                const optValue = isString ? opt : opt.value;
                const optLabel = isString ? opt : opt.label;
                const isSelected = optValue === value;

                return (
                  <div
                    key={optValue}
                    onClick={() => handleSelect(optValue)}
                    className={`
                      px-3 py-2 text-sm cursor-pointer flex items-center justify-between
                      ${isSelected ? "bg-orange-50 text-orange-600" : "text-slate-700 hover:bg-slate-50"}
                    `}
                  >
                    <span>{optLabel}</span>
                    {isSelected && (
                      <Check size={14} className="text-orange-500" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};

export default Select;
