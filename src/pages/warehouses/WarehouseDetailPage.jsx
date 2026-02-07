import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building,
  MapPin,
  Phone,
  Mail,
  User,
  ExternalLink,
  CheckCircle,
} from "lucide-react";
import api from "../../services/api";
import { Button, ConfirmationModal } from "../../components/ui";
import { StatusBadge } from "../../components/common";
import { useToast } from "../../context/ToastContext";

const WarehouseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [warehouse, setWarehouse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Approval State
  const [isApproving, setIsApproving] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);

  useEffect(() => {
    const fetchWarehouse = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/warehouses/${id}`);
        // Adjust based on your API response structure
        // Assuming response.data.data.warehouse or similar
        console.log("Warehouse Data:", response.data);
        if (response.data?.success) {
          setWarehouse(response.data.data?.warehouse || response.data.data);
        }
      } catch (error) {
        console.error("Failed to load warehouse details:", error);
        toast.error("Failed to load warehouse details");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchWarehouse();
    }
  }, [id, toast]);

  const handleApproveWarehouse = async () => {
    setIsApproving(true);
    try {
      const payload = {
        name: warehouse.name,
        isVerified: true,
      };
      const response = await api.put(`/warehouses/${id}`, payload);
      if (response.data?.success || response.success) {
        // Adjusted check based on potential response format
        toast.success("Warehouse approved successfully");
        setWarehouse((prev) => ({
          ...prev,
          is_verified: true,
          isVerified: true,
        }));
      }
    } catch (error) {
      console.error("Failed to approve warehouse:", error);
      toast.error("Failed to approve warehouse");
    } finally {
      setIsApproving(false);
      setApprovalModalOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bukizz-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bukizz-orange"></div>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bukizz-bg gap-4">
        <h2 className="text-xl font-semibold text-slate-700">
          Warehouse not found
        </h2>
        <Button onClick={() => navigate(-1)} icon={ArrowLeft}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bukizz-bg p-6 relative">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-slate-500 hover:text-slate-700 transition-colors mb-4"
        >
          <ArrowLeft size={16} className="mr-1" /> Back
        </button>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 text-xl font-bold">
              <Building size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {warehouse.name}
              </h1>
              <div className="text-sm text-slate-500 flex items-center gap-2">
                ID: #{warehouse.id}
                <span className="text-slate-300">|</span>
                <StatusBadge
                  status={
                    warehouse.is_verified || warehouse.isVerified
                      ? "verified"
                      : "pending"
                  }
                  type={
                    warehouse.is_verified || warehouse.isVerified
                      ? "success"
                      : "warning"
                  }
                />
              </div>
            </div>
          </div>

          {/* Approval Button */}
          {!(warehouse.is_verified || warehouse.isVerified) && (
            <Button
              onClick={() => setApprovalModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white border-none shadow-md"
            >
              <CheckCircle size={16} className="mr-2" />
              Approve Warehouse
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detailed Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">
              General Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Address */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase font-semibold mb-1">
                    Address
                  </div>
                  <div className="text-slate-900 text-sm">
                    {warehouse.address?.line1}
                    {warehouse.address?.line2 && (
                      <>
                        <br />
                        {warehouse.address?.line2}
                      </>
                    )}
                    <br />
                    {warehouse.address?.city}, {warehouse.address?.state} -{" "}
                    {warehouse.address?.postalCode ||
                      warehouse.address?.postal_code}
                  </div>
                </div>
              </div>

              {/* Manager/Contact */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg shrink-0">
                  <User size={20} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase font-semibold mb-1">
                    Manager Details
                  </div>
                  {warehouse.manager_name && (
                    <div className="text-slate-900 text-sm font-medium">
                      {warehouse.manager_name}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-slate-600 text-sm mt-1">
                    <Phone size={14} className="text-slate-400" />
                    {warehouse.contact_phone || "N/A"}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 text-sm mt-1">
                    <Mail size={14} className="text-slate-400" />
                    {warehouse.contact_email || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Key Stats / Retailer Link */}
        <div className="lg:col-span-1 space-y-6">
          {/* Retailer Card */}
          {warehouse.retailer && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                Managed By
              </h2>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold shrink-0">
                  {warehouse.retailer.full_name?.charAt(0) || "R"}
                </div>
                <div>
                  <div className="font-medium text-slate-900 flex items-center gap-2">
                    {warehouse.retailer.full_name}
                    {warehouse.retailer.is_active && (
                      <div
                        className="w-2 h-2 bg-green-500 rounded-full"
                        title="Active"
                      ></div>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                    Retailer
                  </div>

                  <div className="space-y-1 mt-2">
                    {warehouse.retailer.email && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail size={14} className="text-slate-400" />
                        {warehouse.retailer.email}
                      </div>
                    )}
                    {warehouse.retailer.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone size={14} className="text-slate-400" />
                        {warehouse.retailer.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => navigate(`/retailers/${warehouse.retailer.id}`)}
              >
                View Retailer Profile
                <ExternalLink size={16} />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Approval Confirmation Modal */}
      <ConfirmationModal
        isOpen={approvalModalOpen}
        onClose={() => setApprovalModalOpen(false)}
        onConfirm={handleApproveWarehouse}
        title="Approve Warehouse"
        message={`Are you sure you want to approve "${warehouse.name}"?`}
        confirmText={isApproving ? "Approving..." : "Approve Warehouse"}
        isLoading={isApproving}
        variant="success"
      />
    </div>
  );
};

export default WarehouseDetailPage;
