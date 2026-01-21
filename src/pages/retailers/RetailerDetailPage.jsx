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
} from "lucide-react";
import { Button } from "../../components/ui";
import { StatusBadge, DataTable } from "../../components/common";
import AddWarehouseModal from "../../components/retailers/AddWarehouseModal";
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
      } catch (error) {
        console.error("Failed to load details:", error);
        toast.error("Failed to load details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const toggleRow = (rowId) => {
    setExpandedRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
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
        <div className="font-medium text-slate-800">{row.name}</div>
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
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold">
                Email
              </div>
              <div className="text-slate-900">{retailer.email}</div>
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

      {/* Warehouses Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
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
          <Button size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
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
                <td colSpan={warehouseColumns.length + 1} className="p-4 pl-12">
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
                    {/* Map placeholder or other details could go here */}
                  </div>
                </td>
              </tr>
            )
          }
        />
      </div>

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
    </div>
  );
};

export default RetailerDetailPage;
