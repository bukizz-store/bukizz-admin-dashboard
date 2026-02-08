import React, { useState } from "react";
import { Input, Select } from "../ui";
import { ChevronRight, Plus, Trash2, Loader2, ImageIcon } from "lucide-react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";

/**
 * MetadataField - Recursive component that renders a single attribute field
 * Maps attribute types to appropriate UI components
 */
const MetadataField = ({ attribute, value, onChange, path = "" }) => {
  const { key, label, type, required, config = {}, fields = [] } = attribute;
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  // Build the full path for this field
  const fieldPath = path ? `${path}.${key}` : key;

  // Get nested value from the metadata object
  const getNestedValue = (obj, path) => {
    if (!path || !obj) return obj;
    return path.split(".").reduce((acc, part) => acc?.[part], obj);
  };

  // Set nested value in the metadata object
  const setNestedValue = (obj, path, newValue) => {
    if (!path) return newValue;

    const parts = path.split(".");
    const result = { ...obj };
    let current = result;

    for (let i = 0; i < parts.length - 1; i++) {
      current[parts[i]] = { ...current[parts[i]] };
      current = current[parts[i]];
    }

    current[parts[parts.length - 1]] = newValue;
    return result;
  };

  const fieldValue = getNestedValue(value, fieldPath);

  const handleChange = (newFieldValue) => {
    const updated = setNestedValue(value || {}, fieldPath, newFieldValue);
    onChange(updated);
  };

  // Handle image upload
  const handleImageUpload = async (file) => {
    if (!file) return;

    setUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append("image", file);
      uploadData.append("bucket", "products");
      uploadData.append("folder", "product_attribute");

      const response = await api.post("/images/upload", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data?.success) {
        const imageUrl = response.data.data?.url || response.data?.url;
        const currentImages = Array.isArray(fieldValue) ? fieldValue : [];
        const maxLimit = config.maxLimit || 1;

        if (currentImages.length < maxLimit) {
          handleChange([...currentImages, imageUrl]);
        } else {
          toast.error(`Maximum ${maxLimit} image(s) allowed`);
        }
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  // Remove image
  const handleRemoveImage = (index) => {
    const currentImages = Array.isArray(fieldValue) ? fieldValue : [];
    const updated = currentImages.filter((_, i) => i !== index);
    handleChange(updated);
  };

  // Render based on type
  switch (type) {
    case "text":
      return (
        <Input
          label={label}
          required={required}
          value={fieldValue || ""}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      );

    case "number":
      return (
        <Input
          label={label}
          type="number"
          required={required}
          value={fieldValue || ""}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      );

    case "select":
      const options = (config.options || []).map((opt) =>
        typeof opt === "string" ? { value: opt, label: opt } : opt,
      );
      return (
        <Select
          label={label}
          required={required}
          value={fieldValue || ""}
          onChange={(e) => handleChange(e.target.value)}
          options={options}
          placeholder={`Select ${label.toLowerCase()}`}
        />
      );

    case "image":
      const maxLimit = config.maxLimit || 1;
      const currentImages = Array.isArray(fieldValue) ? fieldValue : [];

      return (
        <div className="w-full">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
            <span className="text-slate-400 font-normal ml-2">
              ({currentImages.length}/{maxLimit})
            </span>
          </label>

          {/* Image previews */}
          <div className="flex flex-wrap gap-2 mb-2">
            {currentImages.map((url, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={url}
                  alt={`${label} ${idx + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border border-slate-200"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Upload button */}
          {currentImages.length < maxLimit && (
            <label className="cursor-pointer inline-block">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                  e.target.value = ""; // Reset for re-upload
                }}
                disabled={uploading}
              />
              <span
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border-2 border-dashed transition-colors ${
                  uploading
                    ? "bg-slate-100 border-slate-200 text-slate-400"
                    : "border-slate-300 text-slate-600 hover:border-orange-400 hover:text-orange-500"
                }`}
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Add Image
                  </>
                )}
              </span>
            </label>
          )}
        </div>
      );

    case "group":
      return (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          {/* Group Header */}
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
            <ChevronRight size={16} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">{label}</h3>
          </div>

          {/* Nested Fields */}
          <div className="space-y-4">
            {fields.map((childAttr) => (
              <MetadataField
                key={childAttr.id || childAttr.key}
                attribute={childAttr}
                value={value}
                onChange={onChange}
                path={fieldPath}
              />
            ))}
            {fields.length === 0 && (
              <p className="text-sm text-slate-400 italic">
                No fields in this group.
              </p>
            )}
          </div>
        </div>
      );

    default:
      return (
        <div className="text-sm text-slate-400 italic">
          Unknown type: {type}
        </div>
      );
  }
};

export default MetadataField;
