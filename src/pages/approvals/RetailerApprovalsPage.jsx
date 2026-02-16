import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../components/common/DataTable";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Button from "../../components/ui/Button";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import { useToast } from "../../context/ToastContext";
import api from "../../services/api";

const RetailerApprovalsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRetailer, setSelectedRetailer] = useState(null);

  // Modal States
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [docUrl, setDocUrl] = useState("");

  // Fetch inactive retailers
  const fetchRetailers = async () => {
    setIsLoading(true);
    try {
      const params = {
        page: 1,
        limit: 100,
      };

      const response = await api.get("/users/admin/retailers/pending", {
        params,
      });

      if (response.data && response.data.success) {
        setData(response.data.data?.users || response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch pending approvals:", error);
      toast.error("Failed to load retailer requests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRetailers();
  }, []);

  const confirmApprove = (retailer) => {
    setSelectedRetailer(retailer);
    setIsApproveModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRetailer) return;

    setIsApproving(true);
    try {
      const response = await api.patch(
        `/users/admin/retailers/${selectedRetailer.id}/approve`,
      );

      if (response && (response.status === 200 || response.data?.success)) {
        toast.success("Retailer account approved successfully.");
        setData((prev) =>
          prev.filter((item) => item.id !== selectedRetailer.id),
        );
        setIsApproveModalOpen(false);
      } else {
        throw new Error(response?.data?.message || "Approval failed");
      }
    } catch (error) {
      console.error("Approval failed:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to approve retailer",
      );
    } finally {
      setIsApproving(false);
      setSelectedRetailer(null);
    }
  };

  const handleReject = async () => {
    if (!selectedRetailer) return;
    toast.info("Rejection logic not yet implemented on backend");

    setData((prev) => prev.filter((item) => item.id !== selectedRetailer.id));
    setIsRejectModalOpen(false);
    setRejectReason("");
    setSelectedRetailer(null);
  };

  const columns = [
    {
      header: "Applicant",
      key: "applicant",
      render: (row) => (
        <div>
          <div className="font-medium text-slate-900">
            {row.fullName || row.name}
          </div>
          <div className="text-sm text-slate-500">{row.email}</div>
          <div className="text-sm text-slate-500">{row.phone}</div>
        </div>
      ),
    },
    {
      header: "Business Info",
      key: "business",
      render: (row) => (
        <div>
          <div className="font-medium text-slate-900">
            {row.shop_name || "Retail Store"}
          </div>
          <div className="text-sm text-slate-500">
            {row.gst_number || "GST: N/A"}
          </div>
        </div>
      ),
    },
    {
      header: "Location",
      key: "location",
      render: (row) => (
        <div className="text-slate-600">
          {row.city ? `${row.city}, ${row.state}` : "N/A"}
        </div>
      ),
    },
    {
      header: "Joined On",
      key: "createdAt",
      render: (row) => (
        <span className="text-slate-600">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "N/A"}
        </span>
      ),
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
              setSelectedRetailer(row);
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
        <span>Loading pending approvals...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">
          Retailer Approvals
        </h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {data.length > 0 ? (
          <DataTable
            columns={columns}
            data={data}
            onRowClick={(row) => navigate(`/retailers/${row.id}`)}
          />
        ) : (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center h-full">
            <CheckCircle className="w-16 h-16 mb-4 text-green-100 fill-green-500" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              All Caught Up!
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              No inactive retailers pending approval at the moment.
            </p>
          </div>
        )}
      </div>

      {/* Docs Modal */}
      {isDocsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-lg">Verification Documents</h3>
              <button
                onClick={() => setIsDocsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 flex justify-center bg-slate-50">
              <img
                src={docUrl}
                alt="Document"
                className="max-h-[60vh] object-contain rounded-lg shadow-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      <ConfirmationModal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        onConfirm={handleApprove}
        title="Approve Retailer"
        message={`Are you sure you want to approve **${selectedRetailer?.fullName || selectedRetailer?.name || "this retailer"}**? They will gain access to the platform immediately.`}
        confirmText={isApproving ? "Approving..." : "Approve Retailer"}
        isLoading={isApproving}
        confirmVariant="success"
      />

      {/* Reject Modal */}
      <ConfirmationModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setRejectReason("");
          setSelectedRetailer(null);
        }}
        onConfirm={handleReject}
        title="Reject Retailer"
        message={`Are you sure you want to reject ${selectedRetailer?.fullName || selectedRetailer?.name || "this retailer"}? This action cannot be undone.`}
        confirmText="Reject Application"
        confirmVariant="danger"
      >
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Rejection Reason
          </label>
          <textarea
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            rows="3"
            placeholder="Enter reason for rejection..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </div>
      </ConfirmationModal>
    </div>
  );
};

export default RetailerApprovalsPage;
