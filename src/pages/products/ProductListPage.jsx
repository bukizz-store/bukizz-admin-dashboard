import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Loader2, Trash2, Edit, LayoutGrid, List } from "lucide-react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import {
  FilterBar,
  DataTable,
  Pagination,
  StatusBadge,
} from "../../components/common";
import { Button, ConfirmationModal, Tooltip } from "../../components/ui";

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
        // Add other filters as needed
        // category: currentCategory || undefined,
        // brand: currentBrand || undefined,
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
  }, [currentPage, currentLimit, currentSearch, currentType, currentIsActive]);

  // 4. Handlers
  const handleFilterChange = (key, value) => {
    setSearchParams((prev) => {
      const ps = new URLSearchParams(prev);
      if (value && value !== "all") ps.set(key, value);
      else ps.delete(key);
      ps.set("page", "1");
      return ps;
    });
  };

  const confirmDelete = (product) => {
    setSelectedProduct(product);
    setDeleteModalOpen(true);
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
                src={row.images[0]}
                alt={row.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-xs text-slate-400 font-medium">No Img</div>
            )}
          </div>
          <div className="min-w-0">
            <div
              className="font-semibold text-slate-900 truncate max-w-50"
              title={row.title}
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
      header: "Stock",
      accessor: "isActive",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${row.isActive ? "bg-green-500" : "bg-red-500"}`}
          />
          <span className="text-sm text-slate-600 hidden lg:inline">
            {row.isActive ? "Active" : "Inactive"}
          </span>
        </div>
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
        <div className="flex items-center justify-end gap-2">
          <Tooltip content="Edit Product">
            <button
              onClick={() => navigate(`/products/edit/${row.id}`)}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              <Edit size={18} />
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
          <DataTable columns={columns} data={products} pagination={false} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group"
              >
                <div className="aspect-4/3 bg-slate-100 relative overflow-hidden">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
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
                    <div className="flex gap-1">
                      <button
                        onClick={() => navigate(`/products/edit/${product.id}`)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      >
                        <Edit size={16} />
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
    </div>
  );
};

export default ProductListPage;
