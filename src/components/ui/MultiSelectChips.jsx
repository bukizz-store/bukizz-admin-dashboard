import React, { useState } from "react";
import { X } from "lucide-react";

const MultiSelectChips = ({
  label,
  error,
  placeholder = "Type and press Enter...",
  onChange,
  className = "",
}) => {
  const [inputValue, setInputValue] = useState("");
  const [chips, setChips] = useState([]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      if (!chips.includes(inputValue.trim())) {
        const newChips = [...chips, inputValue.trim()];
        setChips(newChips);
        setInputValue("");
        onChange && onChange(newChips);
      }
    } else if (e.key === "Backspace" && !inputValue && chips.length > 0) {
      // Remove last chip handling
      const newChips = chips.slice(0, -1);
      setChips(newChips);
      onChange && onChange(newChips);
    }
  };

  const removeChip = (chipToRemove) => {
    const newChips = chips.filter((chip) => chip !== chipToRemove);
    setChips(newChips);
    onChange && onChange(newChips);
  };

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-slate-700">{label}</label>
      )}

      <div
        className={`
            min-h-[40px] px-2 py-1.5 rounded-md border bg-white flex flex-wrap items-center gap-2
            focus-within:ring-2 focus-within:ring-orange-100 focus-within:border-orange-400 transition-all
            ${error ? "border-red-300" : "border-slate-200"}
        `}
      >
        {chips.map((chip) => (
          <span
            key={chip}
            className="bg-orange-100 text-orange-700 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 animate-in fade-in zoom-in duration-200"
          >
            {chip}
            <button
              type="button"
              onClick={() => removeChip(chip)}
              className="hover:text-orange-900"
            >
              <X size={12} />
            </button>
          </span>
        ))}

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={chips.length === 0 ? placeholder : ""}
          className="flex-1 bg-transparent border-none outline-none text-sm min-w-[120px] h-full placeholder:text-slate-400"
        />
      </div>

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};

export default MultiSelectChips;
