import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  Check,
  X,
  Loader2,
  Trash2,
  Eye,
  CreditCard,
  Percent,
} from "lucide-react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { DataTable, Pagination, StatusBadge } from "../../components/common";
import { Button, ConfirmationModal, Input, Tooltip } from "../../components/ui";
import { PAYMENT_METHODS } from "../../data/paymentMethods";

const ProductApprovalsPage = () => {
  const toast = useToast();
  const navigate = useNavigate();

  // Data State
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Action States
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Approve Modal Fields
  const [approveLoading, setApproveLoading] = useState(false);
  const [deliveryCharge, setDeliveryCharge] = useState("");
  const [variantCommissions, setVariantCommissions] = useState([]);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState(
    PAYMENT_METHODS.map((pm) => pm.value)
  );

  // Fetch Products
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/products", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          isActive: false, // Fetch only inactive products
        },
      });

      if (response.data?.success) {
        setProducts(response.data.data.products);
        setTotalItems(response.data.data.pagination.total);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to load pending approvals");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage, itemsPerPage]);

  // Helpers
  const getVariantDisplayName = (variant) => {
    const parts = [];
    if (variant.option_value_1_ref?.value) parts.push(variant.option_value_1_ref.value);
    if (variant.option_value_2_ref?.value) parts.push(variant.option_value_2_ref.value);
    if (variant.option_value_3_ref?.value) parts.push(variant.option_value_3_ref.value);
    return parts.length > 0 ? parts.join(" / ") : variant.sku || "Default Variant";
  };

  // Handlers
  const handleView = (product) => {
    navigate(`/products/${product.id}`);
  };

  const openApproveModal = async (product) => {
    setDeliveryCharge("");
    setSelectedPaymentMethods(PAYMENT_METHODS.map((pm) => pm.value));
    setVariantCommissions([]);
    setIsApproveModalOpen(true);
    setApproveLoading(true);

    try {
      const response = await api.get(`/products/${product.id}`);
      if (response.data?.success) {
        const data = response.data.data.product;
        setSelectedProduct(data);

        // Initialize variant commissions
        const existingCommissions = data.variantCommissions || [];
        setVariantCommissions(
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

        // Initialize payment methods
        if (data.paymentMethods && data.paymentMethods.length > 0) {
          setSelectedPaymentMethods(data.paymentMethods);
        }
      }
    } catch (error) {
      console.error("Failed to fetch product details:", error);
      toast.error("Failed to load product details");
      setIsApproveModalOpen(false);
    } finally {
      setApproveLoading(false);
    }
  };

  const openDeleteModal = (product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleApprove = async () => {
    if (deliveryCharge === "" || deliveryCharge === null) {
      return toast.error("Please enter a delivery charge");
    }

    const hasEmpty = variantCommissions.some(
      (vc) => vc.commissionValue === "" || vc.commissionValue === undefined
    );
    if (hasEmpty) {
      return toast.error("Please set commission for all variants");
    }

    if (selectedPaymentMethods.length === 0) {
      return toast.error("Please select at least one payment method");
    }

    setIsSubmitting(true);
    try {
      const response = await api.patch(
        `/products/${selectedProduct.id}/activate`,
        {
          deliveryCharge: Number(deliveryCharge),
          variantCommissions: variantCommissions.map((vc) => ({
            variantId: vc.variantId,
            commissionType: vc.commissionType,
            commissionValue: Number(vc.commissionValue),
          })),
          paymentMethods: selectedPaymentMethods,
        },
      );

      if (response.data && response.data.success) {
        toast.success(
          response.data.message || "Product activated successfully",
        );
        setIsApproveModalOpen(false);
        setDeliveryCharge("");
        fetchProducts(); // Refresh list
      } else {
        toast.error(response.data?.message || "Failed to activate product");
      }
    } catch (error) {
      console.error("Failed to approve product:", error);
      toast.error(error.response?.data?.message || "Failed to approve product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      await api.delete(`/products/${selectedProduct.id}`);
      toast.success("Product rejected and deleted");
      setIsDeleteModalOpen(false);
      fetchProducts(); // Refresh list
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast.error("Failed to reject product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateCommission = (index, field, value) => {
    setVariantCommissions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const togglePaymentMethod = (method) => {
    setSelectedPaymentMethods((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method]
    );
  };

  // Columns definition
  const columns = [
    {
      header: "Product",
      accessor: "title",
      render: (row) => (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
            {row.images && row.images.length > 0 ? (
              <img
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
              onClick={() => handleView(row)}
            >
              {row.title}
            </div>
            {row.sku && (
              <div className="text-xs text-slate-500">SKU: {row.sku}</div>
            )}
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
        <div className="font-bold text-slate-900">
          ₹{row.basePrice?.toLocaleString()}
        </div>
      ),
    },
    {
      header: "Retailer",
      accessor: "retailer",
      render: (row) => (
        <div className="text-sm text-slate-700">
          {row.products_warehouse?.warehouse?.retailer?.full_name || "N/A"}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          {/* View */}
          <Tooltip content="View Product">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleView(row);
              }}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              <Eye size={18} />
            </button>
          </Tooltip>

          {/* Approve */}
          <Tooltip content="Approve Product">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openApproveModal(row);
              }}
              className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
            >
              <CheckCircle size={18} />
            </button>
          </Tooltip>

          {/* Reject/Delete */}
          <Tooltip content="Reject (Delete)">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openDeleteModal(row);
              }}
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Product Approvals</h1>
        <p className="text-sm text-slate-500">
          Review and approve pending product submissions.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-slate-400">
            <Loader2 className="animate-spin w-8 h-8 text-bukizz-orange mb-2" />
          </div>
        ) : products.length > 0 ? (
          <DataTable
            columns={columns}
            data={products}
            pagination={false}
            onRowClick={handleView}
          />
        ) : (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <CheckCircle className="w-12 h-12 mb-4 text-green-500" />
            <h3 className="text-lg font-medium text-slate-900">
              All Caught Up!
            </h3>
            <p>No pending products to review.</p>
          </div>
        )}
      </div>

      {!isLoading && products.length > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalItems / itemsPerPage)}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
      )}

      {/* Approve Modal */}
      {isApproveModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 pb-4 border-b border-slate-100 z-10">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">
                  Approve Product
                </h3>
                <button
                  onClick={() => setIsApproveModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>
              {selectedProduct && (
                <p className="text-sm text-slate-500 mt-1 truncate">
                  {selectedProduct.title}
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
                    value={deliveryCharge}
                    onChange={(e) => setDeliveryCharge(e.target.value)}
                  />

                  {/* Variant Commissions */}
                  {variantCommissions.length > 0 && (
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
                            {variantCommissions.map((vc, idx) => (
                              <tr key={vc.variantId} className="hover:bg-slate-50/50">
                                <td className="py-2 px-3 text-slate-800 font-medium text-xs">
                                  {vc.variantName}
                                </td>
                                <td className="py-2 px-3">
                                  <select
                                    value={vc.commissionType}
                                    onChange={(e) =>
                                      updateCommission(idx, "commissionType", e.target.value)
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
                                        updateCommission(idx, "commissionValue", e.target.value)
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
                  )}

                  {/* Payment Methods */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-700">
                      Allowed Payment Methods
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {PAYMENT_METHODS.map((pm) => (
                        <label
                          key={pm.value}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all text-sm ${
                            selectedPaymentMethods.includes(pm.value)
                              ? "bg-orange-50 border-bukizz-orange text-orange-700 ring-1 ring-bukizz-orange/30"
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedPaymentMethods.includes(pm.value)}
                            onChange={() => togglePaymentMethod(pm.value)}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              selectedPaymentMethods.includes(pm.value)
                                ? "bg-bukizz-orange border-bukizz-orange"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {selectedPaymentMethods.includes(pm.value) && (
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
                    onClick={() => setIsApproveModalOpen(false)}
                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <Button
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isSubmitting && (
                      <Loader2 size={16} className="animate-spin mr-2" />
                    )}
                    Confirm Approval
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete/Reject Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleReject}
        title="Reject Product"
        message={`Are you sure you want to reject and delete "${selectedProduct?.title}"? This action cannot be undone.`}
        confirmText={isSubmitting ? "Rejecting..." : "Reject & Delete"}
        cancelText="Cancel"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default ProductApprovalsPage;

