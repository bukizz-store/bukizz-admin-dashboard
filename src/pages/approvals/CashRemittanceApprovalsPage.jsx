import React, { useState, useEffect } from "react";
import DataTable from "../../components/common/DataTable";
import { CheckCircle, Loader2, Wallet, User, Calendar, Receipt } from "lucide-react";
import Button from "../../components/ui/Button";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import { useToast } from "../../context/ToastContext";
import api from "../../services/api";

const CashRemittanceApprovalsPage = () => {
  const toast = useToast();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRemittance, setSelectedRemittance] = useState(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const fetchRemittances = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/admin/delivery-partners/cash/remittances?status=pending");

      if (response.data && response.data.status === "success") {
        setData(response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch cash remittances:", error);
      toast.error("Failed to load cash remittance requests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRemittances();
  }, []);

  const confirmApprove = (remittance) => {
    setSelectedRemittance(remittance);
    setIsApproveModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRemittance) return;

    setIsApproving(true);
    try {
      const response = await api.post(
        `/admin/delivery-partners/cash/remittances/${selectedRemittance.id}/approve`
      );

      if (response.data && response.data.status === "success") {
        toast.success("Cash remittance approved successfully.");
        setData((prev) =>
          prev.filter((item) => item.id !== selectedRemittance.id),
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
          "Failed to approve cash remittance",
      );
    } finally {
      setIsApproving(false);
      setSelectedRemittance(null);
    }
  };

  const columns = [
    {
      header: "Delivery Partner",
      key: "partner",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-slate-900">
              {row.delivery_partner?.full_name || "N/A"}
            </div>
            <div className="text-sm text-slate-500">{row.delivery_partner?.phone}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Amount",
      key: "amount",
      render: (row) => (
        <div className="flex items-center gap-1.5 font-bold text-slate-900">
          <Wallet className="w-4 h-4 text-green-600" />
          ₹{parseFloat(row.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
      ),
    },
    {
      header: "Orders",
      key: "orders",
      render: (row) => (
        <div className="flex items-center gap-1.5 text-slate-600">
          <Receipt className="w-4 h-4 text-slate-400" />
          {row.order_ids?.length || 0} Orders
        </div>
      ),
    },
    {
      header: "Submitted At",
      key: "submitted_at",
      render: (row) => (
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <Calendar className="w-4 h-4 text-slate-400" />
          {new Date(row.submitted_at).toLocaleString('en-IN')}
        </div>
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
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center items-center text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-bukizz-orange mr-3" />
        <span>Loading cash remittances...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">
          Cash Remittance Approvals
        </h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {data.length > 0 ? (
          <DataTable
            columns={columns}
            data={data}
          />
        ) : (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center h-full">
            <div className="p-4 rounded-full bg-green-50 mb-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              All Clear!
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              No cash remittances pending approval at the moment.
            </p>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        onConfirm={handleApprove}
        title="Approve Cash Remittance"
        message={`Are you sure you want to approve the cash remittance of **₹${parseFloat(selectedRemittance?.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}** from **${selectedRemittance?.delivery_partner?.full_name || "this partner"}**?`}
        confirmText={isApproving ? "Approving..." : "Approve Remittance"}
        isLoading={isApproving}
        confirmVariant="success"
      />
    </div>
  );
};

export default CashRemittanceApprovalsPage;
