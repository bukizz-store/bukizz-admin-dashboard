import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";

// Components
import ProductFormHeader from "../../components/products/ProductFormHeader";
import ProductBasicInfo from "../../components/products/ProductBasicInfo";
import ProductVariants from "../../components/products/ProductVariants";
import ProductMedia from "../../components/products/ProductMedia";
import KeyValueManager from "../../components/products/KeyValueManager";
import MetadataForm from "../../components/products/MetadataForm";

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
    compareAtPrice: "", // Added compareAtPrice
  });

  // Context Specific
  const [category, setCategory] = useState([]);
  const [school, setSchool] = useState(null);
  const [grade, setGrade] = useState("");
  const [isMandatory, setIsMandatory] = useState(false);
  const [schoolProductType, setSchoolProductType] = useState("bookset"); // 'bookset' | 'uniform' | 'stationary'

  // Section B: Options & Variants
  const [productOptions, setProductOptions] = useState([]); // [{ id: 1, name: 'Size', values: ['S', 'M'] }]
  const [variants, setVariants] = useState([]);
  const [retailer, setRetailer] = useState(null);

  // Section C: Media
  const [images, setImages] = useState([]);

  // Section D: Product Highlights (Key-Value pairs)
  const [highlights, setHighlights] = useState([{ key: "", value: "" }]);

  // Section E: Category Attributes (Dynamic metadata)
  const [categoryAttributes, setCategoryAttributes] = useState([]);
  const [metadata, setMetadata] = useState({});

  // --- Fetch Data for Editing ---
  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}/comprehensive`);
        if (response.data?.success) {
          const product = response.data.data;
          console.log("Fetched Comprehensive Product:", product);

          // 1. Basic Info
          setFormData({
            ...product.productData,
            fullDescription: product.productData.description || "",
            brand: product.brandData
              ? { id: product.brandData.brandId, label: product.brandData.name }
              : null,
            warehouse: product.warehouseData
              ? {
                  id: product.warehouseData.warehouseId,
                  label: product.warehouseData.name,
                }
              : null,
          });

          // 2. Type & Context
          setProductType(
            product.productType === "general" ? "general" : "school",
          );

          if (product.productType !== "general") {
            setSchoolProductType(product.productType);
          }

          // Categories
          if (product.categories && product.categories.length > 0) {
            setCategory(product.categories);
          }

          // School Data
          if (product.schoolData) {
            setSchool({
              id: product.schoolData.schoolId,
              label: product.schoolData.name,
            });
            setGrade(product.schoolData.grade || "");
            setIsMandatory(product.schoolData.mandatory || false);
          }

          // 3. Retailer (Fetch via Warehouse)
          if (product.warehouseData) {
            try {
              const whId = product.warehouseData.warehouseId;
              const whRes = await api.get(`/warehouses/${whId}`);
              if (whRes.data?.success) {
                const whData = whRes.data.data.warehouse || whRes.data.data;
                if (whData.retailer) {
                  setRetailer({
                    id: whData.retailer.id,
                    label:
                      whData.retailer.full_name ||
                      whData.retailer.email ||
                      "Retailer",
                  });
                }
              }
            } catch (whErr) {
              console.error("Failed to fetch retailer for product:", whErr);
            }
          }

          // 4. Highlights
          if (product.highlights && product.highlights.length > 0) {
            setHighlights(product.highlights);
          } else {
            setHighlights([{ key: "", value: "" }]);
          }

          // 5. Product Options (Pre-computed from Backend!)
          if (product.productOptions && product.productOptions.length > 0) {
            setProductOptions(product.productOptions);
          }

          // 6. Variants (Pre-computed from Backend!)
          if (product.variants && product.variants.length > 0) {
            setVariants(product.variants);
          }

          // 7. Images
          if (product.images && product.images.length > 0) {
            setImages(product.images.map((img) => img.url));
          }

          // 8. Metadata
          if (product.metadata) {
            setMetadata(
              product.metadata.categoryAttributes || product.metadata,
            );
          }
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
        toast.error("Failed to fetch product details");
        navigate("/products");
      }
    };

    fetchProduct();
  }, [id, navigate, toast]);

  // --- Fetch Category Attributes when category changes ---
  useEffect(() => {
    const fetchCategoryAttributes = async () => {
      if (!category || category.length === 0) {
        setCategoryAttributes([]);
        return;
      }

      try {
        // Fetch the first category's productAttributes
        const categoryId = category[0]?.id;
        if (!categoryId) return;

        const response = await api.get(`/categories/${categoryId}`);
        if (response.data?.success) {
          const catData = response.data.data.category || response.data.data;
          const attrs =
            catData.productAttributes || catData.product_attributes || [];
          setCategoryAttributes(attrs);
        }
      } catch (error) {
        console.error("Failed to fetch category attributes:", error);
        setCategoryAttributes([]);
      }
    };

    fetchCategoryAttributes();
  }, [category]);

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
    if (!formData.city) return []; // Require city to be selected first
    try {
      const params = {
        page: 1,
        limit: 20,
        search: query || "",
        city: formData.city, // Filter by selected city
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
          compareAtPrice: formData.compareAtPrice || 0, // Default to product's compareAtPrice
          stock: 0,
          options: {},
        },
      ];
    }

    // Helper to extract value string from option value (handles both string and {value, image} objects)
    const getValueString = (val) => (typeof val === "string" ? val : val.value);
    const getValueImage = (val) => (typeof val === "object" ? val.image : null);

    const cartesian = (args) => {
      const result = [];
      const max = args.length - 1;
      const helper = (arr, i) => {
        for (let j = 0, l = args[i].values.length; j < l; j++) {
          const a = arr.slice(0); // clone arr
          const val = args[i].values[j];
          a.push({
            name: args[i].name,
            value: getValueString(val),
            image: getValueImage(val),
            hasImages: args[i].hasImages,
          });
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
        (acc, curr) => ({
          ...acc,
          [curr.name]: curr.value,
          ...(curr.image ? { [`${curr.name}_image`]: curr.image } : {}),
        }),
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
        compareAtPrice: formData.compareAtPrice || 0, // Default to product's compareAtPrice
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
            compareAtPrice: existing.compareAtPrice, // Preserve existing values
            stock: existing.stock,
            sku: existing.sku,
            id: existing.id,
          };
        }
        return nv;
      });
    });
  }, [
    productOptions,
    formData.basePrice,
    formData.compareAtPrice,
    formData.sku,
  ]);

  // --- Submission Handler ---

  // --- Submission Handler ---

  const handleSubmit = async () => {
    // 1. Validation
    if (!formData.title) return toast.error("Product name is required");
    if (!formData.basePrice) return toast.error("Base price is required");
    if (!formData.city) return toast.error("City is required");
    // Retailer and Warehouse are required
    if (!retailer)
      return toast.error(
        "Retailer is required. Ensure warehouse has a linked retailer.",
      );
    if (!formData.warehouse) return toast.error("Warehouse is required");

    if (productType === "school" && !school)
      return toast.error("School is required for school products");
    if (productType === "general" && (!category || category.length === 0))
      return toast.error(
        "At least one category is required for general products",
      );

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
          return null;
        }),
      );

      // Filter out failed uploads
      const validImageUrls = uploadedImageUrls.filter((url) => url);

      // 2. Transform highlights to object
      const highlightsObject = highlights.reduce((acc, curr) => {
        if (curr.key.trim() && curr.value.trim()) {
          acc[curr.key.trim()] = curr.value.trim();
        }
        return acc;
      }, {});

      // 2.5 Calculate compare_price from variant with highest discount
      // let comparePriceFromVariant = 0;
      // if (variants.length > 0) {
      //   let maxDiscount = 0;
      //   variants.forEach((v) => {
      //     const compareAt = Number(v.compareAtPrice) || 0;
      //     const price = Number(v.price) || 0;
      //     const discount =
      //       compareAt > 0 ? ((compareAt - price) / compareAt) * 100 : 0;
      //     if (discount > maxDiscount) {
      //       maxDiscount = discount;
      //       comparePriceFromVariant = compareAt;
      //     }
      //   });
      // }

      // 2.6 Payload Construction
      console.log("old product Options : ", productOptions);
      const payload = {
        // --- SECTION 1: FLAGS ---
        replaceVariants: false,
        replaceImages: false,

        retailerId: retailer.id,

        // --- SECTION 2: BASIC DATA ---
        productData: {
          title: formData.title,
          sku: formData.sku,
          productType: productType === "school" ? schoolProductType : "general",
          basePrice: Number(formData.basePrice),
          compareAtPrice: Number(formData.compareAtPrice),
          shortDescription: formData.shortDescription,
          description: formData.fullDescription,
          city: formData.city,
          currency: "INR",
          highlight: { ...highlightsObject },
          metadata: {
            categoryAttributes: { ...metadata },
            compare_price: Number(formData.compareAtPrice), // compareAtPrice of highest discount variant
          },
          isActive: true, // Default to true or add toggle
        },

        // --- SECTION 3: PRODUCT OPTIONS ---
        productOptions: productOptions.map((opt, idx) => ({
          name: opt.name,
          values: opt.values.map((val) => {
            if (typeof val === "string") {
              return { value: val, imageUrl: null }; // New value without image
            }
            // Handle { value, image }
            return { value: val.value, imageUrl: val.imageUrl || null };
          }),
          position: idx + 1,
          isRequired: true,
          // Add ID if it exists and isn't a temp one (temp ones usually numeric timestamp)
          // If we tracked IDs in state, we would pass them here. For now, backend handles creation/matching.
        })),

        // --- SECTION 4: VARIANTS ---
        variants: variants.map((v) => {
          // Extract option values based on position in productOptions
          // productOptions is ordered by position (1, 2, 3)
          const option1 =
            productOptions.length > 0 && productOptions[0].name
              ? v.options[productOptions[0].name]
              : null;
          const option2 =
            productOptions.length > 1 && productOptions[1].name
              ? v.options[productOptions[1].name]
              : null;
          const option3 =
            productOptions.length > 2 && productOptions[2].name
              ? v.options[productOptions[2].name]
              : null;

          return {
            id: v.id && !v.id.toString().startsWith("var_") ? v.id : undefined, // Send ID only if it's a real UUID
            sku: v.sku,
            price: Number(v.price),
            compareAtPrice: Number(v.compareAtPrice),
            stock: Number(v.stock),
            weight: 0.2, // Default weight as requested
            option1: option1 || null,
            option2: option2 || null,
            option3: option3 || null,
            metadata: {
              // Add any specific metadata here if needed, e.g., barcode
              // barcode: v.barcode
            },
          };
        }),

        // --- SECTION 5: IMAGES ---
        images: validImageUrls.map((url, idx) => ({
          url: url,
          altText: formData.title,
          sortOrder: idx,
          isPrimary: idx === 0,
          // variantId: ... if we supported per-variant images in UI
        })),

        // --- SECTION 6: WAREHOUSE ---
        warehouseData: formData.warehouse
          ? {
              type: "existing",
              warehouseId: formData.warehouse.id,
            }
          : null,

        // --- SECTION 7: BRAND ---
        brandData: formData.brand
          ? {
              type: "existing",
              brandId: formData.brand.id,
            }
          : null,

        // --- SECTION 8: CATEGORIES ---
        categories:
          productType === "general" && category.length > 0
            ? category.map((c) => ({ id: c.id }))
            : [],

        // --- SCHOOL DATA ---
        schoolData:
          productType === "school" && school
            ? {
                schoolId: school.id,
                grade: grade,
                mandatory: isMandatory,
              }
            : null,
      };

      // console.log("Submitting Payload:", payload);

      if (isEditMode) {
        await api.put(`/products/${id}/comprehensive`, payload);
        toast.success("Product updated successfully");
      } else {
        await api.post("/products/comprehensive", payload);
        toast.success("Product created successfully");
        console.log("Payload:", payload);
        // throw new Error("Product not created");
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
            isEditMode={isEditMode}
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
            schoolProductType={schoolProductType}
            setSchoolProductType={setSchoolProductType}
            loaders={{ loadBrands, loadCategories, loadSchools }}
          />

          {/* Dynamic Category Attributes */}
          {categoryAttributes.length > 0 && (
            <MetadataForm
              attributes={categoryAttributes}
              value={metadata}
              onChange={setMetadata}
            />
          )}

          {/* Product Highlights Section */}
          <KeyValueManager
            highlights={highlights}
            setHighlights={setHighlights}
          />

          <ProductVariants
            isEditMode={isEditMode}
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
