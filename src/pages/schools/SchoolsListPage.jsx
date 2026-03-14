import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Plus,
  Loader2,
  MapPin,
  Mail,
  Phone,
  Eye,
  Pencil,
  Trash2,
  ListOrdered,
} from "lucide-react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import {
  FilterBar,
  DataTable,
  DataGrid,
  Pagination,
} from "../../components/common";
import { Button, ConfirmationModal, Tooltip } from "../../components/ui";

const SchoolsListPage = () => {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // 1. Derived State from URL
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const currentLimit = parseInt(searchParams.get("limit") || "12", 10);
  const currentSearch = searchParams.get("search") || "";
  const currentView = searchParams.get("view") || "grid";
  const currentBoard = searchParams.get("board") || "";
  const currentCity = searchParams.get("city") || "";

  // 2. Local State
  const [schools, setSchools] = useState([]);
  const [paginationMetadata, setPaginationMetadata] = useState({
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Local search input
  const [searchTerm, setSearchTerm] = useState(currentSearch);

  // Sync local search
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
            newParams.set("page", "1");
          }
          return newParams;
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, currentSearch, setSearchParams]);

  // 3. API Fetch
  useEffect(() => {
    const fetchSchools = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = {
          page: currentPage,
          limit: currentLimit,
          search: currentSearch,
          board: currentBoard || "",
          city: currentCity || "",
        };

        if (currentBoard === "" || currentBoard === null) {
          delete params.board;
        }
        if (currentCity === "" || currentCity === null) {
          delete params.city;
        }
        if (currentSearch === "" || currentSearch === null) {
          delete params.search;
        }

        const response = await api.get("/schools", { params });

        if (response.data?.success) {
          setSchools(response.data.data.schools);
          console.log(response.data.data.schools);
          setPaginationMetadata({
            total: response.data.data.pagination.total,
            totalPages: response.data.data.pagination.totalPages,
          });
        }
      } catch (err) {
        console.error("Fetch Schools Error:", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchools();
  }, [
    currentPage,
    currentLimit,
    currentSearch,
    currentBoard,
    currentCity,
    refreshKey,
  ]);

  // 4. Handlers
  const handlePageChange = (newPage) => {
    setSearchParams((prev) => {
      const ps = new URLSearchParams(prev);
      ps.set("page", newPage.toString());
      return ps;
    });
  };

  const handleItemsPerPageChange = (newLimit) => {
    setSearchParams((prev) => {
      const ps = new URLSearchParams(prev);
      ps.set("limit", newLimit.toString());
      ps.set("page", "1");
      return ps;
    });
  };

  const handleViewChange = (mode) => {
    setSearchParams((prev) => {
      const ps = new URLSearchParams(prev);
      ps.set("view", mode);
      return ps;
    });
  };

  const handleFilterChange = (key, value) => {
    setSearchParams((prev) => {
      const ps = new URLSearchParams(prev);
      if (value) ps.set(key, value);
      else ps.delete(key);
      ps.set("page", "1");
      return ps;
    });
  };

  // 5. Handlers (Delete)
  const confirmDelete = (id) => {
    setSchoolToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!schoolToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/schools/${schoolToDelete}`);
      toast.success("School deleted successfully");
      setRefreshKey((prev) => prev + 1);
      setDeleteModalOpen(false);
    } catch (error) {
      console.error("Delete failed", error);
      toast.error("Failed to delete school");
    } finally {
      setIsDeleting(false);
      setSchoolToDelete(null);
    }
  };

  // 6. Renderers

  // List View Columns
  const columns = [
    {
      header: "Identity",
      accessor: "identity",
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={
              row.image && row.image.trim() !== ""
                ? row.image
                : "https://placehold.co/100x100?text=School"
            }
            alt={row.name}
            className="w-10 h-10 rounded-md object-cover border border-slate-200"
            onError={(e) => {
              e.target.src = "https://placehold.co/100x100?text=School";
            }}
          />
          <div>
            <div className="font-bold text-slate-900">{row.name}</div>
            <div className="text-xs text-slate-500">#{row.id}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Location",
      accessor: "location",
      render: (row) => (
        <div className="text-sm text-slate-600">
          <div>{row.city}</div>
          <div className="text-xs text-slate-400">{row.state}</div>
        </div>
      ),
    },
    {
      header: "Board",
      accessor: "board",
      render: (row) => {
        const colors = {
          CBSE: "bg-blue-100 text-blue-700",
          ICSE: "bg-purple-100 text-purple-700",
          IB: "bg-yellow-100 text-yellow-700",
        };
        const colorClass = colors[row.board] || "bg-slate-100 text-slate-600";
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${colorClass}`}
          >
            {row.board}
          </span>
        );
      },
    },
    {
      header: "Contact",
      accessor: "contact",
      render: (row) => (
        <div className="flex gap-2 text-slate-400">
          {row.contact?.email && (
            <Tooltip content={row.contact.email}>
              <a
                href={`mailto:${row.contact.email}`}
                className="group relative block p-1 hover:bg-slate-100 rounded-full transition-colors"
              >
                <Mail
                  size={16}
                  className="cursor-pointer hover:text-slate-600"
                />
              </a>
            </Tooltip>
          )}
          {row.contact?.phone && (
            <Tooltip content={row.contact.phone}>
              <a
                href={`tel:${row.contact.phone}`}
                className="group relative block p-1 hover:bg-slate-100 rounded-full transition-colors"
              >
                <Phone
                  size={16}
                  className="cursor-pointer hover:text-slate-600"
                />
              </a>
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  const actions = (row) => (
    <div className="flex items-center gap-2 justify-end">
      <Tooltip content="View Profile">
        <button
          onClick={() => navigate(`/schools/${row.id}`)}
          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
        >
          <Eye size={16} />
        </button>
      </Tooltip>
      <Tooltip content="Edit School">
        <button
          onClick={() => navigate(`/schools/edit/${row.id}`)}
          className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-colors"
        >
          <Pencil size={16} />
        </button>
      </Tooltip>
      <Tooltip content="Delete School">
        <button
          onClick={() => confirmDelete(row.id)}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </Tooltip>
    </div>
  );

  // Grid View Renderer (Card)
  const renderGridItem = (item) => (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden relative border border-slate-100 flex flex-col h-full hover:shadow-md transition-shadow">
      {/* Cover Image */}
      <div className="h-40 bg-slate-100 relative">
        <img
          src={
            item.image && item.image.trim() !== ""
              ? item.image
              : "https://placehold.co/800x400?text=No+Image"
          }
          alt={item.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = "https://placehold.co/800x400?text=No+Image";
          }}
        />
        <div className="absolute top-2 right-2">
          <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold shadow-sm">
            {item.board}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3
          className="font-bold text-slate-900 text-lg mb-1 line-clamp-1"
          title={item.name}
        >
          {item.name}
        </h3>
        <div className="flex items-center text-slate-500 text-sm mb-4">
          <MapPin size={14} className="mr-1" />
          {item.city}, {item.state}
        </div>

        <div className="mt-auto space-y-2">
          {item.contact.email && (
            <div className="flex items-center text-xs text-slate-500">
              <Mail size={12} className="mr-2" />
              <span className="truncate">{item.contact.email}</span>
            </div>
          )}
          {item.contact.phone && (
            <div className="flex items-center text-xs text-slate-500">
              <Phone size={12} className="mr-2" />
              <span>{item.contact.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="grid grid-cols-2 border-t border-slate-100 divide-x divide-slate-100">
        <button
          onClick={() => navigate(`/schools/edit/${item.id}`)}
          className="py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Edit
        </button>
        <button
          className="py-2.5 text-sm font-medium text-bukizz-orange hover:bg-orange-50 transition-colors"
          onClick={() => navigate(`/schools/${item.id}`)}
        >
          View Profile
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-bukizz-bg min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-bukizz-navy">
            Partner Schools
          </h1>
          <p className="text-sm text-slate-500">
            Manage your network of schools and their product catalogs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            icon={ListOrdered}
            onClick={() => navigate(`/schools/sort?city=${currentCity || "gurugram"}`)}
          >
            Manage Sort Order
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => navigate("/schools/create")}
          >
            Onboard School
          </Button>
        </div>
      </div>

      {/* Controls */}
      <FilterBar
        searchTerm={searchTerm}
        onSearch={(val) => setSearchTerm(val)}
        filterConfig={[
          {
            label: "Board",
            options: ["CBSE", "ICSE", "State Board", "IB", "IGCSE", "Other"],
            value: currentBoard,
            onChange: (val) => handleFilterChange("board", val),
          },
          {
            label: "City",
            options: ["gurugram", "kanpur"],
            value: currentCity,
            onChange: (val) => handleFilterChange("city", val),
          },
        ]}
        view={currentView}
        onViewChange={handleViewChange}
        searchPlaceholder="Search by Name, ID, or Pincode..."
      />

      {/* Content */}
      <div className="min-h-96">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-slate-400">
            <Loader2 className="animate-spin w-8 h-8 text-bukizz-orange" />
            <span className="ml-3 font-medium">Loading schools...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 text-red-500">
            Error: {error}
          </div>
        ) : schools.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-slate-400 bg-white rounded-lg border border-slate-100 border-dashed">
            <p>No schools found.</p>
          </div>
        ) : currentView === "list" ? (
          <DataTable columns={columns} data={schools} actions={actions} />
        ) : (
          <DataGrid data={schools} renderItem={renderGridItem} />
        )}
      </div>

      {/* Pagination */}
      {!isLoading && !error && schools.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={paginationMetadata.totalPages}
          itemsPerPage={currentLimit}
          totalItems={paginationMetadata.total}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete School"
        message="Are you sure you want to delete this school? This action cannot be undone and will remove all associated products."
        confirmText={isDeleting ? "Deleting..." : "Delete School"}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default SchoolsListPage;
