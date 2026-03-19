import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Plus,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit2,
  Trash2,
  Package,
  ShoppingBag,
  Pencil,
  X,
} from "lucide-react";
import { Button, Input, ConfirmationModal, Tooltip } from "../../components/ui";
import { StatusBadge, DataTable } from "../../components/common";
import AddWarehouseModal from "../../components/retailers/AddWarehouseModal";
import RetailerSettlementsTab from "../../components/retailers/settlements/RetailerSettlementsTab";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";

const RetailerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [retailer, setRetailer] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});

  // Product Tabs State
  const [activeTab, setActiveTab] = useState("warehouses"); // 'warehouses', 'general-products', 'school-products'
  const [products, setProducts] = useState([]);
  const [isProductsLoading, setIsProductsLoading] = useState(false);

  // Product Deletion State
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteProductModalOpen, setDeleteProductModalOpen] = useState(false);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // Email Edit State
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch Retailer Profile
        const retailerRes = await api.get(`/users/admin/${id}`);
        console.log("Retailer Data:", retailerRes.data.data.user);
        setRetailer(retailerRes.data.data.user);

        // Fetch Warehouses
        const warehousesRes = await api.get(`/warehouses/retailer/${id}`);
        console.log("Warehouses Data:", warehousesRes.data.data.warehouses);
        setWarehouses(warehousesRes.data.data.warehouses);

        // Fetch All Products for Retailer (for client-side filtering)
        const productsRes = await api.get("/products/retailer-search", {
          params: {
            retailerId: id,
            limit: 10,
            page: 1,
          },
        });
        if (productsRes.data.success) {
          setProducts(productsRes.data.data.products);
        }
      } catch (error) {
        console.error("Failed to load details:", error);
        toast.error("Failed to load details");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const toggleRow = (rowId) => {
    setExpandedRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeletingProduct(true);
    try {
      await api.delete(`/products/${productToDelete.id}`);
      toast.success("Product deleted successfully");
      // Remove from local state
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
    } catch (error) {
      console.error("Failed to delete product", error);
      toast.error("Failed to delete product");
    } finally {
      setIsDeletingProduct(false);
      setDeleteProductModalOpen(false);
      setProductToDelete(null);
    }
  };

  const handleUpdateEmail = async () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) {
      setEmailError("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    if (trimmed === retailer.email?.toLowerCase()) {
      setEmailError("New email is the same as the current email");
      return;
    }

    setIsUpdatingEmail(true);
    setEmailError("");
    try {
      const res = await api.put(`/users/admin/${id}`, { email: trimmed });
      setRetailer((prev) => ({
        ...prev,
        email: trimmed,
        email_verified: false,
      }));
      toast.success("Email updated successfully. Retailer will need to log in again.");
      setEmailModalOpen(false);
      setNewEmail("");
    } catch (error) {
      const msg =
        error.response?.data?.message || "Failed to update email";
      setEmailError(msg);
      toast.error(msg);
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  // Define Columns
  const warehouseColumns = [
    {
      header: "",
      accessor: "expand",
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleRow(row.id);
          }}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          {expandedRows[row.id] ? (
            <ChevronUp size={20} />
          ) : (
            <ChevronDown size={20} />
          )}
        </button>
      ),
    },
    {
      header: "Warehouse Name",
      accessor: "name",
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/warehouse/${row.id}`);
          }}
          className="font-medium text-slate-800 hover:text-bukizz-orange hover:underline text-left"
        >
          {row.name}
        </button>
      ),
    },
    {
      header: "Contact",
      accessor: "contact",
      render: (row) => (
        <div className="text-sm">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Mail size={14} className="text-slate-400" />{" "}
            {row.contactEmail || row.contact_email}
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 mt-1">
            <Phone size={14} className="text-slate-400" />{" "}
            {row.contactPhone || row.contact_phone}
          </div>
        </div>
      ),
    },
    {
      header: "Verified",
      accessor: "is_verified",
      render: (row) =>
        row.isVerified || row.is_verified ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
            <CheckCircle size={12} /> Verified
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
            Pending
          </span>
        ),
    },
  ];

  const productColumns = [
    {
      header: "Image",
      accessor: "image",
      render: (row) => (
        <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 overflow-hidden">
          {row.images && row.images.length > 0 ? (
            <img
              src={
                (row.images.find((img) => img.isPrimary) || row.images[0]).url
              }
              alt={row.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-xs text-center pt-3 text-slate-400">
              No Img
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Product Name",
      accessor: "title",
      render: (row) => (
        <div>
          <div className="font-medium">{row.title}</div>
          <div className="text-xs text-slate-400 uppercase">
            {row.productType}
          </div>
        </div>
      ),
    },
    {
      header: "Price",
      accessor: "basePrice",
      render: (row) => <span>₹{row.basePrice}</span>,
    },
    {
      header: "Stock",
      accessor: "totalStock",
      render: (row) => {
        // Calculate total stock if variants exist
        const stock =
          row.variants?.reduce((acc, curr) => acc + (curr.stock || 0), 0) || 0;
        return (
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              stock > 0
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {stock > 0 ? `${stock} In Stock` : "Out of Stock"}
          </span>
        );
      },
    },
    {
      header: <div className="text-right">Actions</div>,
      accessor: "actions",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Tooltip content="View Product">
            <button
              onClick={() => navigate(`/products/${row.id}`)}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              <Eye size={16} />
            </button>
          </Tooltip>
          <Tooltip content="Edit Product">
            <button
              onClick={() => navigate(`/products/edit/${row.id}`)}
              className="p-1.5 text-slate-400 hover:text-bukizz-orange hover:bg-orange-50 rounded transition-colors"
            >
              <Edit2 size={16} />
            </button>
          </Tooltip>
          <Tooltip content="Delete Product">
            <button
              onClick={() => {
                setProductToDelete(row);
                setDeleteProductModalOpen(true);
              }}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500">Loading details...</div>
    );
  }

  if (!retailer) {
    return (
      <div className="p-8 text-center text-slate-500">Retailer not found</div>
    );
  }

  return (
    <div className="p-6 bg-bukizz-bg min-h-screen space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate("/retailers")}
          className="flex items-center text-slate-500 hover:text-slate-700 transition-colors mb-4"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to List
        </button>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xl font-bold">
              {retailer?.fullName?.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                {retailer?.fullName}
                <StatusBadge
                  status={retailer.is_active ? "active" : "inactive"}
                  type={retailer.is_active ? "success" : "error"}
                />
              </h1>
              <div className="text-sm text-slate-500 flex items-center gap-2">
                Retailer ID: #{retailer.id}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">
          Profile Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Mail size={20} />
            </div>
            <div className="flex-1">
              <div className="text-xs text-slate-500 uppercase font-semibold">
                Email
              </div>
              <div className="text-slate-900 flex items-center gap-2">
                {retailer.email}
                <button
                  onClick={() => {
                    setNewEmail(retailer.email || "");
                    setEmailError("");
                    setEmailModalOpen(true);
                  }}
                  className="p-1 text-slate-400 hover:text-bukizz-orange hover:bg-orange-50 rounded transition-colors"
                  title="Edit email"
                >
                  <Pencil size={14} />
                </button>
              </div>
              {retailer.email_verified && (
                <div className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle size={10} /> Verified
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Phone size={20} />
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold">
                Phone
              </div>
              <div className="text-slate-900">{retailer.phone}</div>
              {retailer.phone_verified && (
                <div className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle size={10} /> Verified
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <MapPin size={20} />
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold">
                Location
              </div>
              <div className="text-slate-900">
                {retailer.city}, {retailer.state}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
              <Calendar size={20} />
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold">
                Joined On
              </div>
              <div className="text-slate-900">
                {new Date(retailer.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Area */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-slate-200 pb-1">
          {/* Tabs */}
          <div className="flex gap-8">
            {[
              "warehouses",
              "general-products",
              "school-products",
              "settlements",
            ].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium transition-colors relative capitalize ${
                  activeTab === tab
                    ? "text-orange-500"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.replace("-", " ")}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500 rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {activeTab === "warehouses" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Building size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Associated Warehouses
                  </h2>
                  <p className="text-sm text-slate-500">
                    Manage supply locations for this retailer
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                icon={Plus}
                onClick={() => setIsModalOpen(true)}
              >
                Add Warehouse
              </Button>
            </div>

            <DataTable
              columns={warehouseColumns}
              data={warehouses}
              pagination={false}
              emptyMessage="No warehouses linked to this retailer."
              onRowClick={(row) => toggleRow(row.id)}
              customRowRender={(row) =>
                expandedRows[row.id] && (
                  <tr className="bg-slate-50 border-b border-slate-200/50 animate-in fade-in">
                    <td
                      colSpan={warehouseColumns.length + 1}
                      className="p-4 pl-12"
                    >
                      <div className="grid grid-cols-2 max-w-lg gap-4 text-sm">
                        <div>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                            Full Address
                          </span>
                          <div className="mt-1 text-slate-800">
                            {row.address.line1}
                            {row.address.line2 && (
                              <>
                                <br />
                                {row.address.line2}
                              </>
                            )}
                            <br />
                            {row.address.city}, {row.address.state} -{" "}
                            {row.address.postalCode || row.address.postal_code}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              }
            />
          </div>
        )}

        {/* General Products Tab */}
        {activeTab === "general-products" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-2">
            <DataTable
              columns={productColumns}
              data={products.filter((p) => p.productType === "general")}
              pagination={true}
              itemsPerPage={10}
              emptyMessage="No general products found."
            />
          </div>
        )}

        {/* School Products Tab */}
        {activeTab === "school-products" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-2">
            <DataTable
              columns={productColumns}
              data={products.filter((p) =>
                ["bookset", "uniform", "stationary"].includes(p.productType),
              )}
              pagination={true}
              itemsPerPage={10}
              emptyMessage="No school products found."
            />
          </div>
        )}

        {/* Settlements Tab */}
        {activeTab === "settlements" && (
          <RetailerSettlementsTab retailerId={id} />
        )}
      </div>

      {/* Product Deletion Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteProductModalOpen}
        onClose={() => setDeleteProductModalOpen(false)}
        onConfirm={handleDeleteProduct}
        title="Delete Product"
        message={`Are you sure you want to delete "${productToDelete?.title}"? This action cannot be undone.`}
        confirmText={isDeletingProduct ? "Deleting..." : "Delete Product"}
        isLoading={isDeletingProduct}
      />

      <AddWarehouseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        retailerId={id}
        onSuccess={(newWarehouse) => {
          // Optimistically add to list with temp ID
          setWarehouses((prev) => [
            ...prev,
            { ...newWarehouse, id: Date.now(), is_verified: false },
          ]);
        }}
      />

      {/* Edit Email Modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Update Email Address
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    This will change the retailer's login email. They will be
                    logged out of all sessions.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEmailModalOpen(false);
                    setNewEmail("");
                    setEmailError("");
                  }}
                  className="text-slate-400 hover:text-slate-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase mb-1">
                    Current Email
                  </div>
                  <div className="text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-md border border-slate-200">
                    {retailer.email}
                  </div>
                </div>

                <Input
                  label="New Email"
                  type="email"
                  icon={Mail}
                  placeholder="Enter new email address"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    setEmailError("");
                  }}
                  error={emailError}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isUpdatingEmail) handleUpdateEmail();
                  }}
                />
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
              <Button
                variant="ghost"
                onClick={() => {
                  setEmailModalOpen(false);
                  setNewEmail("");
                  setEmailError("");
                }}
                disabled={isUpdatingEmail}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateEmail}
                isLoading={isUpdatingEmail}
              >
                Update Email
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetailerDetailPage;
