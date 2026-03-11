import React, { useState, useRef } from "react";
import { Plus, Trash2, Image, Loader2, GripVertical, X, Check } from "lucide-react";
import { Button, Input, AsyncSelect } from "../ui";
import { cn } from "../../lib/utils";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";

const ProductVariants = ({
  isEditMode,
  formData,
  setFormData,
  productOptions,
  setProductOptions,
  variants,
  setVariants,
  loadWarehouses,
  retailer,
  setRetailer,
  loadRetailers,
}) => {
  const toast = useToast();

  // For image option value input
  const [imageOptionInputs, setImageOptionInputs] = useState({}); // { [optionId]: { value: '', uploading: false } }
  
  // Drag-to-reorder state for option values
  const [dragValState, setDragValState] = useState({
    optIdx: null,
    fromIdx: null,
    overIdx: null,
  });
  
  const optionInputRefs = useRef({});

  const reorderOptionValues = (optIdx, fromIdx, toIdx) => {
    if (fromIdx === toIdx) return;
    const option = productOptions[optIdx];
    const newValues = [...option.values];
    const [movedValue] = newValues.splice(fromIdx, 1);
    newValues.splice(toIdx, 0, movedValue);
    
    const newProductOptions = [...productOptions];
    newProductOptions[optIdx] = { ...option, values: newValues };
    setProductOptions(newProductOptions);
  };
  
  const handleRemoveValue = (optIdx, valIdx) => {
    const newProductOptions = [...productOptions];
    newProductOptions[optIdx].values.splice(valIdx, 1);
    setProductOptions(newProductOptions);
  };

  const handleAddTextValue = (optIdx, value) => {
    const val = value.trim();
    if (!val) return;
    const option = productOptions[optIdx];
    // Convert string to object based on whether it already uses objects
    const isObjectArray = option.values.length > 0 && typeof option.values[0] === 'object';
    const newValue = isObjectArray ? { value: val } : { value: val }; // Ensure object format for dragging
    
    // Check for duplicates
    if (option.values.some(v => (v.value || v) === val)) {
        toast.error(`Value "${val}" already exists`);
        return;
    }

    const newProductOptions = [...productOptions];
    newProductOptions[optIdx].values.push(newValue);
    setProductOptions(newProductOptions);
  };

  const handleAddOption = (withImage = false) => {
    if (productOptions.length >= 3) return;
    setProductOptions([
      ...productOptions,
      { id: Date.now(), name: "", values: [], hasImages: withImage },
    ]);
  };

  const handleRemoveOption = (id) => {
    setProductOptions(productOptions.filter((o) => o.id !== id));
    // Clean up input state
    const newInputs = { ...imageOptionInputs };
    delete newInputs[id];
    setImageOptionInputs(newInputs);
  };

  const handleOptionChange = (id, field, value) => {
    const newProductOption = productOptions.map((o) =>
      o.id === id ? { ...o, [field]: value } : o,
    );
    console.log(id, field, value);
    setProductOptions(newProductOption);
    console.log("newProductOption", newProductOption);
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  // Handle adding a value with image
  const handleAddImageValue = async (optionId, file, valueName) => {
    if (!file || !valueName.trim()) {
      toast.error("Please enter a value name and select an image");
      return;
    }

    // Set uploading state
    setImageOptionInputs((prev) => ({
      ...prev,
      [optionId]: { ...prev[optionId], uploading: true },
    }));

    try {
      const uploadData = new FormData();
      uploadData.append("image", file);
      uploadData.append("bucket", "products");
      uploadData.append("folder", "variant");

      const response = await api.post("/images/upload", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data?.success) {
        const imageUrl = response.data.data?.url || response.data?.url;

        // Add the value with image to the option
        const option = productOptions.find((o) => o.id === optionId);
        const newValue = { value: valueName.trim(), imageUrl };
        handleOptionChange(optionId, "values", [...option.values, newValue]);

        // Clear the input
        setImageOptionInputs((prev) => ({
          ...prev,
          [optionId]: { value: "", uploading: false, file: null },
        }));
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
      toast.error("Failed to upload image");
      setImageOptionInputs((prev) => ({
        ...prev,
        [optionId]: { ...prev[optionId], uploading: false },
      }));
    }
  };

  // Remove a value from image option
  const handleRemoveImageValue = (optionId, valueIndex) => {
    const option = productOptions.find((o) => o.id === optionId);
    const newValues = option.values.filter((_, i) => i !== valueIndex);
    handleOptionChange(optionId, "values", newValues);
  };

  const disabledBlurClass = isEditMode
    ? "opacity-60 blur-[1px] pointer-events-none select-none transition-all duration-300"
    : "";

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-bold text-slate-800 mb-4">
        Pricing & Variants
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Input
          label="Base Price (₹)"
          type="number"
          required
          placeholder="0.00"
          value={formData.basePrice}
          onChange={(e) =>
            setFormData({ ...formData, basePrice: e.target.value })
          }
        />
        <div className={disabledBlurClass}>
          <AsyncSelect
            label="1. Select Retailer"
            placeholder="Search Retailer"
            loadOptions={loadRetailers}
            value={retailer}
            onChange={(val) => {
              setRetailer(val);
              setFormData({ ...formData, warehouse: null }); // Reset warehouse when retailer changes
            }}
            disabled={isEditMode}
          />
        </div>
        <div className={disabledBlurClass}>
          <AsyncSelect
            label="2. Select Warehouse"
            placeholder={
              retailer ? "Select Warehouse" : "Select Retailer First"
            }
            loadOptions={loadWarehouses}
            value={formData.warehouse}
            onChange={(val) => setFormData({ ...formData, warehouse: val })}
            disabled={!retailer || isEditMode}
            key={retailer?.id} // Force re-render/re-fetch when retailer changes
          />
        </div>
      </div>

      <div className="border-t border-slate-100 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">
            Product Options
          </h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={Plus}
              onClick={() => handleAddOption(false)}
              disabled={productOptions.length >= 3}
              className="text-bukizz-orange hover:text-bukizz-orange hover:bg-orange-50"
            >
              Add Option
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={Image}
              onClick={() => handleAddOption(true)}
              disabled={productOptions.length >= 3}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              Add Option with Image
            </Button>
          </div>
        </div>

        {productOptions.length === 0 && (
          <div className="text-sm text-slate-500 italic mb-4">
            No options added. A default variant will be created.
          </div>
        )}

        <div className="space-y-4 mb-6">
          {productOptions.map((option) => (
            <div
              key={option.id}
              className={`p-4 rounded-lg border relative group ${
                option.hasImages
                  ? "bg-blue-50/50 border-blue-200"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <button
                onClick={() => handleRemoveOption(option.id)}
                className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>

              {/* Option Type Badge */}
              {option.hasImages && (
                <span className="absolute top-2 left-4 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                  With Images
                </span>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="md:col-span-1">
                  <Input
                    label="Option Name"
                    placeholder="e.g. Size, Color"
                    value={option.name}
                    onChange={(e) =>
                      handleOptionChange(option.id, "name", e.target.value)
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Option Values
                  </label>

                  {/* Values chips — draggable */}
                  <div className="flex flex-wrap gap-2 items-center mb-3">
                    {option.values.map((valObj, valIdx) => {
                      const displayValue = typeof valObj === 'object' ? valObj.value : valObj;
                      const imageUrl = typeof valObj === 'object' ? valObj.imageUrl : null;
                      
                      return (
                      <div
                        key={`${displayValue}-${valIdx}`}
                        draggable
                        onDragStart={() =>
                          setDragValState({
                            optIdx: productOptions.indexOf(option),
                            fromIdx: valIdx,
                            overIdx: null,
                          })
                        }
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragValState((prev) => ({
                            ...prev,
                            overIdx: valIdx,
                          }));
                        }}
                        onDragLeave={() =>
                          setDragValState((prev) => ({ ...prev, overIdx: null }))
                        }
                        onDrop={(e) => {
                          e.preventDefault();
                          const currentOptIdx = productOptions.indexOf(option);
                          if (dragValState.fromIdx !== null && dragValState.optIdx === currentOptIdx) {
                            reorderOptionValues(
                              currentOptIdx,
                              dragValState.fromIdx,
                              valIdx,
                            );
                          }
                          setDragValState({
                            optIdx: null,
                            fromIdx: null,
                            overIdx: null,
                          });
                        }}
                        onDragEnd={() =>
                          setDragValState({
                            optIdx: null,
                            fromIdx: null,
                            overIdx: null,
                          })
                        }
                        className={cn(
                          "inline-flex items-center gap-1.5 bg-white border rounded-full px-3 py-1 text-sm shadow-sm cursor-grab active:cursor-grabbing transition-all duration-150",
                          dragValState.optIdx === productOptions.indexOf(option) &&
                            dragValState.fromIdx === valIdx &&
                            "opacity-50 scale-95",
                          dragValState.optIdx === productOptions.indexOf(option) &&
                            dragValState.overIdx === valIdx &&
                            dragValState.fromIdx !== valIdx &&
                            "ring-2 ring-bukizz-orange scale-105",
                          dragValState.optIdx !== productOptions.indexOf(option) ||
                            dragValState.fromIdx === null
                            ? "border-slate-200"
                            : "",
                        )}
                      >
                        <GripVertical className="h-3 w-3 text-slate-300" />
                        {option.hasImages && !!imageUrl && (
                          <img
                            src={imageUrl}
                            alt={displayValue}
                            className="h-5 w-5 rounded-full object-cover ring-1 ring-slate-200 pointer-events-none"
                          />
                        )}
                        <span className="pointer-events-none">
                          {displayValue}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveValue(productOptions.indexOf(option), valIdx)}
                        >
                          <X className="h-3 w-3 text-slate-400 hover:text-red-500 transition-colors" />
                        </button>
                      </div>
                    )})}
                  </div>

                  {/* Add value input — different UI for image vs text options */}
                  {option.hasImages ? (
                      <div className="flex items-end gap-2 bg-white p-2 rounded border border-slate-200">
                        <div className="flex-1">
                          <Input
                            label="Value Name"
                            placeholder="e.g. Red, Large"
                            value={imageOptionInputs[option.id]?.value || ""}
                            onChange={(e) =>
                              setImageOptionInputs((prev) => ({
                                ...prev,
                                [option.id]: {
                                  ...prev[option.id],
                                  value: e.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleAddImageValue(
                                    option.id,
                                    file,
                                    imageOptionInputs[option.id]?.value || "",
                                  );
                                }
                              }}
                              disabled={imageOptionInputs[option.id]?.uploading}
                            />
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-2 text-sm rounded-lg ${
                                imageOptionInputs[option.id]?.uploading
                                  ? "bg-slate-100 text-slate-400"
                                  : "bg-bukizz-orange text-white hover:bg-orange-600"
                              }`}
                            >
                              {imageOptionInputs[option.id]?.uploading ? (
                                <>
                                  <Loader2 size={14} className="animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Plus size={14} />
                                  Add
                                </>
                              )}
                            </span>
                          </label>
                        </div>
                      </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        ref={(el) => {
                          optionInputRefs.current[productOptions.indexOf(option)] = el;
                        }}
                        type="text"
                        className="h-9 flex-1 text-sm rounded-md border border-slate-200 px-3 focus:border-bukizz-orange focus:ring-1 focus:ring-bukizz-orange focus:outline-none"
                        placeholder="Add value (e.g. S, M, L) and press Enter"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTextValue(productOptions.indexOf(option), e.currentTarget.value);
                            e.currentTarget.value = "";
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const idx = productOptions.indexOf(option);
                          const input = optionInputRefs.current[idx];
                          if (input && input.value.trim()) {
                            handleAddTextValue(idx, input.value);
                            input.value = "";
                            input.focus();
                          }
                        }}
                        className="h-9 w-9 flex items-center justify-center rounded-md bg-bukizz-orange text-white hover:bg-orange-600 transition-colors"
                        title="Add value"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Variants Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-2 px-3 font-medium text-slate-600">
                  Variant
                </th>
                <th className="py-2 px-3 font-medium text-slate-600 w-40">
                  SKU
                </th>
                <th className="py-2 px-3 font-medium text-slate-600 w-32">
                  Compare At (₹)
                </th>
                <th className="py-2 px-3 font-medium text-slate-600 w-24">
                  % Discount
                </th>
                <th className="py-2 px-3 font-medium text-slate-600 w-32">
                  Price (₹)
                </th>
                <th className="py-2 px-3 font-medium text-slate-600 w-24">
                  Stock
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {variants.map((variant, idx) => {
                // Calculate discount percentage
                const compareAt = Number(variant.compareAtPrice) || 0;
                const price = Number(variant.price) || 0;
                const discount =
                  compareAt > 0
                    ? Math.round(((compareAt - price) / compareAt) * 100)
                    : 0;

                // Handle discount change - calculate new price based on compareAtPrice
                const handleDiscountChange = (newDiscount) => {
                  const discountVal = Number(newDiscount) || 0;
                  if (compareAt > 0 && discountVal >= 0 && discountVal <= 100) {
                    const newPrice = Math.round(
                      compareAt * (1 - discountVal / 100),
                    );
                    handleVariantChange(idx, "price", newPrice);
                  }
                };

                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 text-slate-900 font-medium">
                      {variant.name}
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:border-bukizz-orange focus:outline-none"
                        value={variant.sku}
                        onChange={(e) =>
                          handleVariantChange(idx, "sku", e.target.value)
                        }
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:border-bukizz-orange focus:outline-none"
                        value={variant.compareAtPrice}
                        onChange={(e) =>
                          handleVariantChange(
                            idx,
                            "compareAtPrice",
                            e.target.value,
                          )
                        }
                      />
                    </td>
                    <td className="py-2 px-3">
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className={`w-full px-2 py-1 text-xs border rounded focus:border-bukizz-orange focus:outline-none ${
                            discount > 0
                              ? "border-green-300 bg-green-50 text-green-700"
                              : "border-slate-200"
                          }`}
                          value={discount}
                          onChange={(e) => handleDiscountChange(e.target.value)}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                          %
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:border-bukizz-orange focus:outline-none"
                        value={variant.price}
                        onChange={(e) =>
                          handleVariantChange(idx, "price", e.target.value)
                        }
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:border-bukizz-orange focus:outline-none"
                        value={variant.stock}
                        onChange={(e) =>
                          handleVariantChange(idx, "stock", e.target.value)
                        }
                      />
                    </td>
                  </tr>
                );
              })}
              {variants.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    Add options to generate variants
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductVariants;
