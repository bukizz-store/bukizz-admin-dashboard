import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Package,
  Layers,
  ShoppingBag,
  Plus,
  Loader2,
} from "lucide-react";
import api from "../../services/api";
import { Button } from "../../components/ui";
import { StatusBadge, DataTable } from "../../components/common";
import { useToast } from "../../context/ToastContext";

const CategoryDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [category, setCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("products"); // 'products' or 'subcategories'

  useEffect(() => {
    const fetchCategory = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/categories/${id}`);
        // Adjust based on your actual API response structure
        // Assuming response.data is the category object or response.data.data
        console.log(response.data);
        setCategory(response.data.data?.category || response.data);
      } catch (error) {
        console.error("Failed to fetch category details:", error);
        toast.error("Failed to load category details");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchCategory();
    }
  }, [id, toast]);

  const handleDelete = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this category? This action cannot be undone.",
      )
    ) {
      try {
        await api.delete(`/categories/${id}`);
        toast.success("Category deleted successfully");
        navigate("/categories");
      } catch (error) {
        console.error("Delete failed:", error);
        toast.error("Failed to delete category");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f1f5f9]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f1f5f9] text-slate-500">
        <p>Category not found.</p>
        <Button
          variant="ghost"
          onClick={() => navigate("/categories")}
          className="mt-4"
        >
          Back to Categories
        </Button>
      </div>
    );
  }

  // Helper for placeholders
  const getPlaceholderImage = (name) =>
    `https://source.unsplash.com/random/400x400?${encodeURIComponent(
      name || "category",
    )}`;

  // Sub-Categories Table Columns
  const subCategoryColumns = [
    {
      header: "Image",
      accessor: "image",
      render: (row) => (
        <img
          src={row.image || getPlaceholderImage(row.name)}
          alt={row.name}
          className="w-10 h-10 rounded-md object-cover border border-slate-100 bg-slate-50"
          onError={(e) => {
            e.target.src = "https://placehold.co/200x200?text=No+Img";
          }}
        />
      ),
    },
    {
      header: "Name / ID",
      accessor: "name",
      render: (row) => (
        <div>
          <div className="font-bold text-slate-800">{row.name}</div>
          <div className="text-xs text-slate-400" title={row.id}>
            #{row.id?.substring(0, 8)}...
          </div>
        </div>
      ),
    },
    {
      header: "Description",
      accessor: "description",
      render: (row) => (
        <span
          className="text-slate-500 truncate max-w-48 block text-sm"
          title={row.description}
        >
          {row.description ? (
            row.description.length > 60 ? (
              `${row.description.substring(0, 60)}...`
            ) : (
              row.description
            )
          ) : (
            <span className="italic text-slate-300">No description</span>
          )}
        </span>
      ),
    },
    {
      header: "Subcategories",
      accessor: "children",
      render: (row) =>
        row.children && row.children.length > 0 ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600">
            {row.children.length} Subcategories
          </span>
        ) : (
          <span className="text-slate-400 text-xs">-</span>
        ),
    },
    {
      header: "Status",
      accessor: "isActive",
      render: (row) => (
        <StatusBadge
          status={row.isActive ? "Active" : "Inactive"}
          type={row.isActive ? "success" : "neutral"}
        />
      ),
    },
  ];

  const subCategoryActions = (row) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/categories/edit/${row.id}`);
      }}
      className="p-2 text-slate-400 hover:text-bukizz-orange hover:bg-orange-50 rounded-full transition-colors"
    >
      <Edit2 size={16} />
    </button>
  );

  // Dummy Product Columns
  const productColumns = [
    {
      header: "Image",
      accessor: "image",
      render: (row) => (
        <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200" />
      ),
    },
    {
      header: "Product Name",
      accessor: "name",
      render: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      header: "Price",
      accessor: "price",
      render: (row) => <span>₹{row.price}</span>,
    },
    {
      header: "Stock",
      accessor: "stock",
      render: (row) => (
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            row.stock > 0
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {row.stock > 0 ? "In Stock" : "Out of Stock"}
        </span>
      ),
    },
  ];

  // Dummy Products Data
  const dummyProducts = [
    { id: 1, name: "Sample Product A", price: 499, stock: 120 },
    { id: 2, name: "Sample Product B", price: 899, stock: 0 },
    { id: 3, name: "Sample Product C", price: 1299, stock: 45 },
  ];

  return (
    <div className="p-6 bg-[#f1f5f9] min-h-screen">
      {/* Breadcrumbs & Header Actions */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            to="/categories"
            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-2 transition-colors"
          >
            <ArrowLeft size={14} className="mr-1" />
            Back to Categories
          </Link>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>Categories</span> /{" "}
            <span className="text-slate-600 font-medium">{category.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={handleDelete}
            className="text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={16} className="mr-2" />
            Delete
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(`/categories/edit/${id}`)}
          >
            <Edit2 size={16} className="mr-2" />
            Edit Category
          </Button>
        </div>
      </div>

      {/* Top Section: Overview Card */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: Image */}
          <div className="col-span-1">
            <div className="aspect-square md:aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
              <img
                src={category.image || getPlaceholderImage(category.name)}
                alt={category.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "https://placehold.co/400x400?text=No+Img";
                }}
              />
            </div>
          </div>

          {/* Right: Info & Stats */}
          <div className="col-span-1 md:col-span-2 flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  {category.name}
                </h1>
                <StatusBadge
                  status={category.isActive ? "Active" : "Inactive"}
                  type={category.isActive ? "success" : "neutral"}
                />
              </div>
            </div>

            <p className="text-slate-600 mb-8 flex-1">
              {category.description || (
                <span className="italic text-slate-400">
                  No description provided for this category.
                </span>
              )}
            </p>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <ShoppingBag size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Total Revenue
                  </span>
                </div>
                <div className="text-xl font-bold text-slate-700">₹0</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Package size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Products
                  </span>
                </div>
                <div className="text-xl font-bold text-slate-700">0</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Layers size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Sub-Categories
                  </span>
                </div>
                <div className="text-xl font-bold text-slate-700">
                  {category.children?.length || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Tabs Area */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-slate-200 pb-1">
          {/* Tabs */}
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("products")}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === "products"
                  ? "text-orange-500"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Products
              {activeTab === "products" && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("subcategories")}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === "subcategories"
                  ? "text-orange-500"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Sub-Categories
              {activeTab === "subcategories" && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500 rounded-t-full" />
              )}
            </button>
          </div>

          {/* Tab Actions */}
          <div>
            {activeTab === "products" ? (
              <Button size="sm" disabled>
                <Plus size={16} className="mr-2" /> Add Product
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => navigate(`/categories/create?parentId=${id}`)}
              >
                <Plus size={16} className="mr-2" /> Add Sub Category
              </Button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm min-h-[300px]">
          {activeTab === "products" ? (
            <DataTable
              columns={productColumns}
              data={dummyProducts} // Use dummy data for now
              pagination={false}
            />
          ) : (
            <DataTable
              columns={subCategoryColumns}
              data={category.children || []}
              actions={subCategoryActions}
              onRowClick={(row) => navigate(`/categories/${row.id}`)}
              pagination={false}
              emptyMessage="No sub-categories found."
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryDetailPage;
