import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  X,
  Loader2,
  Trash2,
  Eye,
  ExternalLink,
} from "lucide-react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { DataTable, Pagination, StatusBadge } from "../../components/common";
import { Button, ConfirmationModal, Input, Tooltip } from "../../components/ui";

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
  const [deliveryCharge, setDeliveryCharge] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Handlers
  const handleView = (product) => {
    navigate(`/products/${product.id}`);
  };

  const openApproveModal = (product) => {
    setSelectedProduct(product);
    setDeliveryCharge(""); // Reset
    setIsApproveModalOpen(true);
  };

  const openDeleteModal = (product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleApprove = async () => {
    // Check if deliveryCharge is a valid number (0 is allowed)
    if (deliveryCharge === "" || deliveryCharge === null) {
      return toast.error("Please enter a delivery charge");
    }

    setIsSubmitting(true);
    try {
      const response = await api.patch(
        `/products/${selectedProduct.id}/activate`,
        {
          deliveryCharge: Number(deliveryCharge),
        },
      );

      if (response.data && response.data.success) {
        toast.success(
          response.data.message || "Product activated successfully",
        );
        setIsApproveModalOpen(false);
        setDeliveryCharge(""); // Reset charge
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
          {/* Assuming retailer info might be attached or linked via warehouse in future, for now placeholder or derived */}
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
            pagination={false} // Handle externally
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
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

            <p className="text-sm text-slate-600 mb-4">
              Set the delivery charge to activate{" "}
              <strong>{selectedProduct?.title}</strong>.
            </p>

            <Input
              label="Delivery Charge (₹)"
              type="number"
              placeholder="e.g. 50"
              value={deliveryCharge}
              onChange={(e) => setDeliveryCharge(e.target.value)}
              className="mb-6"
            />

            <div className="flex justify-end gap-3">
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
