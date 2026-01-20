import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Globe,
  MapPin,
  Plus,
  Search,
  BookOpen,
  Shirt,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button, Input, ConfirmationModal } from "../../components/ui";
import { StatusBadge, DataTable } from "../../components/common";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";

const SchoolDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [school, setSchool] = useState(null);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ totalStudents: 0, activeOrders: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("products");
  const [activeFilter, setActiveFilter] = useState("All Items");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteCallback = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/schools/${id}`);
      toast.success("School deleted successfully");
      navigate("/schools");
    } catch (error) {
      console.error("Delete failed", error);
      toast.error("Failed to delete school");
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  useEffect(() => {
    const fetchSchoolData = async () => {
      setIsLoading(true);
      try {
        // Parallel Fetching
        const [schoolRes, productsRes] = await Promise.all([
          api.get(`/schools/${id}`),
          api
            .get(`/schools/${id}/products`)
            .catch(() => ({ data: { data: [] } })), // Mock fallback
          // api.get(`/schools/${id}/stats`), // Uncomment when API exists
        ]);

        if (schoolRes.data.success) {
          setSchool(schoolRes.data.data.school);
        }

        // Mock Products if API fails or is empty for now
        if (productsRes.data?.data) {
          setProducts(productsRes.data.data);
        } else {
          // Fallback Mock Data
          setProducts([
            {
              id: 101,
              name: "Math Textbook Class 10",
              category: "Books",
              price: 450,
              stock: 120,
              image: "",
            },
            {
              id: 102,
              name: "Summer Uniform Shirt",
              category: "Uniforms",
              price: 850,
              stock: 50,
              image: "",
            },
            {
              id: 103,
              name: "Geometry Box Set",
              category: "Stationery",
              price: 150,
              stock: 200,
              image: "",
            },
          ]);
        }

        // Mock Stats
        setStats({ totalStudents: 2450, activeOrders: 124 });
      } catch (error) {
        console.error("Fetch Data Error:", error);
        toast.error("Failed to load school details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchoolData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500">Loading profile...</div>
    );
  }

  if (!school) {
    return (
      <div className="p-8 text-center text-slate-500">School not found</div>
    );
  }

  // Define Columns
  const productColumns = [
    {
      header: "Product",
      accessor: "name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex-shrink-0">
            {row.image && (
              <img
                src={row.image}
                alt={row.name}
                className="w-full h-full object-cover rounded-md"
              />
            )}
          </div>
          <div>
            <div className="font-medium text-slate-900">{row.name}</div>
            <div className="text-xs text-slate-500">{row.category}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Category",
      accessor: "category",
      render: (row) => (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
          {row.category}
        </span>
      ),
    },
    {
      header: "Price",
      accessor: "price",
      render: (row) => <span className="text-slate-700">₹{row.price}</span>,
    },
    {
      header: "Stock Status",
      accessor: "stock",
      render: (row) => (
        <StatusBadge
          status={
            row.stock > 10
              ? "In Stock"
              : row.stock > 0
                ? "Low Stock"
                : "Out of Stock"
          }
          type={
            row.stock > 10 ? "success" : row.stock > 0 ? "warning" : "error"
          }
        />
      ),
    },
  ];

  const productActions = (row) => (
    <div className="flex justify-end gap-2">
      <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded">
        <Pencil size={16} />
      </button>
      <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
        <Trash2 size={16} />
      </button>
    </div>
  );

  return (
    <div className="bg-bukizz-bg min-h-screen pb-12">
      {/* 1. Hero Section */}
      <div className="relative bg-white shadow-sm mb-6">
        {/* Banner */}
        <div className="h-48 md:h-64 bg-slate-200 w-full relative group">
          <img
            src={
              school.image || "https://placehold.co/1200x400?text=School+Banner"
            }
            className="w-full h-full object-cover"
            alt="Banner"
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
        </div>

        {/* Profile Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative pb-4">
          <div className="flex flex-col md:flex-row items-end -mt-12 md:-mt-16 gap-6">
            {/* Logo */}
            <div className="w-32 h-32 bg-white rounded-lg p-1 shadow-md border border-slate-100 flex-shrink-0 relative z-10">
              <img
                src={school.image || "https://placehold.co/200x200?text=Logo"}
                className="w-full h-full object-cover rounded-md"
                alt="Logo"
              />
            </div>

            {/* Info */}
            <div className="flex-1 py-2">
              <h1 className="text-3xl font-bold text-slate-900 mb-1">
                {school.name}
              </h1>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-semibold text-xs border border-orange-200">
                  {school.board}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={14} /> {school.city}, {school.state}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mb-4 md:mb-6 flex gap-3">
              <Button
                variant="danger"
                icon={Trash2}
                onClick={() => setDeleteModalOpen(true)}
              >
                Delete
              </Button>
              <Button
                variant="secondary"
                icon={Edit}
                onClick={() => navigate(`/schools/edit/${id}`)}
              >
                Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteCallback}
        title="Delete School"
        message="Are you sure you want to delete this school? This action cannot be undone and will remove all associated products."
        confirmText={isDeleting ? "Deleting..." : "Delete School"}
        isLoading={isDeleting}
      />

      {/* 2. Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar (Left) */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">
                Contact Details
              </h3>
              <div className="space-y-3 text-sm">
                {school.address && (
                  <div className="flex items-start gap-3 text-slate-600">
                    <div className="p-1.5 bg-slate-100 text-slate-600 rounded mt-0.5">
                      <MapPin size={16} />
                    </div>
                    <span>
                      {school.address.line1}
                      {school.address.line2 && `, ${school.address.line2}`}
                      <br />
                      {school.address.city}, {school.address.state} -{" "}
                      {school.address.postalCode}
                    </span>
                  </div>
                )}
                {school.contact?.email && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
                      <Mail size={16} />
                    </div>
                    <span className="truncate">{school.contact.email}</span>
                  </div>
                )}
                {school.contact?.phone && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="p-1.5 bg-green-50 text-green-600 rounded">
                      <Phone size={16} />
                    </div>
                    <span>{school.contact.phone}</span>
                  </div>
                )}
                {school.contact?.website && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="p-1.5 bg-purple-50 text-purple-600 rounded">
                      <Globe size={16} />
                    </div>
                    <a
                      href={school.contact.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline truncate"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-md text-center">
                  <div className="text-2xl font-bold text-slate-900">
                    {stats.totalStudents}
                  </div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">
                    Students
                  </div>
                </div>
                <div className="bg-orange-50 p-3 rounded-md text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.activeOrders}
                  </div>
                  <div className="text-xs text-orange-600/80 uppercase tracking-wide">
                    Orders
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content (Right) */}
          <div className="md:col-span-3 space-y-6">
            {/* Tabs */}
            <div className="flex border-b border-slate-200 bg-white px-2 rounded-t-lg">
              {["products", "overview", "orders", "students"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors capitalized ${
                    activeTab === tab
                      ? "border-orange-500 text-orange-600"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-b-lg shadow-sm border border-t-0 border-slate-200 min-h-[500px] p-6">
              {activeTab === "products" && (
                <div className="space-y-6">
                  {/* Header & Controls */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">
                        School Essentials
                      </h2>
                      <p className="text-sm text-slate-500">
                        Manage products linked to this school.
                      </p>
                    </div>
                    <Button size="sm" icon={Plus}>
                      Tag New Product
                    </Button>
                  </div>

                  {/* Filters */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {["All Items", "Books", "Uniforms", "Stationery"].map(
                      (filter) => (
                        <button
                          key={filter}
                          onClick={() => setActiveFilter(filter)}
                          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                            activeFilter === filter
                              ? "bg-slate-900 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {filter}
                        </button>
                      ),
                    )}
                  </div>

                  {/* Table */}
                  <DataTable
                    columns={productColumns}
                    data={products}
                    actions={productActions}
                    pagination={true}
                    emptyMessage="No products tagged to this school yet."
                  />
                </div>
              )}

              {activeTab !== "products" && (
                <div className="flex items-center justify-center h-64 text-slate-400 bg-slate-50 rounded border border-dashed border-slate-200">
                  <p>Content for {activeTab} coming soon...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolDetailPage;
