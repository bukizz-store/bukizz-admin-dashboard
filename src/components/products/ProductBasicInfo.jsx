import React, { useState } from "react";
import { Input, Select, AsyncSelect, RichTextEditor } from "../ui";
import { X, Plus, Loader2 } from "lucide-react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";

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
  schoolProductType,
  setSchoolProductType,
  loaders,
}) => {
  const { loadBrands, loadCategories, loadSchools } = loaders;
  const toast = useToast();

  // Add Brand Modal State
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [brandForm, setBrandForm] = useState({
    name: "",
    slug: "",
    description: "",
    country: "",
    logoUrl: "",
  });
  const [isAddingBrand, setIsAddingBrand] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [brandKey, setBrandKey] = useState(0); // For refreshing AsyncSelect

  // Check if brand should be shown
  const showBrand =
    productType === "general" ||
    (productType === "school" &&
      (schoolProductType === "uniform" || schoolProductType === "stationary"));

  // Generate slug from name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  // Handle Add Brand
  const handleAddBrand = async () => {
    if (!brandForm.name) return;

    setIsAddingBrand(true);
    try {
      const payload = {
        name: brandForm.name,
        slug: brandForm.slug || generateSlug(brandForm.name),
        description: brandForm.description,
        country: brandForm.country,
        logoUrl: brandForm.logoUrl,
      };

      const response = await api.post("/brands", payload);

      if (response.data?.success) {
        // Set the newly created brand as selected
        const newBrand = response.data.data;
        setFormData({
          ...formData,
          brand: { id: newBrand.id, label: newBrand.name },
        });
        setShowAddBrand(false);
        setBrandForm({
          name: "",
          slug: "",
          description: "",
          country: "",
          logoUrl: "",
        });
        setBrandKey((prev) => prev + 1); // Refresh the AsyncSelect
      }
    } catch (error) {
      console.error("Failed to add brand:", error);
      toast.error(error.response?.data?.message || "Failed to add brand");
    } finally {
      setIsAddingBrand(false);
    }
  };

  // Handle Logo Upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const uploadData = new FormData();
      uploadData.append("image", file);

      const response = await api.post("/images/upload", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data?.success) {
        const url = response.data.data?.url || response.data?.url;
        setBrandForm({ ...brandForm, logoUrl: url });
      }
    } catch (error) {
      console.error("Failed to upload logo:", error);
      toast.error("Failed to upload logo");
    } finally {
      setIsUploadingLogo(false);
    }
  };

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
        {/* Brand for general products only - school products have it in Product Type section */}
        {productType === "general" && (
          <div className="relative">
            <AsyncSelect
              key={brandKey}
              label="Brand"
              placeholder="Search Brand..."
              loadOptions={loadBrands}
              value={formData.brand}
              onChange={(val) => setFormData({ ...formData, brand: val })}
            />
            <button
              type="button"
              onClick={() => setShowAddBrand(true)}
              className="absolute right-0 top-0 text-xs text-bukizz-orange hover:underline flex items-center gap-1"
            >
              <Plus size={12} /> Add New
            </button>
          </div>
        )}
      </div>

      {/* Context Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {productType === "general" ? (
          <>
            <AsyncSelect
              label="Category"
              placeholder="Select Category"
              loadOptions={loadCategories}
              value={category}
              onChange={setCategory}
            />
            <Input
              label="City Availability"
              placeholder="e.g. New Delhi"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
            />
          </>
        ) : (
          <>
            <Select
              label="City"
              options={[
                { value: "gurugram", label: "Gurugram" },
                { value: "kanpur", label: "Kanpur" },
              ]}
              value={formData.city}
              onChange={(e) => {
                setFormData({ ...formData, city: e.target.value });
                setSchool(null); // Reset school when city changes
              }}
            />
            <AsyncSelect
              key={formData.city} // Re-fetch schools when city changes
              label="School"
              placeholder={
                formData.city ? "Select School" : "Select city first"
              }
              loadOptions={loadSchools}
              value={school}
              onChange={setSchool}
              isDisabled={!formData.city}
            />
          </>
        )}
      </div>

      {/* Product Type for School */}
      {productType === "school" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Select
            label="Product Type"
            options={[
              { value: "bookset", label: "Book Set" },
              { value: "uniform", label: "Uniform" },
              { value: "stationary", label: "Stationary" },
            ]}
            value={schoolProductType}
            onChange={(e) => setSchoolProductType(e.target.value)}
          />
          {/* Show Brand for uniform/stationary */}
          {showBrand && (
            <div className="relative">
              <AsyncSelect
                key={brandKey}
                label="Brand"
                placeholder="Search Brand..."
                loadOptions={loadBrands}
                value={formData.brand}
                onChange={(val) => setFormData({ ...formData, brand: val })}
              />
              <button
                type="button"
                onClick={() => setShowAddBrand(true)}
                className="absolute right-0 top-0 text-xs text-bukizz-orange hover:underline flex items-center gap-1"
              >
                <Plus size={12} /> Add New
              </button>
            </div>
          )}
        </div>
      )}

      {/* Grade and Mandatory (only for bookset) */}
      {productType === "school" && schoolProductType === "bookset" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Input
          label="SKU (Stock Keeping Unit)"
          placeholder="PROD-001"
          value={formData.sku}
          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
        />
        <Input
          label="Base Price"
          type="number"
          placeholder="0.00"
          value={formData.basePrice}
          onChange={(e) =>
            setFormData({ ...formData, basePrice: e.target.value })
          }
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
          returnHtml={true}
        />
      </div>

      {/* Add Brand Modal */}
      {showAddBrand && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                Add New Brand
              </h3>
              <button
                onClick={() => setShowAddBrand(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="Brand Name"
                required
                placeholder="e.g. Nike"
                value={brandForm.name}
                onChange={(e) => {
                  setBrandForm({
                    ...brandForm,
                    name: e.target.value,
                    slug: generateSlug(e.target.value),
                  });
                }}
              />
              <Input
                label="Slug"
                placeholder="e.g. nike"
                value={brandForm.slug}
                onChange={(e) =>
                  setBrandForm({ ...brandForm, slug: e.target.value })
                }
              />
              <Input
                label="Description"
                placeholder="e.g. Just do it."
                value={brandForm.description}
                onChange={(e) =>
                  setBrandForm({ ...brandForm, description: e.target.value })
                }
              />
              <Input
                label="Country"
                placeholder="e.g. USA"
                value={brandForm.country}
                onChange={(e) =>
                  setBrandForm({ ...brandForm, country: e.target.value })
                }
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Brand Logo
                </label>
                <div className="flex items-center gap-3">
                  {brandForm.logoUrl ? (
                    <img
                      src={brandForm.logoUrl}
                      alt="Logo preview"
                      className="w-12 h-12 object-contain rounded border border-slate-200"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                      No logo
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <span className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded text-slate-700 flex items-center gap-2">
                      {isUploadingLogo ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Plus size={14} />
                          {brandForm.logoUrl ? "Change" : "Upload"}
                        </>
                      )}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowAddBrand(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddBrand}
                disabled={isAddingBrand || !brandForm.name}
                className="px-4 py-2 bg-bukizz-orange text-white text-sm rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
              >
                {isAddingBrand && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                Add Brand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductBasicInfo;
