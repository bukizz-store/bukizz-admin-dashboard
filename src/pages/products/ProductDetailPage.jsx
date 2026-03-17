import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Edit2,
  ArrowLeft,
  ChevronRight,
  Package,
  School,
  Tag,
  MapPin,
  Building,
  Check,
  Trash2,
  X,
  Loader2,
  CreditCard,
  Percent,
  DollarSign,
  Truck,
  Settings,
  Save,
  Copy,
} from "lucide-react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Button, Input, ConfirmationModal } from "../../components/ui";
import { StatusBadge } from "../../components/common";
import { PAYMENT_METHODS } from "../../data/paymentMethods";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(null);

  // Action States
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deliveryCharge, setDeliveryCharge] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Approve modal: Variant Commissions
  const [variantCommissions, setVariantCommissions] = useState([]);
  // Approve modal: Payment Methods
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState(
    PAYMENT_METHODS.map((pm) => pm.value)
  );

  // Edit Admin Settings Modal
  const [showEditSettingsModal, setShowEditSettingsModal] = useState(false);
  const [editDeliveryCharge, setEditDeliveryCharge] = useState("");
  const [editVariantCommissions, setEditVariantCommissions] = useState([]);
  const [editPaymentMethods, setEditPaymentMethods] = useState([]);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/products/${id}`);
        if (response.data?.success) {
          const data = response.data.data.product;
          setProduct(data);
          // Set initial active image
          if (data.images && data.images.length > 0) {
            setActiveImage(data.images[0].url);
          } else if (data.mainImages && data.mainImages.length > 0) {
            setActiveImage(data.mainImages[0].url);
          }

          // Initialize variant commissions for approve modal
          if (data.variants && data.variants.length > 0) {
            // Check if commissions already exist
            const existingCommissions = data.variantCommissions || [];
            setVariantCommissions(
              data.variants.map((v) => {
                const existing = existingCommissions.find(
                  (ec) => ec.variant_id === v.id
                );
                return {
                  variantId: v.id,
                  variantName: getVariantDisplayName(v),
                  commissionType: existing?.commission_type || "percentage",
                  commissionValue: existing?.commission_value || "",
                };
              })
            );
          }

          // Initialize payment methods if already set
          if (data.paymentMethods && data.paymentMethods.length > 0) {
            setSelectedPaymentMethods(data.paymentMethods);
          }
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
        toast.error("Failed to load product details");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, toast]);

  const getVariantDisplayName = (variant) => {
    const parts = [];
    if (variant.option_value_1_ref?.value) parts.push(variant.option_value_1_ref.value);
    if (variant.option_value_2_ref?.value) parts.push(variant.option_value_2_ref.value);
    if (variant.option_value_3_ref?.value) parts.push(variant.option_value_3_ref.value);
    return parts.length > 0 ? parts.join(" / ") : variant.sku || "Default Variant";
  };

  const handleApproveProduct = async () => {
    if (!deliveryCharge && deliveryCharge !== 0) {
      return toast.error("Please enter a delivery charge");
    }

    // Validate commissions
    const hasEmptyCommission = variantCommissions.some(
      (vc) => vc.commissionValue === "" || vc.commissionValue === undefined
    );
    if (hasEmptyCommission) {
      return toast.error("Please set commission for all variants");
    }

    if (selectedPaymentMethods.length === 0) {
      return toast.error("Please select at least one payment method");
    }

    setIsApproving(true);
    try {
      const response = await api.patch(`/products/${id}/activate`, {
        deliveryCharge: Number(deliveryCharge),
        variantCommissions: variantCommissions.map((vc) => ({
          variantId: vc.variantId,
          commissionType: vc.commissionType,
          commissionValue: Number(vc.commissionValue),
        })),
        paymentMethods: selectedPaymentMethods,
      });

      if (response.data?.success) {
        toast.success("Product approved successfully");
        setProduct({
          ...product,
          is_active: true,
          delivery_charge: Number(deliveryCharge),
          paymentMethods: selectedPaymentMethods,
          variantCommissions: variantCommissions,
        });
        setShowApproveModal(false);
      }
    } catch (error) {
      console.error("Failed to approve product:", error);
      toast.error(error.response?.data?.message || "Failed to approve product");
    } finally {
      setIsApproving(false);
    }
  };

  const handleOpenEditSettings = () => {
    // Pre-fill with current values
    setEditDeliveryCharge(product.delivery_charge || "");
    setEditPaymentMethods(
      product.paymentMethods && product.paymentMethods.length > 0
        ? product.paymentMethods
        : PAYMENT_METHODS.map((pm) => pm.value)
    );

    const existingCommissions = product.variantCommissions || [];
    setEditVariantCommissions(
      (product.variants || []).map((v) => {
        const existing = existingCommissions.find(
          (ec) => ec.variant_id === v.id
        );
        return {
          variantId: v.id,
          variantName: getVariantDisplayName(v),
          commissionType: existing?.commission_type || "percentage",
          commissionValue: existing?.commission_value ?? "",
        };
      })
    );
    setShowEditSettingsModal(true);
  };

  const handleSaveSettings = async () => {
    if (editDeliveryCharge === "" && editDeliveryCharge !== 0) {
      return toast.error("Please enter a delivery charge");
    }

    if (editPaymentMethods.length === 0) {
      return toast.error("Please select at least one payment method");
    }

    setIsSavingSettings(true);
    try {
      const response = await api.patch(`/products/${id}/activate`, {
        deliveryCharge: Number(editDeliveryCharge),
        variantCommissions: editVariantCommissions.map((vc) => ({
          variantId: vc.variantId,
          commissionType: vc.commissionType,
          commissionValue: Number(vc.commissionValue),
        })),
        paymentMethods: editPaymentMethods,
      });

      if (response.data?.success) {
        toast.success("Settings updated successfully");
        setProduct({
          ...product,
          delivery_charge: Number(editDeliveryCharge),
          paymentMethods: editPaymentMethods,
          variantCommissions: editVariantCommissions,
        });
        setShowEditSettingsModal(false);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error(error.response?.data?.message || "Failed to save settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await api.delete(`/products/${id}`);
      if (response.data?.success) {
        toast.success("Product deleted successfully");
        navigate("/products");
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast.error("Failed to delete product");
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const updateCommission = (index, field, value, stateArr, setStateArr) => {
    const updated = [...stateArr];
    updated[index] = { ...updated[index], [field]: value };
    setStateArr(updated);
  };

  const togglePaymentMethod = (method, selectedArr, setSelectedArr) => {
    setSelectedArr((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method]
    );
  };

  // --- Commission & Payment Method UI Helpers ---
  const renderVariantCommissionInputs = (commissions, setCommissions) => (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-700">
        Variant Commissions
      </label>
      <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600 text-xs uppercase">
            <tr>
              <th className="text-left py-2 px-3">Variant</th>
              <th className="text-left py-2 px-3">Type</th>
              <th className="text-left py-2 px-3">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {commissions.map((vc, idx) => (
              <tr key={vc.variantId} className="hover:bg-slate-50/50">
                <td className="py-2 px-3 text-slate-800 font-medium text-xs">
                  {vc.variantName}
                </td>
                <td className="py-2 px-3">
                  <select
                    value={vc.commissionType}
                    onChange={(e) =>
                      updateCommission(idx, "commissionType", e.target.value, commissions, setCommissions)
                    }
                    className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-bukizz-orange"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat (₹)</option>
                  </select>
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-1">
                    {vc.commissionType === "percentage" ? (
                      <Percent size={12} className="text-slate-400" />
                    ) : (
                      <span className="text-xs text-slate-400">₹</span>
                    )}
                    <input
                      type="number"
                      min="0"
                      step={vc.commissionType === "percentage" ? "0.1" : "1"}
                      value={vc.commissionValue}
                      onChange={(e) =>
                        updateCommission(idx, "commissionValue", e.target.value, commissions, setCommissions)
                      }
                      placeholder="0"
                      className="w-20 text-xs border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-bukizz-orange"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPaymentMethodCheckboxes = (selected, setSelected) => (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-700">
        Allowed Payment Methods
      </label>
      <div className="flex flex-wrap gap-3">
        {PAYMENT_METHODS.map((pm) => (
          <label
            key={pm.value}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all text-sm ${
              selected.includes(pm.value)
                ? "bg-orange-50 border-bukizz-orange text-orange-700 ring-1 ring-bukizz-orange/30"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(pm.value)}
              onChange={() => togglePaymentMethod(pm.value, selected, setSelected)}
              className="sr-only"
            />
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                selected.includes(pm.value)
                  ? "bg-bukizz-orange border-bukizz-orange"
                  : "border-slate-300 bg-white"
              }`}
            >
              {selected.includes(pm.value) && (
                <Check size={10} className="text-white" />
              )}
            </div>
            <CreditCard size={14} />
            {pm.label}
          </label>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bukizz-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bukizz-orange"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bukizz-bg gap-4">
        <h2 className="text-xl font-semibold text-slate-700">
          Product not found
        </h2>
        <Button onClick={() => navigate("/products")} icon={ArrowLeft}>
          Back to Products
        </Button>
      </div>
    );
  }

  const isSchoolProduct = product.product_type !== "general";
  const totalStock = product.variants?.reduce(
    (acc, curr) => acc + (curr.stock || 0),
    0,
  );

  // Helper for Status Badge logic
  const getStockStatus = (stock) => {
    if (stock === 0) return "out_of_stock";
    if (stock < 10) return "low_stock";
    return "in_stock";
  };

  // Extract Context Data
  const categories = product.product_categories
    ?.map((pc) => pc.categories?.name)
    .join(", ");
  const schoolName =
    product.school?.name || product.products_school?.school?.name;
  const grade = product.schoolData?.grade || product.products_school?.grade;
  const isMandatory =
    product.schoolData?.mandatory || product.products_school?.mandatory;

  // Resolve commission display
  const existingCommissions = product.variantCommissions || [];

  return (
    <div className="min-h-screen bg-bukizz-bg p-6 relative">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span
            className="cursor-pointer hover:text-slate-800"
            onClick={() => navigate("/")}
          >
            Home
          </span>
          <ChevronRight size={14} />
          <span
            className="cursor-pointer hover:text-slate-800"
            onClick={() => navigate("/products")}
          >
            Products
          </span>
          <ChevronRight size={14} />
          <span className="font-medium text-slate-900 truncate max-w-50">
            {product.title}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {!product.is_active && (
            <Button
              onClick={() => setShowApproveModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white border-none"
              disabled={isApproving}
            >
              <Check size={16} className="mr-2" />
              Approve Product
            </Button>
          )}

          <Button
            onClick={() => navigate(`/products/edit/${id}`)}
            variant="secondary"
            className="shrink-0"
          >
            <Edit2 size={16} className="mr-2" />
            Edit Product
          </Button>

          <Button
            onClick={() => navigate(`/products/create?duplicateId=${id}`)}
            variant="secondary"
            className="shrink-0"
          >
            <Copy size={16} className="mr-2" />
            Duplicate
          </Button>

          <Button
            onClick={handleDeleteClick}
            variant="danger"
            className="shrink-0"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left Column: Media Gallery */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm aspect-square flex items-center justify-center overflow-hidden relative">
            {activeImage ? (
              <img
                src={activeImage}
                alt={product.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-300 gap-2">
                <Package size={48} />
                <span className="text-sm">No Image Available</span>
              </div>
            )}

            {/* Type Badge Overlay */}
            <div className="absolute top-4 left-4">
              {isSchoolProduct ? (
                <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full border border-orange-200 shadow-sm">
                  School Product
                </span>
              ) : (
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-200 shadow-sm">
                  General
                </span>
              )}
            </div>
          </div>

          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img.url)}
                  className={`w-16 h-16 rounded-lg border shrink-0 overflow-hidden transition-all ${
                    activeImage === img.url
                      ? "border-bukizz-orange ring-2 ring-bukizz-orange/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`Thumbnail ${idx}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Intelligence */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col gap-4">
              {/* Title & Status */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 mb-2">
                    {product.title}
                  </h1>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${product.is_active ? "bg-green-500" : "bg-red-500"}`}
                    ></span>
                    <span className="text-sm text-slate-600">
                      {product.is_active ? "Active" : "Inactive"}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-sm text-slate-500">
                      SKU: {product.sku}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-slate-900">
                    ₹{product.base_price?.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">Base Price</div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Context Card */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                {isSchoolProduct ? (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-orange-500 shrink-0">
                        <School size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                          School
                        </div>
                        <div className="text-sm font-medium text-slate-900">
                          {schoolName || "N/A"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-orange-500 shrink-0">
                        <Tag size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                          Grade & Type
                        </div>
                        <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
                          <span>{grade || "All Grades"}</span>
                          <span className="text-slate-300">•</span>
                          {isMandatory && (
                            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
                              Mandatory
                            </span>
                          )}
                          <span className="capitalize">
                            {product.product_type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-500 shrink-0">
                        <Tag size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                          Category
                        </div>
                        <div className="text-sm font-medium text-slate-900">
                          {categories || "Uncategorized"}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Warehouse Info - Applicable to both */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                    <Building size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                      Warehouse
                    </div>
                    <div className="text-sm font-medium text-slate-900">
                      {product.products_warehouse?.warehouse ? (
                        <button
                          onClick={() =>
                            navigate(
                              `/warehouse/${product.products_warehouse.warehouse.id}`,
                            )
                          }
                          className="hover:text-bukizz-orange hover:underline text-left"
                        >
                          {product.products_warehouse.warehouse.name}
                        </button>
                      ) : (
                        "N/A"
                      )}
                    </div>
                  </div>
                </div>

                {/* City */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                      City Availability
                    </div>
                    <div className="text-sm font-medium text-slate-900 capitalize">
                      {product.city || "All Cities"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Highlights */}
              {product.highlight &&
                Object.keys(product.highlight).length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-3">
                      Highlights
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                      {Object.entries(product.highlight).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex justify-between border-b border-slate-50 py-2"
                        >
                          <span className="text-sm text-slate-500">{key}</span>
                          <span className="text-sm font-medium text-slate-700 text-right">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Description */}
              {product.description && (
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-2">
                    Description
                  </h3>
                  <div
                    className="prose prose-sm text-slate-600 max-w-none"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Variants Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">
            Variants Inventory
          </h2>
          <div className="text-sm text-slate-500">
            Total Stock:{" "}
            <span className="font-semibold text-slate-900">{totalStock}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                {/* Dynamic Headers */}
                {product.variants?.[0]?.option_value_1_ref && (
                  <th className="py-3 px-4">
                    {product.variants[0].option_value_1_ref.attribute_name}
                  </th>
                )}
                {product.variants?.[0]?.option_value_2_ref && (
                  <th className="py-3 px-4">
                    {product.variants[0].option_value_2_ref.attribute_name}
                  </th>
                )}
                {product.variants?.[0]?.option_value_3_ref && (
                  <th className="py-3 px-4">
                    {product.variants[0].option_value_3_ref.attribute_name}
                  </th>
                )}
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Commission</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {product.variants?.map((variant) => {
                const commission = existingCommissions.find(
                  (c) => c.variant_id === variant.id
                );
                return (
                  <tr key={variant.id} className="hover:bg-slate-50/50">
                    {/* Dynamic Values */}
                    {product.variants?.[0]?.option_value_1_ref && (
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {variant.option_value_1_ref?.value || "-"}
                      </td>
                    )}
                    {product.variants?.[0]?.option_value_2_ref && (
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {variant.option_value_2_ref?.value || "-"}
                      </td>
                    )}
                    {product.variants?.[0]?.option_value_3_ref && (
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {variant.option_value_3_ref?.value || "-"}
                      </td>
                    )}
                    <td className="py-3 px-4 text-slate-500">{variant.sku}</td>
                    <td className="py-3 px-4 font-medium">
                      ₹
                      {(variant.variant_price || variant.price)?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">{variant.stock}</td>
                    <td className="py-3 px-4">
                      {commission ? (
                        <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
                          {commission.commission_type === "percentage"
                            ? `${commission.commission_value}%`
                            : `₹${commission.commission_value}`}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Not set</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={getStockStatus(variant.stock)} />
                    </td>
                  </tr>
                );
              })}
              {(!product.variants || product.variants.length === 0) && (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No variants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Settings Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-slate-500" />
            <h2 className="text-lg font-bold text-slate-800">Admin Settings</h2>
          </div>
          <Button
            onClick={handleOpenEditSettings}
            variant="secondary"
            className="text-sm"
          >
            <Edit2 size={14} className="mr-1.5" />
            Edit Settings
          </Button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Delivery Charge */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Truck size={16} className="text-slate-500" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Delivery Charge
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900">
              ₹{product.delivery_charge || 0}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard size={16} className="text-slate-500" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Payment Methods
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {product.paymentMethods && product.paymentMethods.length > 0 ? (
                product.paymentMethods.map((pm) => {
                  const method = PAYMENT_METHODS.find((m) => m.value === pm);
                  return (
                    <span
                      key={pm}
                      className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-md border border-green-100 font-medium"
                    >
                      {method?.label || pm}
                    </span>
                  );
                })
              ) : (
                <span className="text-xs text-slate-400">Not set</span>
              )}
            </div>
          </div>

          {/* Commissions Summary */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Percent size={16} className="text-slate-500" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Commissions
              </span>
            </div>
            {existingCommissions.length > 0 ? (
              <div className="space-y-1">
                {existingCommissions.slice(0, 3).map((c, idx) => {
                  const variant = product.variants?.find((v) => v.id === c.variant_id);
                  return (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-slate-600 truncate max-w-[120px]">
                        {variant ? getVariantDisplayName(variant) : "Variant"}
                      </span>
                      <span className="font-medium text-slate-800">
                        {c.commission_type === "percentage"
                          ? `${c.commission_value}%`
                          : `₹${c.commission_value}`}
                      </span>
                    </div>
                  );
                })}
                {existingCommissions.length > 3 && (
                  <span className="text-xs text-slate-400">
                    +{existingCommissions.length - 3} more
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-slate-400">Not set</span>
            )}
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 pb-4 border-b border-slate-100 z-10">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">
                  Approve Product
                </h3>
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Configure delivery, commissions, and payment methods to activate this product.
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Delivery Charge */}
              <Input
                label="Delivery Charge (₹)"
                type="number"
                placeholder="e.g. 50"
                value={deliveryCharge}
                onChange={(e) => setDeliveryCharge(e.target.value)}
              />

              {/* Variant Commissions */}
              {variantCommissions.length > 0 &&
                renderVariantCommissionInputs(variantCommissions, setVariantCommissions)}

              {/* Payment Methods */}
              {renderPaymentMethodCheckboxes(selectedPaymentMethods, setSelectedPaymentMethods)}
            </div>

            <div className="sticky bottom-0 bg-white p-6 pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <Button
                onClick={handleApproveProduct}
                disabled={isApproving}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isApproving && (
                  <Loader2 size={16} className="animate-spin mr-2" />
                )}
                Confirm Approval
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Settings Modal */}
      {showEditSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 pb-4 border-b border-slate-100 z-10">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">
                  Edit Admin Settings
                </h3>
                <button
                  onClick={() => setShowEditSettingsModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Update delivery charge, commissions, and payment methods.
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Delivery Charge */}
              <Input
                label="Delivery Charge (₹)"
                type="number"
                placeholder="e.g. 50"
                value={editDeliveryCharge}
                onChange={(e) => setEditDeliveryCharge(e.target.value)}
              />

              {/* Variant Commissions */}
              {editVariantCommissions.length > 0 &&
                renderVariantCommissionInputs(editVariantCommissions, setEditVariantCommissions)}

              {/* Payment Methods */}
              {renderPaymentMethodCheckboxes(editPaymentMethods, setEditPaymentMethods)}
            </div>

            <div className="sticky bottom-0 bg-white p-6 pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowEditSettingsModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <Button
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="bg-bukizz-orange hover:bg-orange-600 text-white"
              >
                {isSavingSettings && (
                  <Loader2 size={16} className="animate-spin mr-2" />
                )}
                <Save size={16} className="mr-1.5" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ProductDetailPage;
