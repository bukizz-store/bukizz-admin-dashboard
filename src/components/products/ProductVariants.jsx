import React, { useState } from "react";
import { Plus, Trash2, Image, Loader2 } from "lucide-react";
import { Button, Input, AsyncSelect, MultiSelectChips } from "../ui";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";

const ProductVariants = ({
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
    const newProductOption = productOptions.map((o) => (o.id === id ? { ...o, [field]: value } : o));
    console.log(id, field, value);
    setProductOptions(newProductOption);
    console.log("newProductOption",newProductOption)
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

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-bold text-slate-800 mb-4">
        Pricing & Variants
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
        <div className="grid grid-cols-2 gap-2">
          <AsyncSelect
            label="1. Select Retailer"
            placeholder="Search Retailer"
            loadOptions={loadRetailers}
            value={retailer}
            onChange={(val) => {
              setRetailer(val);
              setFormData({ ...formData, warehouse: null }); // Reset warehouse when retailer changes
            }}
          />
          <AsyncSelect
            label="2. Select Warehouse"
            placeholder={
              retailer ? "Select Warehouse" : "Select Retailer First"
            }
            loadOptions={loadWarehouses}
            value={formData.warehouse}
            onChange={(val) => setFormData({ ...formData, warehouse: val })}
            disabled={!retailer}
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

                  {/* Regular option - text only */}
                  {!option.hasImages && (
                    <MultiSelectChips
                      placeholder="Type and press enter (e.g. S, M, Red)"
                      values={option.values}
                      onChange={(vals) =>
                        handleOptionChange(option.id, "values", vals)
                      }
                      allowCustom={true}
                    />
                  )}

                  {/* Image option - with image upload */}
                  {option.hasImages && (
                    <div className="space-y-3">
                      {/* Display existing values */}
                      <div className="flex flex-wrap gap-2">
                        {option.values.map((val, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-2 pr-3"
                          >
                            <img
                              src={val.imageUrl}
                              alt={val.value}
                              className="w-8 h-8 object-cover rounded"
                            />
                            <span className="text-sm text-slate-700">
                              {val.value}
                            </span>
                            <button
                              onClick={() =>
                                handleRemoveImageValue(option.id, idx)
                              }
                              className="ml-1 text-slate-400 hover:text-red-500"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add new value with image */}
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
                                  : "bg-blue-500 text-white hover:bg-blue-600"
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
                  Price (₹)
                </th>
                <th className="py-2 px-3 font-medium text-slate-600 w-24">
                  Stock
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {variants.map((variant, idx) => (
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
              ))}
              {variants.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-400">
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
