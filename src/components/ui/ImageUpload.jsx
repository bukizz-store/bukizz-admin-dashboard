import React, { useState, useRef, useCallback } from "react";
import api from "../../services/api";
import { CloudUpload, Image as ImageIcon, X, Loader2, GripVertical, Upload } from "lucide-react";
import { cn } from "../../lib/utils";

const ImageUpload = ({
  label,
  error,
  onChange,
  multiple = false,
  className = "",
  values = [], // Controlled prop: array of URL strings
  maxImages = 10,
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Drag-to-reorder state
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);

  const uploadFiles = useCallback(
    async (files) => {
      const remaining = maxImages - values.length;
      const filesToUpload = Array.from(files).slice(0, remaining);
      if (filesToUpload.length === 0) return;

      setUploading(true);
      try {
        const results = await Promise.all(
          filesToUpload.map(async (file) => {
             const formData = new FormData();
             formData.append("image", file);
             formData.append("bucket", "products");
             formData.append("folder", "product");
             const response = await api.post("/images/upload", formData, {
               headers: { "Content-Type": "multipart/form-data" },
             });
             return response.data;
          }),
        );
        const newUrls = results
          .map((r) => r.data?.url || r.url)
          .filter(Boolean);
          
        if (multiple) {
           onChange([...values, ...newUrls]);
        } else {
           onChange([newUrls[0]]);
        }
      } catch (error) {
        console.error("Image upload failed:", error);
      } finally {
        setUploading(false);
      }
    },
    [values, onChange, maxImages, multiple],
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) uploadFiles(files);
    },
    [uploadFiles],
  );

  const handleDragOverArea = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeaveArea = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileChange = useCallback(
    (e) => {
      if (e.target.files.length > 0) {
        uploadFiles(e.target.files);
      }
      e.target.value = "";
    },
    [uploadFiles],
  );

  const removeImage = useCallback(
    (index) => {
      onChange(values.filter((_, i) => i !== index));
    },
    [values, onChange],
  );

  // ── Drag-to-reorder handlers ──
  const handleItemDragStart = useCallback((e, idx) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
    const el = e.currentTarget;
    e.dataTransfer.setDragImage(el, el.offsetWidth / 2, el.offsetHeight / 2);
  }, []);

  const handleItemDragOver = useCallback((e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverIdx(idx);
  }, []);

  const handleItemDragLeaveItem = useCallback(() => {
    setOverIdx(null);
  }, []);

  const handleItemDrop = useCallback(
    (e, toIdx) => {
      e.preventDefault();
      e.stopPropagation();
      if (dragIdx === null || dragIdx === toIdx) {
        setDragIdx(null);
        setOverIdx(null);
        return;
      }
      const reordered = [...values];
      const [moved] = reordered.splice(dragIdx, 1);
      reordered.splice(toIdx, 0, moved);
      onChange(reordered);
      setDragIdx(null);
      setOverIdx(null);
    },
    [dragIdx, values, onChange],
  );

  const handleItemDragEnd = useCallback(() => {
    setDragIdx(null);
    setOverIdx(null);
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-slate-700">{label}</label>
      )}

      {/* Thumbnail Grid */}
      {values.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {values.map((url, i) => (
            <div
              key={`${url}-${i}`}
              draggable
              onDragStart={(e) => handleItemDragStart(e, i)}
              onDragOver={(e) => handleItemDragOver(e, i)}
              onDragLeave={handleItemDragLeaveItem}
              onDrop={(e) => handleItemDrop(e, i)}
              onDragEnd={handleItemDragEnd}
              className={cn(
                "relative aspect-square rounded-lg border overflow-hidden group bg-slate-50 cursor-grab active:cursor-grabbing transition-all duration-150",
                dragIdx === i && "opacity-50 scale-95",
                overIdx === i &&
                  dragIdx !== i &&
                  "ring-2 ring-bukizz-orange ring-offset-1 scale-105",
                dragIdx === null && "border-slate-200",
              )}
            >
              <img
                src={url}
                alt={`Product image ${i + 1}`}
                className="h-full w-full object-cover pointer-events-none"
              />
              {/* Grip handle */}
              <div className="absolute top-1.5 left-1.5 bg-black/40 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-3.5 w-3.5" />
              </div>
              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1.5 left-1.5 bg-bukizz-orange text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                  Primary
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dropzone */}
      {(!multiple && values.length === 0) || (multiple && values.length < maxImages) ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOverArea}
          onDragLeave={handleDragLeaveArea}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
            dragOver
              ? "border-bukizz-orange bg-orange-50"
              : error 
                ? "border-red-300 bg-slate-50" 
                : "border-slate-300 hover:border-orange-300 hover:bg-orange-50/50",
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-bukizz-orange" />
              <p className="text-sm text-slate-500">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                <CloudUpload className="text-slate-400 group-hover:text-orange-500 transition-colors" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Drop images here or{" "}
                  <span className="text-bukizz-orange">browse</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  PNG, JPG, WEBP up to 5MB each
                  {multiple && ` · ${values.length}/${maxImages} uploaded · Drag to reorder`}
                </p>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            multiple={multiple}
            accept="image/*"
          />
        </div>
      ) : null}

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};

export default ImageUpload;
