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

  // --- Fetch Data for Editing ---
  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        if (response.data?.success) {
          const product = response.data.data.product;
          console.log("Fetched Product:", product);

          // 1. Basic Info
          setFormData({
            title: product.title,
            sku: product.sku,
            basePrice: product.base_price,
            compareAtPrice: product.compare_at_price || "", // Populate compareAtPrice
            shortDescription: product.short_description || "",
            fullDescription: product.description || "", // Ensure description flows into RTE
            city: product.city,
            brand: product.product_brands?.[0]?.brands
              ? {
                  id: product.product_brands[0].brands.id,
                  label: product.product_brands[0].brands.name,
                }
              : null,
            warehouse: product.products_warehouse?.warehouse
              ? {
                  id: product.products_warehouse.warehouse.id,
                  label: product.products_warehouse.warehouse.name,
                }
              : null,
          });

          // 2. Type & Context
          const pType = product.product_type;
          setProductType(pType === "general" ? "general" : "school");

          if (pType !== "general") {
            setSchoolProductType(pType);
          }

          // Categories
          if (
            product.product_categories &&
            product.product_categories.length > 0
          ) {
            const cats = product.product_categories
              .map((pc) => pc.categories)
              .filter(Boolean)
              .map((c) => ({
                id: c.id,
                label: c.name,
              }));
            setCategory(cats);
          }

          // School Data
          if (product.school) {
            setSchool({ id: product.school.id, label: product.school.name });
            const sData = product.schoolData || {};
            setGrade(sData.grade || "");
            setIsMandatory(sData.mandatory || false);
          } else if (product.products_school?.school) {
            setSchool({
              id: product.products_school.school.id,
              label: product.products_school.school.name,
            });
            setGrade(product.products_school.grade || "");
            setIsMandatory(product.products_school.mandatory || false);
          }

          // 3. Retailer (Fetch via Warehouse)
          if (product.products_warehouse?.warehouse?.id) {
            try {
              const whId = product.products_warehouse.warehouse.id;
              const whRes = await api.get(`/warehouses/${whId}`);
              if (whRes.data?.success) {
                const whData = whRes.data.data.warehouse || whRes.data.data; // Handle potential wrapper
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
          } else if (product.retailer) {
            setRetailer({
              id: product.retailer.id,
              label:
                product.retailer.full_name ||
                product.retailer.email ||
                "Retailer",
            });
          }

          // 4. Highlights
          if (product.highlight) {
            const highlightArray = Object.entries(product.highlight).map(
              ([key, value]) => ({
                key,
                value,
              }),
            );
            setHighlights(
              highlightArray.length > 0
                ? highlightArray
                : [{ key: "", value: "" }],
            );
          }

          // 5. Product Options (Reconstruct from Variants)
          if (product.variants && product.variants.length > 0) {
            const reconstructedOptions = [];

            // Helper to process options at positions 1, 2, 3
            const processOptionPosition = (pos) => {
              const refKey = `option_value_${pos}_ref`;

              // Find the first variant that has this option defined to get the name
              const referenceVariant = product.variants.find((v) => v[refKey]);
              if (!referenceVariant) return;

              const attributeName = referenceVariant[refKey].attribute_name;
              const uniqueValuesMap = new Map(); // value -> { value, imageUrl }

              product.variants.forEach((variant) => {
                const ref = variant[refKey];
                if (ref && ref.value) {
                  // Only add if not already present
                  if (!uniqueValuesMap.has(ref.value)) {
                    uniqueValuesMap.set(ref.value, {
                      value: ref.value,
                      imageUrl: ref.imageUrl || null,
                    });
                  }
                }
              });

              // Check if ANY value has an image URL
              const hasImages = Array.from(uniqueValuesMap.values()).some(
                (v) => v.imageUrl,
              );

              reconstructedOptions.push({
                id: Date.now() + pos,
                name: attributeName,
                position: pos,
                hasImages: hasImages,
                values: Array.from(uniqueValuesMap.values()).map((v) =>
                  hasImages ? { value: v.value, image: v.imageUrl } : v.value,
                ),
              });
            };

            processOptionPosition(1);
            processOptionPosition(2);
            processOptionPosition(3);

            setProductOptions(reconstructedOptions);
          }

          // 6. Variants
          if (product.variants) {
            setVariants(
              product.variants.map((v) => ({
                id: v.id,
                name: [
                  v.option_value_1_ref?.value,
                  v.option_value_2_ref?.value,
                  v.option_value_3_ref?.value,
                ]
                  .filter(Boolean)
                  .join(" / "),
                sku: v.sku,
                price: v.variant_price || v.price,
                compareAtPrice: v.compare_at_price, // Populate variant compareAtPrice
                stock: v.stock,
                options: {
                  [v.option_value_1_ref?.attribute_name]:
                    v.option_value_1_ref?.value,
                  [v.option_value_2_ref?.attribute_name]:
                    v.option_value_2_ref?.value,
                  [v.option_value_3_ref?.attribute_name]:
                    v.option_value_3_ref?.value,
                }, // Re-map for local state usage
              })),
            );
          }

          // 7. Images
          if (product.images && product.images.length > 0) {
            // Sort by sortOrder if available
            const sortedImages = [...product.images].sort(
              (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
            );
            setImages(sortedImages.map((img) => img.url));
          } else if (product.mainImages && product.mainImages.length > 0) {
            const sortedImages = [...product.mainImages].sort(
              (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
            );
            setImages(sortedImages.map((img) => img.url));
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

      // 2.5 Payload Construction
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

      console.log("Submitting Payload:", payload);

      if (isEditMode) {
        await api.put(`/products/${id}`, payload);
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

          {/* Product Highlights Section */}
          <KeyValueManager
            highlights={highlights}
            setHighlights={setHighlights}
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
