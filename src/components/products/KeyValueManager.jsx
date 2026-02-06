import React from "react";
import { Trash2, Plus } from "lucide-react";

/**
 * KeyValueManager Component
 * Manages a list of key-value pairs for product highlights
 * @param {Object} props
 * @param {Array} props.highlights - Array of { key, value } objects
 * @param {Function} props.setHighlights - Setter for highlights state
 * @param {number} [props.maxItems=10] - Maximum number of highlights allowed
 */
const KeyValueManager = ({ highlights, setHighlights, maxItems = 10 }) => {
  const addHighlight = () => {
    if (highlights.length >= maxItems) return;
    setHighlights([...highlights, { key: "", value: "" }]);
  };

  const removeHighlight = (index) => {
    if (highlights.length === 1) {
      // Keep at least one row, just clear it
      setHighlights([{ key: "", value: "" }]);
      return;
    }
    setHighlights(highlights.filter((_, i) => i !== index));
  };

  const updateHighlight = (index, field, value) => {
    const updated = highlights.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setHighlights(updated);
  };

  const canAddMore = highlights.length < maxItems;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
          Product Highlights
        </h2>
        <span className="text-xs text-slate-400">
          {highlights.length}/{maxItems}
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Add key features and specifications for this product.
      </p>

      <div className="space-y-3">
        {highlights.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Feature (e.g., Material)"
              value={item.key}
              onChange={(e) => updateHighlight(index, "key", e.target.value)}
              maxLength={15}
              className="w-1/3 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-bukizz-orange/20 focus:border-bukizz-orange outline-none transition-all"
            />
            <input
              type="text"
              placeholder="Detail (e.g., 100% Cotton)"
              value={item.value}
              onChange={(e) => updateHighlight(index, "value", e.target.value)}
              maxLength={40}
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-bukizz-orange/20 focus:border-bukizz-orange outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => removeHighlight(index)}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Remove highlight"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addHighlight}
        disabled={!canAddMore}
        className={`mt-4 flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
          canAddMore
            ? "text-bukizz-orange hover:bg-orange-50"
            : "text-slate-300 cursor-not-allowed"
        }`}
      >
        <Plus size={16} />
        Add Highlight
      </button>

      <div className="mt-3 text-xs text-slate-400">
        Key: max 15 chars • Value: max 40 chars
      </div>
    </div>
  );
};

export default KeyValueManager;
