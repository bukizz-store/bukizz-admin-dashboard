import React from "react";
import MetadataField from "./MetadataField";
import { Layers } from "lucide-react";

/**
 * MetadataForm - Container component that renders a form from productAttributes schema
 *
 * @param {Array} attributes - The productAttributes schema from a category
 * @param {Object} value - The current metadata values
 * @param {Function} onChange - Callback when values change
 */
const MetadataForm = ({ attributes = [], value = {}, onChange }) => {
  if (!attributes || attributes.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="p-2 bg-violet-50 text-violet-500 rounded-lg">
          <Layers size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Category Attributes
          </h2>
          <p className="text-sm text-slate-500">
            Fill in the attributes required for this category
          </p>
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {attributes.map((attr) => {
          // Groups should span full width
          const isGroup = attr.type === "group";
          return (
            <div
              key={attr.id || attr.key}
              className={isGroup ? "md:col-span-2" : ""}
            >
              <MetadataField
                attribute={attr}
                value={value}
                onChange={onChange}
                path=""
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MetadataForm;
