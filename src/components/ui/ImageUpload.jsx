import React, { useRef, useState } from "react";
import { CloudUpload, Image as ImageIcon, X } from "lucide-react";

const ImageUpload = ({
  label,
  error,
  onChange,
  multiple = false,
  className = "",
  initialPreview, // Add initialPreview prop
}) => {
  const [previews, setPreviews] = useState(
    initialPreview ? [initialPreview] : []
  );

  // Sync with initialPreview (e.g. when data loads)
  React.useEffect(() => {
    if (initialPreview && previews.length === 0) {
      setPreviews([initialPreview]);
    }
  }, [initialPreview]);

  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      if (multiple) {
        // Just styling for now, actual logic depends on backend
        // We'll create object URLs for preview
        const newPreviews = files.map((file) => URL.createObjectURL(file));
        setPreviews([...previews, ...newPreviews]);
      } else {
        const url = URL.createObjectURL(files[0]);
        setPreviews([url]);
      }
      onChange && onChange(files);
    }
  };

  const removeImage = (index) => {
    const newPreviews = [...previews];
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
    // NOTE: We should also clear the input value if empty, but complex for standard file inputs
  };

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-slate-700">{label}</label>
      )}

      {/* Upload Zone */}
      <div
        onClick={() => inputRef.current?.click()}
        className={`
            border-2 border-dashed rounded-lg p-8 
            flex flex-col items-center justify-center 
            bg-slate-50 hover:bg-orange-50/50 hover:border-orange-300
            transition-all cursor-pointer group
            ${error ? "border-red-300" : "border-slate-300"}
        `}
      >
        <input
          type="file"
          ref={inputRef}
          className="hidden"
          accept="image/*"
          multiple={multiple}
          onChange={handleFileChange}
        />

        <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
          <CloudUpload
            className="text-slate-400 group-hover:text-orange-500 transition-colors"
            size={24}
          />
        </div>

        <p className="text-sm font-medium text-slate-700">
          Click or drag to upload
        </p>
        <p className="text-xs text-slate-400 mt-1">
          SVG, PNG, JPG or GIF (max. 3MB)
        </p>
      </div>

      {/* Previews */}
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-4 mt-2">
          {previews.map((src, index) => (
            <div
              key={index}
              className="relative w-24 h-24 rounded-lg border border-slate-200 overflow-hidden group"
            >
              <img
                src={src}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 p-1 bg-white/80 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};

export default ImageUpload;
