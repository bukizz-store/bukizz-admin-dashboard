import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Loader2, Trash2, Edit, LayoutGrid, List, Check, X, CreditCard, Percent, Copy } from "lucide-react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import {
  FilterBar,
  DataTable,
  Pagination,
  StatusBadge,
} from "../../components/common";
import { Button, ConfirmationModal, Tooltip, Input } from "../../components/ui";
import { PAYMENT_METHODS } from "../../data/paymentMethods";

const ProductListPage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. URL State
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const currentLimit = parseInt(searchParams.get("limit") || "20", 10);
  const currentSearch = searchParams.get("search") || "";
  const currentType = searchParams.get("productType") || ""; // Empty for all
  const currentIsActive = searchParams.get("isActive") || "";
  const currentCity = searchParams.get("city") || "";

  // 2. Local State
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paginationMetadata, setPaginationMetadata] = useState({
    total: 0,
    totalPages: 1,
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState(currentSearch);
  const [viewMode, setViewMode] = useState("list"); // 'list' | 'grid'
  const [togglingIds, setTogglingIds] = useState(new Set()); // Track products being toggled

  // Approve Modal State
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveProduct, setApproveProduct] = useState(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [approveDeliveryCharge, setApproveDeliveryCharge] = useState("");
  const [approveCommissions, setApproveCommissions] = useState([]);
  const [approvePaymentMethods, setApprovePaymentMethods] = useState(
    PAYMENT_METHODS.map((pm) => pm.value)
  );
  const [isApproving, setIsApproving] = useState(false);

  // Sync search term
  useEffect(() => {
    setSearchTerm(currentSearch);
  }, [currentSearch]);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== currentSearch) {
        setSearchParams((prev) => {
          const newParams = new URLSearchParams(prev);
          if (searchTerm) {
            newParams.set("search", searchTerm);
            newParams.set("page", "1");
          } else {
            newParams.delete("search");
          }
          return newParams;
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, currentSearch, setSearchParams]);

  // 3. Fetch Data
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      // Construct params
      const params = {
        page: currentPage,
        limit: currentLimit,
        search: currentSearch || undefined,
        productType: currentType || undefined,
        isActive: currentIsActive || undefined,
        city: currentCity || undefined,
      };

      const response = await api.get("/products", { params });

      const result = response.data;
      if (result.success) {
        setProducts(result.data.products);
        setPaginationMetadata(result.data.pagination);
      } else {
        toast.error("Failed to fetch products: " + result.message);
      }
    } catch (error) {
      console.error("Fetch Products Error:", error);
      toast.error("Failed to fetch products");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [
    currentPage,
    currentLimit,
    currentSearch,
    currentType,
    currentIsActive,
    currentCity,
  ]);

  // 146 is empty after removal of fetchFilterOptions effects

  // 4. Handlers
  const handleFilterChange = (key, value) => {
    setSearchParams((prev) => {
      const ps = new URLSearchParams(prev);
      if (value && value !== "all") ps.set(key, value);
      else ps.delete(key);
      if (key !== "page") ps.set("page", "1");
      return ps;
    });
  };

  const confirmDelete = (product) => {
    setSelectedProduct(product);
    setDeleteModalOpen(true);
  };

  const handleRowClick = (product) => {
    navigate(`/products/${product.id}`);
  };

  // Toggle Active/Inactive Status
  const handleToggleActive = async (product) => {
    const productId = product.id;
    const newIsActive = !product.isActive;

    // Add to toggling set
    setTogglingIds((prev) => new Set([...prev, productId]));

    try {
      await api.put(`/products/${productId}/status`, {
        isActive: newIsActive,
      });

      // Update local state
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, isActive: newIsActive } : p,
        ),
      );

      toast.success(
        `Product ${newIsActive ? "activated" : "deactivated"} successfully`,
      );
    } catch (error) {
      console.error("Failed to toggle product status:", error);
      toast.error(
        error.response?.data?.message || "Failed to update product status",
      );
    } finally {
      setTogglingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    setIsDeleting(true);
    try {
      await api.delete(`/products/${selectedProduct.id}`);
      setProducts((prev) => prev.filter((p) => p.id !== selectedProduct.id));
      toast.success("Product deleted successfully");
      setDeleteModalOpen(false);
    } catch (error) {
      toast.error("Failed to delete product");
    } finally {
      setIsDeleting(false);
      setSelectedProduct(null);
    }
  };

  // --- Approve Flow ---
  const getVariantDisplayName = (variant) => {
    const parts = [];
    if (variant.option_value_1_ref?.value) parts.push(variant.option_value_1_ref.value);
    if (variant.option_value_2_ref?.value) parts.push(variant.option_value_2_ref.value);
    if (variant.option_value_3_ref?.value) parts.push(variant.option_value_3_ref.value);
    return parts.length > 0 ? parts.join(" / ") : variant.sku || "Default Variant";
  };

  const handleOpenApprove = async (product) => {
    setApproveLoading(true);
    setShowApproveModal(true);
    setApproveDeliveryCharge("");
    setApprovePaymentMethods(PAYMENT_METHODS.map((pm) => pm.value));

    try {
      // Fetch full product to get variants
      const response = await api.get(`/products/${product.id}`);
      if (response.data?.success) {
        const data = response.data.data.product;
        setApproveProduct(data);
        const existingCommissions = data.variantCommissions || [];
        setApproveCommissions(
          (data.variants || []).map((v) => {
            const existing = existingCommissions.find((ec) => ec.variant_id === v.id);
            return {
              variantId: v.id,
              variantName: getVariantDisplayName(v),
              commissionType: existing?.commission_type || "percentage",
              commissionValue: existing?.commission_value || "",
            };
          })
        );
        if (data.paymentMethods && data.paymentMethods.length > 0) {
          setApprovePaymentMethods(data.paymentMethods);
        }
      }
    } catch (error) {
      console.error("Failed to fetch product for approval:", error);
      toast.error("Failed to load product details");
      setShowApproveModal(false);
    } finally {
      setApproveLoading(false);
    }
  };

  const handleConfirmApprove = async () => {
    if (!approveProduct) return;
    if (!approveDeliveryCharge && approveDeliveryCharge !== 0) {
      return toast.error("Please enter a delivery charge");
    }
    const hasEmpty = approveCommissions.some((vc) => vc.commissionValue === "" || vc.commissionValue === undefined);
    if (hasEmpty) return toast.error("Please set commission for all variants");
    if (approvePaymentMethods.length === 0) return toast.error("Select at least one payment method");

    setIsApproving(true);
    try {
      const response = await api.patch(`/products/${approveProduct.id}/activate`, {
        deliveryCharge: Number(approveDeliveryCharge),
        variantCommissions: approveCommissions.map((vc) => ({
          variantId: vc.variantId,
          commissionType: vc.commissionType,
          commissionValue: Number(vc.commissionValue),
        })),
        paymentMethods: approvePaymentMethods,
      });

      if (response.data?.success) {
        toast.success("Product approved successfully");
        setProducts((prev) =>
          prev.map((p) => (p.id === approveProduct.id ? { ...p, isActive: true } : p))
        );
        setShowApproveModal(false);
        setApproveProduct(null);
      }
    } catch (error) {
      console.error("Failed to approve product:", error);
      toast.error(error.response?.data?.message || "Failed to approve product");
    } finally {
      setIsApproving(false);
    }
  };

  const updateApproveCommission = (index, field, value) => {
    setApproveCommissions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const toggleApprovePayment = (method) => {
    setApprovePaymentMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  // 5. Columns
  const columns = [
    {
      header: "Product",
      accessor: "title",
      render: (row) => (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
            {row.images && row.images.length > 0 ? (
              <img
                // Find the primary image, OR default to the first image, THEN access the .url
                src={
                  (row.images.find((img) => img.isPrimary) || row.images[0]).url
                }
                alt={row.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-xs text-slate-400 font-medium">No Img</div>
            )}
          </div>
          <div className="min-w-0">
            <div
              className="font-semibold text-slate-900 truncate max-w-50 cursor-pointer hover:text-bukizz-orange"
              title={row.title}
              onClick={() => handleRowClick(row)}
            >
              {row.title}
            </div>
            {row.sku && (
              <div className="text-xs text-slate-500">SKU: {row.sku}</div>
            )}
            <div className="flex sm:hidden mt-1 gap-1">
              <span className="text-xs font-bold text-slate-900">
                ₹{row.basePrice?.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Context",
      accessor: "context",
      render: (row) => {
        if (row.productType === "school") {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              {row.schoolName || "School Product"}
            </span>
          );
        }
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {row.categories?.[0]?.name || "General"}
          </span>
        );
      },
      className: "hidden md:table-cell",
    },
    {
      header: "Price",
      accessor: "basePrice",
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900">
            ₹{row.basePrice?.toLocaleString()}
          </div>
          {/* Add compare price logic if available in schema later */}
        </div>
      ),
      className: "hidden sm:table-cell",
    },
    {
      header: "Status",
      accessor: "isActive",
      render: (row) => (
        <span
          className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
            row.isActive
              ? "bg-green-100 text-green-800"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      header: "City",
      accessor: "town",
      render: (row) => (
        <span className="text-sm text-slate-700 capitalize">
          {row.town || row.city || "-"}
        </span>
      ),
    },
    {
      header: "Last Updated",
      accessor: "updatedAt",
      render: (row) => (
        <span className="text-sm text-slate-500">
          {new Date(row.updatedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) => (
        <div
          className="flex items-center justify-end gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {!row.isActive && (
            <Tooltip content="Approve Product">
              <button
                onClick={() => handleOpenApprove(row)}
                className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
              >
                <Check size={18} />
              </button>
            </Tooltip>
          )}
          <Tooltip content="Edit Product">
            <button
              onClick={() => navigate(`/products/edit/${row.id}`)}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              <Edit size={18} />
            </button>
          </Tooltip>
          <Tooltip content="Duplicate Product">
            <button
              onClick={() => navigate(`/products/create?duplicateId=${row.id}`)}
              className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
            >
              <Copy size={18} />
            </button>
          </Tooltip>
          <Tooltip content="Delete Product">
            <button
              onClick={() => confirmDelete(row)}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-bukizz-bg min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-bukizz-navy">
            Product Catalog
          </h1>
          <p className="text-sm text-slate-500">
            Manage your product inventory for schools and general market
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-slate-100 text-bukizz-navy" : "text-slate-400 hover:text-slate-600"}`}
              title="List View"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-all ${viewMode === "grid" ? "bg-slate-100 text-bukizz-navy" : "text-slate-400 hover:text-slate-600"}`}
              title="Grid View"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => navigate("/products/create")}
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchTerm={searchTerm}
        onSearch={(val) => setSearchTerm(val)}
        filterConfig={[
          {
            label: "Product Type",
            options: ["General", "School"],
            value: currentType
              ? currentType.charAt(0).toUpperCase() + currentType.slice(1)
              : "",
            onChange: (val) =>
              handleFilterChange("productType", val ? val.toLowerCase() : ""),
          },
          {
            label: "Status",
            options: ["Active", "Inactive"],
            value: currentIsActive
              ? currentIsActive === "true"
                ? "Active"
                : "Inactive"
              : "",
            onChange: (val) =>
              handleFilterChange(
                "isActive",
                val ? (val === "Active" ? "true" : "false") : "",
              ),
          },
          {
            label: "City",
            options: ["gurugram", "kanpur"],
            value: currentCity,
            onChange: (val) => handleFilterChange("city", val || ""),
          },
        ]}
        searchPlaceholder="Search by Name, SKU, or Brand..."
      />

      {/* Content */}
      <div className="min-h-96 mt-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-slate-400">
            <Loader2 className="animate-spin w-8 h-8 text-bukizz-orange" />
            <span className="ml-3 font-medium">Loading products...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-slate-400 bg-white rounded-lg border border-slate-100 border-dashed">
            <p>No products found matching your filters.</p>
          </div>
        ) : viewMode === "list" ? (
          <DataTable
            columns={columns}
            data={products}
            pagination={false}
            onRowClick={handleRowClick}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group cursor-pointer"
                onClick={() => handleRowClick(product)}
              >
                <div className="aspect-4/3 bg-slate-100 relative overflow-hidden">
                  {product.images?.find((img) => img.isPrimary) ||
                  product.images?.[0] ? (
                    <img
                      src={
                        (
                          product.images.find((img) => img.isPrimary) ||
                          product.images[0]
                        ).url
                      }
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-medium">
                      No Image
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold text-white shadow-sm ${product.isActive ? "bg-green-500" : "bg-red-500"}`}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-2">
                    {product.productType === "school" ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-800 uppercase tracking-wide">
                        School: {product.schoolName || "Generic"}
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 uppercase tracking-wide">
                        {product.categories?.[0]?.name || "General"}
                      </span>
                    )}
                  </div>
                  <h3
                    className="font-semibold text-slate-900 line-clamp-2 h-10 mb-2"
                    title={product.title}
                  >
                    {product.title}
                  </h3>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-lg font-bold text-slate-900">
                        ₹{product.basePrice?.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500">Base Price</div>
                    </div>
                    <div
                      className="flex gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!product.isActive && (
                        <button
                          onClick={() => handleOpenApprove(product)}
                          className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                          title="Approve"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/products/edit/${product.id}`)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => navigate(`/products/create?duplicateId=${product.id}`)}
                        className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                        title="Duplicate"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => confirmDelete(product)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && products.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={paginationMetadata.totalPages}
          itemsPerPage={currentLimit}
          totalItems={paginationMetadata.total}
          onPageChange={(p) => handleFilterChange("page", p)}
          onItemsPerPageChange={(l) => handleFilterChange("limit", l)}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${selectedProduct?.title}"? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete Product"}
        isLoading={isDeleting}
      />

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
                  onClick={() => { setShowApproveModal(false); setApproveProduct(null); }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>
              {approveProduct && (
                <p className="text-sm text-slate-500 mt-1 truncate">
                  {approveProduct.title}
                </p>
              )}
            </div>

            {approveLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="animate-spin w-8 h-8 text-bukizz-orange" />
                <span className="ml-3 text-sm text-slate-500">Loading product details...</span>
              </div>
            ) : (
              <>
                <div className="p-6 space-y-6">
                  {/* Delivery Charge */}
                  <Input
                    label="Delivery Charge (₹)"
                    type="number"
                    placeholder="e.g. 50"
                    value={approveDeliveryCharge}
                    onChange={(e) => setApproveDeliveryCharge(e.target.value)}
                  />

                  {/* Variant Commissions */}
                  {approveCommissions.length > 0 && (
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-slate-700">Variant Commissions</label>
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
                            {approveCommissions.map((vc, idx) => (
                              <tr key={vc.variantId} className="hover:bg-slate-50/50">
                                <td className="py-2 px-3 text-slate-800 font-medium text-xs">{vc.variantName}</td>
                                <td className="py-2 px-3">
                                  <select
                                    value={vc.commissionType}
                                    onChange={(e) => updateApproveCommission(idx, "commissionType", e.target.value)}
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
                                      onChange={(e) => updateApproveCommission(idx, "commissionValue", e.target.value)}
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
                  )}

                  {/* Payment Methods */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-700">Allowed Payment Methods</label>
                    <div className="flex flex-wrap gap-3">
                      {PAYMENT_METHODS.map((pm) => (
                        <label
                          key={pm.value}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all text-sm ${
                            approvePaymentMethods.includes(pm.value)
                              ? "bg-orange-50 border-bukizz-orange text-orange-700 ring-1 ring-bukizz-orange/30"
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={approvePaymentMethods.includes(pm.value)}
                            onChange={() => toggleApprovePayment(pm.value)}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              approvePaymentMethods.includes(pm.value)
                                ? "bg-bukizz-orange border-bukizz-orange"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {approvePaymentMethods.includes(pm.value) && (
                              <Check size={10} className="text-white" />
                            )}
                          </div>
                          <CreditCard size={14} />
                          {pm.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-white p-6 pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    onClick={() => { setShowApproveModal(false); setApproveProduct(null); }}
                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <Button
                    onClick={handleConfirmApprove}
                    disabled={isApproving}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isApproving && <Loader2 size={16} className="animate-spin mr-2" />}
                    Confirm Approval
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductListPage;
