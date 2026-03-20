import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../components/common/DataTable";
import { CheckCircle, XCircle, Loader2, Truck, FileText, Image as ImageIcon } from "lucide-react";
import Button from "../../components/ui/Button";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import { useToast } from "../../context/ToastContext";
import api from "../../services/api";

const DeliveryPartnerApprovalsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState(null);

  // Modal States
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isCodEligible, setIsCodEligible] = useState(false);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [activeDoc, setActiveDoc] = useState({ url: "", title: "" });

  // Fetch pending delivery partners
  const fetchPartners = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/admin/delivery/pending");

      if (response.data && response.data.success) {
        setData(response.data.data?.partners || []);
      }
    } catch (error) {
      console.error("Failed to fetch pending delivery partners:", error);
      toast.error("Failed to load delivery partner requests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const confirmApprove = (partner) => {
    setSelectedPartner(partner);
    setIsApproveModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedPartner) return;

    setIsApproving(true);
    try {
      const response = await api.put(
        `/admin/delivery/partners/${selectedPartner.user_id}/approve`,
        { isCodEligible }
      );

      if (response.data && response.data.success) {
        toast.success("Delivery partner approved and PIN sent via email.");
        setData((prev) =>
          prev.filter((item) => item.user_id !== selectedPartner.user_id),
        );
        setIsApproveModalOpen(false);
      } else {
        throw new Error(response.data?.message || "Approval failed");
      }
    } catch (error) {
      console.error("Approval failed:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to approve delivery partner",
      );
    } finally {
      setIsApproving(false);
      setSelectedPartner(null);
      setIsCodEligible(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPartner) return;
    toast.info("Rejection logic not yet implemented on backend");

    setData((prev) => prev.filter((item) => item.user_id !== selectedPartner.user_id));
    setIsRejectModalOpen(false);
    setRejectReason("");
    setSelectedPartner(null);
  };

  const viewDoc = (url, title) => {
    setActiveDoc({ url, title });
    setIsDocsModalOpen(true);
  };

  const columns = [
    {
      header: "Partner Info",
      key: "partner",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
            {row.profile_photo_url ? (
              <img 
                src={row.profile_photo_url} 
                alt="Profile" 
                className="w-full h-full object-cover cursor-pointer"
                onClick={(e) => {
                    e.stopPropagation();
                    viewDoc(row.profile_photo_url, "Profile Photo");
                }}
              />
            ) : (
              <ImageIcon className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div>
            <div className="font-medium text-slate-900">
              {row.user?.fullName || "N/A"}
            </div>
            <div className="text-sm text-slate-500">{row.user?.phone}</div>
            <div className="text-sm text-slate-500">{row.user?.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Vehicle Details",
      key: "vehicle",
      render: (row) => (
        <div>
          <div className="flex items-center gap-1.5 font-medium text-slate-900">
            <Truck className="w-4 h-4 text-slate-400" />
            {row.vehicle_details?.type || "N/A"}
          </div>
          <div className="text-sm text-slate-500 uppercase">
            {row.vehicle_details?.registrationNumber || row.vehicle_details?.registration_number || "No Plate"}
          </div>
        </div>
      ),
    },
    {
      header: "Documents",
      key: "documents",
      render: (row) => {
        const docs = row.documents || {};
        return (
          <div className="space-y-1">
            {docs.aadhaarNumber && (
              <div className="text-xs flex items-center gap-2">
                <span className="font-semibold text-slate-700">Aadhaar:</span> 
                <span>{docs.aadhaarNumber}</span>
                <div className="flex gap-1">
                    <button 
                        onClick={(e) => { e.stopPropagation(); viewDoc(docs.aadhaarPhotoUrl, "Aadhaar Front"); }}
                        className="text-blue-600 hover:underline px-1 border border-blue-100 rounded bg-blue-50"
                    >F</button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); viewDoc(docs.aadhaarBackPhotoUrl, "Aadhaar Back"); }}
                        className="text-blue-600 hover:underline px-1 border border-blue-100 rounded bg-blue-50"
                    >B</button>
                </div>
              </div>
            )}
            {docs.panNumber && (
              <div className="text-xs flex items-center gap-2">
                <span className="font-semibold text-slate-700">PAN:</span> 
                <span>{docs.panNumber}</span>
                <button 
                    onClick={(e) => { e.stopPropagation(); viewDoc(docs.panPhotoUrl, "PAN Card"); }}
                    className="text-blue-600 hover:underline px-1 border border-blue-100 rounded bg-blue-50"
                >View</button>
              </div>
            )}
            <div className="text-xs flex items-center gap-2">
              <span className="font-semibold text-slate-700">DL:</span> 
              <span>{docs.drivingLicenseNumber}</span>
              <button 
                  onClick={(e) => { e.stopPropagation(); viewDoc(docs.drivingLicensePhotoUrl, "Driving License"); }}
                  className="text-blue-600 hover:underline px-1 border border-blue-100 rounded bg-blue-50"
              >View</button>
            </div>
          </div>
        );
      },
    },
    {
      header: "Actions",
      key: "actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={(e) => {
              e.stopPropagation();
              confirmApprove(row);
            }}
            icon={CheckCircle}
          >
            Approve
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPartner(row);
              setIsRejectModalOpen(true);
            }}
            icon={XCircle}
          >
            Reject
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center items-center text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-bukizz-orange mr-3" />
        <span>Loading pending delivery partners...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">
          Delivery Partner Approvals
        </h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {data.length > 0 ? (
          <DataTable
            columns={columns}
            data={data}
            onRowClick={(row) => navigate(`/delivery/partners/${row.user_id}`)}
          />
        ) : (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center h-full">
            <div className="p-4 rounded-full bg-green-50 mb-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              All Caught Up!
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              No delivery partners pending approval at the moment.
            </p>
          </div>
        )}
      </div>

      {/* Docs Modal */}
      {isDocsModalOpen && (
        <div 
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setIsDocsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-bukizz-orange" />
                {activeDoc.title}
              </h3>
              <button
                onClick={() => setIsDocsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                aria-label="Close"
              >
                <XCircle className="w-6 h-6 text-slate-400 hover:text-red-500" />
              </button>
            </div>
            <div className="p-4 flex justify-center bg-slate-100/50 overflow-auto max-h-[80vh]">
              {activeDoc.url ? (
                <img
                  src={activeDoc.url}
                  alt={activeDoc.title}
                  className="max-w-full h-auto rounded-lg shadow-md border border-slate-200"
                />
              ) : (
                <div className="p-20 text-slate-400 italic">Document image not available</div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <Button variant="ghost" onClick={() => setIsDocsModalOpen(false)}>Close Preview</Button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      <ConfirmationModal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        onConfirm={handleApprove}
        title="Approve Delivery Partner"
        message={`Are you sure you want to approve **${selectedPartner?.user?.fullName || "this partner"}**? They will receive a 4-digit login PIN via email and can start taking orders.`}
        confirmText={isApproving ? "Approving..." : "Approve & Send PIN"}
        isLoading={isApproving}
        confirmVariant="success"
      >
          <div className="mt-4 p-4 rounded-lg bg-orange-50 border border-orange-100">
            <label className="flex items-center gap-3 cursor-pointer">
                <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-slate-300 text-bukizz-orange focus:ring-bukizz-orange"
                    checked={isCodEligible}
                    onChange={(e) => setIsCodEligible(e.target.checked)}
                />
                <span className="font-medium text-slate-700">Eligible for Cash on Delivery (COD)</span>
            </label>
            <p className="mt-2 text-sm text-slate-500 ml-8">
                If enabled, this partner will be able to handle cash collection for orders.
            </p>
          </div>
      </ConfirmationModal>

      {/* Reject Modal */}
      <ConfirmationModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setRejectReason("");
          setSelectedPartner(null);
        }}
        onConfirm={handleReject}
        title="Reject Application"
        message={`Are you sure you want to reject the application from ${selectedPartner?.user?.fullName || "this partner"}?`}
        confirmText="Reject Application"
        confirmVariant="danger"
      >
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Rejection Reason
          </label>
          <textarea
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
            rows="3"
            placeholder="Explain why the application was rejected..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </div>
      </ConfirmationModal>
    </div>
  );
};

export default DeliveryPartnerApprovalsPage;
