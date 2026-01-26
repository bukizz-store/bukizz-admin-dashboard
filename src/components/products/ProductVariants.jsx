import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, Input, AsyncSelect, MultiSelectChips } from "../ui";

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
  const handleAddOption = () => {
    if (productOptions.length >= 3) return;
    setProductOptions([
      ...productOptions,
      { id: Date.now(), name: "", values: [] },
    ]);
  };

  const handleRemoveOption = (id) => {
    setProductOptions(productOptions.filter((o) => o.id !== id));
  };

  const handleOptionChange = (id, field, value) => {
    setProductOptions(
      productOptions.map((o) => (o.id === id ? { ...o, [field]: value } : o)),
    );
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
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
          <Button
            variant="ghost"
            size="sm"
            icon={Plus}
            onClick={handleAddOption}
            disabled={productOptions.length >= 3}
            className="text-bukizz-orange hover:text-bukizz-orange hover:bg-orange-50"
          >
            Add Option
          </Button>
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
              className="p-4 bg-slate-50 rounded-lg border border-slate-200 relative group"
            >
              <button
                onClick={() => handleRemoveOption(option.id)}
                className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <MultiSelectChips
                    placeholder="Type and press enter (e.g. S, M, Red)"
                    values={option.values}
                    onChange={(vals) =>
                      handleOptionChange(option.id, "values", vals)
                    }
                    allowCustom={true}
                  />
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
