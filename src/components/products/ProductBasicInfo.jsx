import React from "react";
import { Input, Select, AsyncSelect, RichTextEditor } from "../ui";

const ProductBasicInfo = ({
  formData,
  setFormData,
  productType,
  setProductType,
  category,
  setCategory,
  school,
  setSchool,
  grade,
  setGrade,
  isMandatory,
  setIsMandatory,
  loaders,
}) => {
  const { loadBrands, loadCategories, loadSchools } = loaders;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-bold text-slate-800 mb-4">
        Basic Information
      </h2>

      {/* Type Switch */}
      <div className="flex gap-4 mb-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="type"
            className="w-4 h-4 text-bukizz-orange focus:ring-bukizz-orange"
            checked={productType === "general"}
            onChange={() => setProductType("general")}
          />
          <span className="text-sm font-medium text-slate-700">
            General Product
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="type"
            className="w-4 h-4 text-bukizz-orange focus:ring-bukizz-orange"
            checked={productType === "school"}
            onChange={() => setProductType("school")}
          />
          <span className="text-sm font-medium text-slate-700">
            School Product
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Input
          label="Product Title"
          required
          placeholder="e.g. Geometry Box Set"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
        <AsyncSelect
          label="Brand"
          placeholder="Search Brand..."
          loadOptions={loadBrands}
          value={formData.brand}
          onChange={(val) => setFormData({ ...formData, brand: val })}
        />
      </div>

      {/* Context Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {productType === "general" ? (
          <AsyncSelect
            label="Category"
            placeholder="Select Category"
            loadOptions={loadCategories}
            value={category}
            onChange={setCategory}
          />
        ) : (
          <>
            <AsyncSelect
              label="School"
              placeholder="Select School"
              loadOptions={loadSchools}
              value={school}
              onChange={setSchool}
            />
            <div className="flex gap-4">
              <Select
                label="Grade"
                options={[
                  "Nursery",
                  "LKG",
                  "UKG",
                  "1st",
                  "2nd",
                  "3rd",
                  "4th",
                  "5th",
                  "6th",
                  "7th",
                  "8th",
                  "9th",
                  "10th",
                  "11th",
                  "12th",
                ]}
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="flex-1"
              />
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMandatory}
                    onChange={(e) => setIsMandatory(e.target.checked)}
                    className="rounded text-bukizz-orange focus:ring-bukizz-orange"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Mandatory
                  </span>
                </label>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Input
          label="SKU (Stock Keeping Unit)"
          placeholder="PROD-001"
          value={formData.sku}
          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
        />
        <Input
          label="City Availability"
          placeholder="e.g. New Delhi"
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Short Description
        </label>
        <textarea
          className="w-full h-20 px-3 py-2 text-sm border-slate-200 border rounded-lg focus:ring-2 focus:ring-bukizz-orange/20 focus:outline-none"
          placeholder="Brief summary for product cards..."
          value={formData.shortDescription}
          onChange={(e) =>
            setFormData({ ...formData, shortDescription: e.target.value })
          }
        />
      </div>

      <div className="mb-4">
        <RichTextEditor
          label="Full Description"
          value={formData.fullDescription}
          onChange={(val) => setFormData({ ...formData, fullDescription: val })}
        />
      </div>
    </div>
  );
};

export default ProductBasicInfo;
