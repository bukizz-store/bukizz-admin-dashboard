import React from "react";
import { Trash2, Plus, GripVertical, X } from "lucide-react";
import { Input, Select } from "../ui";

const ATTRIBUTE_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "select", label: "Select" },
  { value: "image", label: "Image" },
  { value: "group", label: "Group" },
];

const AttributeNode = ({
  attribute,
  onUpdate,
  onRemove,
  onAddChild,
  depth = 0,
}) => {
  const { id, label, key, type, required, config, fields } = attribute;

  // Generate key from label
  const generateKey = (labelText) => {
    return labelText
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
  };

  const handleLabelChange = (e) => {
    const newLabel = e.target.value;
    onUpdate(id, {
      label: newLabel,
      key: generateKey(newLabel),
    });
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    // Reset config when type changes
    const newConfig = {};
    if (newType === "select") {
      newConfig.options = [];
    } else if (newType === "image") {
      newConfig.maxLimit = 1;
    }
    onUpdate(id, {
      type: newType,
      config: newConfig,
      fields: newType === "group" ? fields : [],
    });
  };

  const handleRequiredChange = (e) => {
    onUpdate(id, { required: e.target.checked });
  };

  // Select type: Options management
  const handleAddOption = () => {
    const newOptions = [...(config.options || []), ""];
    onUpdate(id, { config: { ...config, options: newOptions } });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...(config.options || [])];
    newOptions[index] = value;
    onUpdate(id, { config: { ...config, options: newOptions } });
  };

  const handleRemoveOption = (index) => {
    const newOptions = (config.options || []).filter((_, i) => i !== index);
    onUpdate(id, { config: { ...config, options: newOptions } });
  };

  // Image type: Max limit
  const handleMaxLimitChange = (e) => {
    onUpdate(id, {
      config: { ...config, maxLimit: parseInt(e.target.value) || 1 },
    });
  };

  return (
    <div className="relative">
      {/* Connector line for nested items */}
      {depth > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 border-l-2 border-slate-200"
          style={{ marginLeft: -12 }}
        />
      )}

      <div
        className={`bg-white border border-slate-200 rounded-lg p-4 ${depth > 0 ? "ml-6" : ""}`}
      >
        {/* Main attribute row */}
        <div className="flex items-start gap-3">
          {/* Drag handle placeholder */}
          <div className="mt-2.5 text-slate-300 cursor-grab">
            <GripVertical size={16} />
          </div>

          {/* Attribute fields */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input
              label="Label"
              value={label}
              onChange={handleLabelChange}
              placeholder="e.g. Color"
            />

            <Input
              label="Key"
              value={key}
              readOnly
              className="bg-slate-50 text-slate-500"
            />

            <Select
              label="Type"
              value={type}
              onChange={handleTypeChange}
              options={ATTRIBUTE_TYPES}
            />

            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 h-10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={required}
                  onChange={handleRequiredChange}
                  className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
                />
                <span className="text-sm text-slate-600">Required</span>
              </label>
            </div>
          </div>

          {/* Remove button */}
          <button
            type="button"
            onClick={() => onRemove(id)}
            className="mt-6 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Type-specific configuration */}
        {type === "select" && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-600">
                Options
              </span>
              <button
                type="button"
                onClick={handleAddOption}
                className="inline-flex items-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-600"
              >
                <Plus size={14} />
                Add Option
              </button>
            </div>
            <div className="space-y-2">
              {(config.options || []).map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 h-9 px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {(config.options || []).length === 0 && (
                <p className="text-sm text-slate-400 italic">
                  No options added yet.
                </p>
              )}
            </div>
          </div>
        )}

        {type === "image" && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="w-40">
              <Input
                label="Max Images"
                type="number"
                min="1"
                value={config.maxLimit || 1}
                onChange={handleMaxLimitChange}
              />
            </div>
          </div>
        )}

        {type === "group" && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-600">
                Sub-Attributes
              </span>
              <button
                type="button"
                onClick={() => onAddChild(id)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md transition-colors"
              >
                <Plus size={14} />
                Add Sub-Attribute
              </button>
            </div>

            {/* Recursive children */}
            <div className="space-y-3 pl-3">
              {(fields || []).map((child) => (
                <AttributeNode
                  key={child.id}
                  attribute={child}
                  onUpdate={onUpdate}
                  onRemove={onRemove}
                  onAddChild={onAddChild}
                  depth={depth + 1}
                />
              ))}
              {(fields || []).length === 0 && (
                <p className="text-sm text-slate-400 italic py-2">
                  No sub-attributes yet.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttributeNode;
