import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";

// Components
import ProductFormHeader from "../../components/products/ProductFormHeader";
import ProductBasicInfo from "../../components/products/ProductBasicInfo";
import ProductVariants from "../../components/products/ProductVariants";
import ProductMedia from "../../components/products/ProductMedia";

const ProductFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const toast = useToast();

  // --- State ---
  const [isSaving, setIsSaving] = useState(false);

  // Section A: Basic Info
  const [productType, setProductType] = useState("general"); // 'general' | 'school'
  const [formData, setFormData] = useState({
    title: "",
    sku: "",
    brand: null, // {id, label}
    warehouse: null, // {id, label}
    city: "",
    shortDescription: "",
    fullDescription: "",
    basePrice: "",
  });

  // Context Specific
  const [category, setCategory] = useState(null);
  const [school, setSchool] = useState(null);
  const [grade, setGrade] = useState("");
  const [isMandatory, setIsMandatory] = useState(false);

  // Section B: Options & Variants
  const [productOptions, setProductOptions] = useState([]); // [{ id: 1, name: 'Size', values: ['S', 'M'] }]
  const [variants, setVariants] = useState([]);
  const [retailer, setRetailer] = useState(null);

  // Section C: Media
  const [images, setImages] = useState([]);

  // --- Helpers ---

  // Mock API Loaders for AsyncSelect
  const loadCategories = async (query) => {
    try {
      const params = {
        page: 1,
        limit: 20,
        search: query || "",
        sortBy: "name",
        sortOrder: "asc",
      };
      const response = await api.get("/categories", { params });
      if (response.data?.success) {
        return response.data.data.categories.map((c) => ({
          id: c.id,
          label: c.name,
        }));
      }
      return [];
    } catch (error) {
      console.error("Failed to load categories", error);
      return [];
    }
  };

  const loadSchools = async (query) => {
    try {
      const params = {
        page: 1,
        limit: 20,
        search: query || "",
        // city: "Mumbai", // Using specific city as requested
      };
      const response = await api.get("/schools", { params });
      if (response.data?.success) {
        return response.data.data.schools.map((s) => ({
          id: s.id,
          label: s.name,
        }));
      }
      return [];
    } catch (error) {
      console.error("Failed to load schools", error);
      return [];
    }
  };

  const loadBrands = async (query) => {
    try {
      const params = {
        page: 1,
        limit: 20,
        search: query || "",
        sortBy: "name",
        sortOrder: "asc",
      };
      if (params.search === "") {
        delete params.search;
      }
      const response = await api.get("/brands", { params });
      if (response.data?.success) {
        return response.data.data.brands.map((b) => ({
          id: b.id,
          label: b.name,
        }));
      }
      return [];
    } catch (error) {
      console.error("Failed to load brands", error);
      return [];
    }
  };

  const loadRetailers = async (query) => {
    try {
      const params = {
        q: query || "",
        role: "retailer",
      };
      const response = await api.get("/users/admin/search", { params });
      if (response.data?.success) {
        const users = response.data.data.users || [];
        console.log(users);
        return users.map((r) => ({
          id: r.id,
          label: r.full_name || r.email || "Unknown Retailer",
        }));
      }
      return [];
    } catch (error) {
      console.error("Failed to load retailers", error);
      return [];
    }
  };

  const loadWarehouses = async (query) => {
    if (!retailer) return [];
    try {
      const response = await api.get(`/warehouses/retailer/${retailer.id}`);
      console.log(response.data);
      if (response.data?.success) {
        let whs = response.data.data.warehouses || [];
        if (query) {
          whs = whs.filter(
            (w) =>
              (w.name && w.name.toLowerCase().includes(query.toLowerCase())) ||
              (w.address &&
                w.address.city &&
                w.address.city.toLowerCase().includes(query.toLowerCase())),
          );
        }
        console.log(whs);
        return whs.map((w) => ({
          id: w.id,
          label: w.name,
          ...w,
        }));
      }
      return [];
    } catch (error) {
      console.error("Failed to load warehouses", error);
      return [];
    }
  };

  // --- Variant Logic ---

  // Generate Cartesian Product
  const generateVariants = (options, basePrice) => {
    const validOptions = options.filter((o) => o.name && o.values.length > 0);

    if (validOptions.length === 0) {
      // Default single variant
      return [
        {
          id: "default",
          name: "Default Variant",
          sku: formData.sku,
          price: basePrice || 0,
          stock: 0,
          options: {},
        },
      ];
    }

    const cartesian = (args) => {
      const result = [];
      const max = args.length - 1;
      const helper = (arr, i) => {
        for (let j = 0, l = args[i].values.length; j < l; j++) {
          const a = arr.slice(0); // clone arr
          a.push({ name: args[i].name, value: args[i].values[j] });
          if (i === max) result.push(a);
          else helper(a, i + 1);
        }
      };
      helper([], 0);
      return result;
    };

    const combinations = cartesian(validOptions);

    return combinations.map((combo, idx) => {
      const variantName = combo.map((c) => c.value).join(" / ");
      const optionMap = combo.reduce(
        (acc, curr) => ({ ...acc, [curr.name]: curr.value }),
        {},
      );
      const autoSku = formData.sku
        ? `${formData.sku}-${combo.map((c) => c.value).join("-")}`
        : "";

      return {
        id: `var_${idx}`, // Temporary ID
        name: variantName,
        sku: autoSku,
        price: basePrice || 0,
        stock: 0,
        options: optionMap,
      };
    });
  };

  // Regeneration Effect
  useEffect(() => {
    const newVariants = generateVariants(productOptions, formData.basePrice);

    setVariants((prev) => {
      // Create map of existing variants by name
      const prevMap = new Map(prev.map((p) => [p.name, p]));

      return newVariants.map((nv) => {
        const existing = prevMap.get(nv.name);
        if (existing && existing.name !== "Default Variant") {
          return {
            ...nv,
            price: existing.price,
            stock: existing.stock,
            sku: existing.sku,
          };
        }
        return nv;
      });
    });
  }, [productOptions, formData.basePrice, formData.sku]);

  // --- Submission Handler ---

  const handleSubmit = async () => {
    // 1. Validation
    if (!formData.title) return toast.error("Product name is required");
    if (!formData.basePrice) return toast.error("Base price is required");
    if (!formData.city) return toast.error("City is required");
    if (!retailer) return toast.error("Retailer is required");
    if (!formData.warehouse) return toast.error("Warehouse is required");

    if (productType === "school" && !school)
      return toast.error("School is required for school products");
    if (productType === "general" && !category)
      return toast.error("Category is required for general products");

    setIsSaving(true);
    try {
      // 1.5 Upload New Images
      const uploadedImageUrls = await Promise.all(
        images.map(async (img) => {
          if (typeof img === "string") return img; // Already a URL

          if (img instanceof File) {
            const formData = new FormData();
            formData.append("image", img);
            try {
              const response = await api.post("/images/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
              });
              // Adjust based on actual API response structure.
              // Assuming standard SuccessResponse(data: { url: ... })
              return response.data.data?.url || response.data?.url || "";
            } catch (uploadErr) {
              console.error("Image upload failed:", uploadErr);
              throw new Error(`Failed to upload image: ${img.name}`);
            }
          }
          return null; // Should not happen if correctly filtered
        }),
      );

      // Filter out failed uploads if any return null/empty (though we throw error above)
      const validImageUrls = uploadedImageUrls.filter((url) => url);

      // 2. Payload Construction
      const payload = {
        retailerId: retailer.id,
        productData: {
          title: formData.title,
          sku: formData.sku,
          productType: productType, // Backend expects: bookset, uniform, stationary, school, general
          basePrice: Number(formData.basePrice),
          shortDescription: formData.shortDescription,
          description: formData.fullDescription, // Mapped from fullDescription
          city: formData.city,
          currency: "INR",
          metadata: {},
        },
        brandData: formData.brand
          ? {
              type: "existing",
              brandId: formData.brand.id,
            }
          : null,
        warehouseData: formData.warehouse
          ? {
              type: "existing",
              warehouseId: formData.warehouse.id,
            }
          : null,
        categories:
          productType === "general" && category ? [{ id: category.id }] : [],
        schoolData:
          productType === "school" && school
            ? {
                schoolId: school.id,
                grade: grade,
                mandatory: isMandatory,
              }
            : null,
        productOptions: productOptions.map((opt, idx) => ({
          name: opt.name,
          values: opt.values,
          position: idx + 1,
          isRequired: true,
        })),
        variants: variants.map((v) => {
          const optionsPayload = {};
          // Map variants to option1, option2, option3 based on productOptions order
          if (productOptions[0])
            optionsPayload.option1 = v.options[productOptions[0].name];
          if (productOptions[1])
            optionsPayload.option2 = v.options[productOptions[1].name];
          if (productOptions[2])
            optionsPayload.option3 = v.options[productOptions[2].name];

          return {
            sku: v.sku,
            price: Number(v.price),
            stock: Number(v.stock),
            ...optionsPayload,
            metadata: { ...v.options },
          };
        }),
        images: validImageUrls.map((url, idx) => ({
          url: url,
          altText: formData.title,
          sortOrder: idx,
          isPrimary: idx === 0,
          variantId: null,
        })),
      };

      console.log("Submitting Payload:", payload);

      if (isEditMode) {
        await api.put(`/products/${id}`, payload);
        toast.success("Product updated successfully");
      } else {
        await api.post("/products/comprehensive", payload);
        toast.success("Product created successfully");
      }
      navigate("/products");
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to save product",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 bg-bukizz-bg min-h-screen pb-20">
      <ProductFormHeader
        isEditMode={isEditMode}
        isSaving={isSaving}
        onSave={handleSubmit}
        onCancel={() => navigate("/products")}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Main Info) */}
        <div className="lg:col-span-2 space-y-6">
          <ProductBasicInfo
            formData={formData}
            setFormData={setFormData}
            productType={productType}
            setProductType={setProductType}
            category={category}
            setCategory={setCategory}
            school={school}
            setSchool={setSchool}
            grade={grade}
            setGrade={setGrade}
            isMandatory={isMandatory}
            setIsMandatory={setIsMandatory}
            loaders={{ loadBrands, loadCategories, loadSchools }}
          />

          <ProductVariants
            formData={formData}
            setFormData={setFormData}
            productOptions={productOptions}
            setProductOptions={setProductOptions}
            variants={variants}
            setVariants={setVariants}
            loadWarehouses={loadWarehouses}
            retailer={retailer}
            setRetailer={setRetailer}
            loadRetailers={loadRetailers}
          />
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
          <ProductMedia images={images} setImages={setImages} />

          {/* Publishing Status (Mock) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wide">
              Status
            </h2>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-600">Active</span>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
            </div>
            <div className="text-xs text-slate-500">
              Product will be visible in the catalog immediately after saving.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFormPage;
