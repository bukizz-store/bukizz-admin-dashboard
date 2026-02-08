import React, { useState } from "react";
import DataTable from "../../components/common/DataTable";
import PagePlaceholder from "../../components/common/PagePlaceholder";
import { Eye, CheckCircle, XCircle } from "lucide-react";
import Button from "../../components/ui/Button";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import { useToast } from "../../context/ToastContext";

const RetailerApprovalsPage = () => {
  const { toast } = useToast();
  const [selectedRetailer, setSelectedRetailer] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [docUrl, setDocUrl] = useState("");

  // Placeholder data - replace with API call
  // Endpoint: GET {{api_base}}/users?role=retailer&status=pending_verification
  const [data, setData] = useState([
    {
      id: 1,
      name: "John Doe",
      email: "john@store.com",
      storeName: "John's Electronics",
      gst: "GSTIN12345",
      city: "Mumbai",
      state: "Maharashtra",
      appliedOn: "2023-10-25",
      documentParams: {
        url: "https://via.placeholder.com/400x300?text=ID+Card",
      },
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@fashion.com",
      storeName: "Jane's Fashion",
      gst: "GSTIN67890",
      city: "Delhi",
      state: "Delhi",
      appliedOn: "2023-10-26",
      documentParams: {
        url: "https://via.placeholder.com/400x300?text=License",
      },
    },
  ]);

  const handleApprove = async (id) => {
    // PATCH /users/:id/approve
    toast.success("Retailer approved successfully");
    setData((prev) => prev.filter((item) => item.id !== id));
  };

  const handleReject = async () => {
    if (!selectedRetailer) return;
    // PATCH /users/:id/reject with reason {rejectReason}
    toast.success("Retailer rejected");
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
          <div className="font-medium text-slate-900">{row.name}</div>
          <div className="text-sm text-slate-500">{row.email}</div>
        </div>
      ),
    },
    {
      header: "Business Info",
      key: "business",
      render: (row) => (
        <div>
          <div className="font-medium text-slate-900">{row.storeName}</div>
          <div className="text-sm text-slate-500">{row.gst}</div>
        </div>
      ),
    },
    {
      header: "Location",
      key: "location",
      render: (row) => (
        <div className="text-slate-600">
          {row.city}, {row.state}
        </div>
      ),
    },
    {
      header: "Documents",
      key: "docs",
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setDocUrl(row.documentParams?.url);
            setIsDocsModalOpen(true);
          }}
          icon={Eye}
        >
          View Docs
        </Button>
      ),
    },
    {
      header: "Applied On",
      key: "appliedOn",
      render: (row) => <span className="text-slate-600">{row.appliedOn}</span>,
    },
    {
      header: "Actions",
      key: "actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => handleApprove(row.id)}
            icon={CheckCircle}
          >
            Approve
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => {
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">
          Retailer Approvals
        </h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {data.length > 0 ? (
          <DataTable columns={columns} data={data} />
        ) : (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-medium text-slate-900">
              All Caught Up!
            </h3>
            <p>No pending retailer requests. Good job.</p>
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
        message={`Are you sure you want to reject ${selectedRetailer?.name}? This action cannot be undone.`}
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
