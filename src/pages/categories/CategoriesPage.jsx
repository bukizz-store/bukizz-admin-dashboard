import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Pencil, Plus, Loader2 } from "lucide-react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import {
  FilterBar,
  DataTable,
  DataGrid,
  StatusBadge,
  Pagination,
} from "../../components/common";
import { Button } from "../../components/ui";

const CategoriesPage = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // 1. Derived State from URL
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const currentLimit = parseInt(searchParams.get("limit") || "20", 10);
  const currentSearch = searchParams.get("search") || "";
  const currentView = searchParams.get("view") || "grid";
  const currentSortBy = searchParams.get("sortBy") || "name";
  const currentSortOrder = searchParams.get("sortOrder") || "asc";
  const isActiveParam = searchParams.get("isActive");
  const currentStatus =
    isActiveParam === "true"
      ? "Active"
      : isActiveParam === "false"
        ? "Inactive"
        : "";

  // 2. Local State for UI/Data
  const [categories, setCategories] = useState([]);
  const [paginationMetadata, setPaginationMetadata] = useState({
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Local search input state for smooth typing
  const [searchTerm, setSearchTerm] = useState(currentSearch);

  // Sync local search input if URL changes externally
  useEffect(() => {
    setSearchTerm(currentSearch);
  }, [currentSearch]);

  // 3. Debounce Search Update
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only update if value matches local state but differs from URL
      if (searchTerm !== currentSearch) {
        setSearchParams((prev) => {
          const newParams = new URLSearchParams(prev);
          if (searchTerm) {
            newParams.set("search", searchTerm);
            newParams.set("page", "1"); // Reset to page 1
          } else {
            newParams.delete("search");
            // Optional: reset page to 1 when clearing search? Usually yes.
            newParams.set("page", "1");
          }
          return newParams;
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, currentSearch, setSearchParams]);

  // 4. API Fetch Effect
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = {
          page: currentPage,
          limit: currentLimit,
          search: currentSearch,
          sortBy: currentSortBy,
          sortOrder: currentSortOrder,
          rootOnly: true,
          ...(isActiveParam !== null && {
            isActive: isActiveParam === "true",
          }),
        };

        const response = await api.get("/categories", { params });

        // Expected Response: { success: true, data: { categories: [], pagination: { total, totalPages, ... } } }
        if (response.data?.success) {
          setCategories(response.data.data.categories);
          setPaginationMetadata({
            total: response.data.data.pagination.total,
            totalPages: response.data.data.pagination.totalPages,
          });
        } else {
          throw new Error(
            response.data?.message || "Failed to fetch categories",
          );
        }
      } catch (err) {
        console.error("Fetch Categories Error:", err);
        setError(err.message);
        toast.error(err.message || "Failed to load categories");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [
    currentPage,
    currentLimit,
    currentSearch,
    currentSortBy,
    currentSortOrder,
    isActiveParam,
    refreshKey,
    toast,
  ]);

  // 5. Handlers
  const handlePageChange = (newPage) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("page", newPage.toString());
      return newParams;
    });
  };

  const handleViewChange = (mode) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("view", mode);
      return newParams;
    });
  };

  const handleItemsPerPageChange = (newLimit) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("limit", newLimit.toString());
      newParams.set("page", "1"); // Reset to page 1 when limit changes
      return newParams;
    });
  };

  const handleStatusChange = (status) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (status === "Active") {
        newParams.set("isActive", "true");
      } else if (status === "Inactive") {
        newParams.set("isActive", "false");
      } else {
        newParams.delete("isActive");
      }
      newParams.set("page", "1"); // Reset to page 1 on filter change
      return newParams;
    });
  };

  // Helper for placeholder images
  const getPlaceholderImage = (name) =>
    `https://source.unsplash.com/random/200x200?${encodeURIComponent(
      name || "category",
    )}`;

  // 6. Columns
  const columns = [
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

  // Grid Item Renderer
  const renderGridItem = (item) => (
    <div
      onClick={() => navigate(`/categories/${item.id}`)}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 border border-slate-100 flex flex-col h-full group cursor-pointer"
    >
      <div className="relative aspect-video rounded-md overflow-hidden mb-3 bg-slate-100">
        <img
          src={item.image || getPlaceholderImage(item.name)}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.target.src = "https://placehold.co/400x300?text=No+Img";
          }}
        />
        <div className="absolute top-2 right-2">
          <StatusBadge
            status={item.isActive ? "Active" : "Inactive"}
            type={item.isActive ? "success" : "neutral"}
            className="shadow-sm backdrop-blur-sm bg-white/90"
          />
        </div>
      </div>

      <div className="flex items-start justify-between mb-2">
        <div>
          <h3
            className="font-bold text-slate-800 line-clamp-1"
            title={item.name}
          >
            {item.name}
          </h3>
          <p className="text-xs text-slate-400">#{item.id?.substring(0, 8)}</p>
        </div>
      </div>

      <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1 h-8">
        {item.description || "No description available."}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        <span className="text-xs font-medium text-slate-500">
          {item.children?.length || 0} Subcategories
        </span>
        <Button
          variant="secondary"
          size="sm"
          icon={Pencil}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/categories/edit/${item.id}`);
          }}
        >
          Edit
        </Button>
      </div>
    </div>
  );

  const actions = (row) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/categories/edit/${row.id}`);
      }}
      className="p-2 text-slate-400 hover:text-bukizz-orange hover:bg-orange-50 rounded-full transition-colors"
    >
      <Pencil size={16} />
    </button>
  );

  return (
    <div className="p-6 bg-bukizz-bg min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-bukizz-navy">
            All Categories
          </h1>
          <p className="text-sm text-slate-500">
            Manage your product categories and catalogs
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => navigate("/categories/create")}
        >
          Add Category
        </Button>
      </div>

      {/* Controls */}
      <FilterBar
        searchTerm={searchTerm}
        onSearch={(val) => setSearchTerm(val)} // Update local state directly
        filterConfig={[
          {
            label: "Status",
            options: ["Active", "Inactive"],
            value: currentStatus,
            onChange: handleStatusChange,
          },
        ]}
        view={currentView}
        onViewChange={handleViewChange}
      />

      {/* Content */}
      <div className="min-h-96">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-slate-400">
            <Loader2 className="animate-spin w-8 h-8 text-bukizz-orange" />
            <span className="ml-3 font-medium">Loading categories...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-red-500 bg-white rounded-lg border border-red-100">
            <p className="font-medium mb-2">Error loading data</p>
            <p className="text-sm text-slate-500">{error}</p>
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="mt-4 text-bukizz-orange hover:underline text-sm"
            >
              Try Again
            </button>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-lg border border-slate-100 border-dashed">
            <p>No categories found.</p>
          </div>
        ) : currentView === "list" ? (
          <DataTable
            columns={columns}
            data={categories}
            actions={actions}
            onRowClick={(row) => navigate(`/categories/${row.id}`)}
          />
        ) : (
          <DataGrid data={categories} renderItem={renderGridItem} />
        )}
      </div>

      {/* Footer */}
      {!isLoading && !error && categories.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={paginationMetadata.totalPages}
          itemsPerPage={currentLimit}
          totalItems={paginationMetadata.total}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}
    </div>
  );
};

export default CategoriesPage;
