import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../components/common/DataTable";
import { CheckCircle, XCircle, Loader2, Building } from "lucide-react";
import Button from "../../components/ui/Button";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import { useToast } from "../../context/ToastContext";
import api from "../../services/api";

const RetailerSchoolApprovalsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Filter States
  const [selectedRetailerFilter, setSelectedRetailerFilter] = useState("all");

  // Modal States
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // Fetch pending retailer-school requests
  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/retailer-schools/admin/pending");
      if (response.data && response.data.success) {
        setData(response.data.requests || []);
      }
    } catch (error) {
      console.error("Failed to fetch pending school requests:", error);
      toast.error("Failed to load school association requests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const confirmApprove = (request) => {
    setSelectedRequest(request);
    setIsApproveModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setIsApproving(true);
    try {
      const response = await api.patch("/retailer-schools/status", {
        schoolId: selectedRequest.schoolId,
        retailerId: selectedRequest.retailerId,
        currentStatus: "pending",
        newStatus: "approved",
      });

      if (response && (response.status === 200 || response.data?.success)) {
        toast.success("School association approved successfully.");
        setData((prev) =>
          prev.filter(
            (item) =>
              !(
                item.schoolId === selectedRequest.schoolId &&
                item.retailerId === selectedRequest.retailerId
              ),
          ),
        );
        setIsApproveModalOpen(false);
      } else {
        throw new Error(response?.data?.message || "Approval failed");
      }
    } catch (error) {
      console.error("Approval failed:", error);
      toast.error(
        error.response?.data?.error ||
          error.message ||
          "Failed to approve school association",
      );
    } finally {
      setIsApproving(false);
      setSelectedRequest(null);
    }
  };

  const confirmReject = (request) => {
    setSelectedRequest(request);
    setIsRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    setIsRejecting(true);
    try {
      const response = await api.patch("/retailer-schools/status", {
        schoolId: selectedRequest.schoolId,
        retailerId: selectedRequest.retailerId,
        currentStatus: "pending",
        newStatus: "rejected",
      });

      if (response && (response.status === 200 || response.data?.success)) {
        toast.success("School association rejected.");
        setData((prev) =>
          prev.filter(
            (item) =>
              !(
                item.schoolId === selectedRequest.schoolId &&
                item.retailerId === selectedRequest.retailerId
              ),
          ),
        );
        setIsRejectModalOpen(false);
      } else {
        throw new Error(response?.data?.message || "Rejection failed");
      }
    } catch (error) {
      console.error("Rejection failed:", error);
      toast.error(
        error.response?.data?.error ||
          error.message ||
          "Failed to reject school association",
      );
    } finally {
      setIsRejecting(false);
      setSelectedRequest(null);
    }
  };

  const goToWarehouse = (retailerId) => {
    navigate(`/retailers/${retailerId}`);
  };

  const retailersMap = useMemo(() => {
    const map = new Map();
    data.forEach((req) => {
      if (req.retailer) {
        map.set(
          req.retailer.id,
          req.retailer.full_name || req.retailer.shop_name,
        );
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [data]);

  const filteredData = useMemo(() => {
    if (selectedRetailerFilter === "all") return data;
    return data.filter((req) => req.retailerId === selectedRetailerFilter);
  }, [data, selectedRetailerFilter]);

  const columns = [
    {
      header: "Retailer (Applicant)",
      key: "retailer",
      render: (row) => (
        <div>
          <div className="font-medium text-slate-900">
            {row.retailer?.shop_name ||
              row.retailer?.full_name ||
              "Unknown Retailer"}
          </div>
          <div className="text-sm text-slate-500">{row.retailer?.email}</div>
          <div className="text-sm text-slate-500">{row.retailer?.phone}</div>
        </div>
      ),
    },
    {
      header: "School Details",
      key: "school",
      render: (row) => (
        <div>
          <div className="font-medium text-slate-900">
            {row.school?.name || "Unknown School"}
          </div>
          <div className="text-sm text-slate-500">
            {row.school?.city
              ? `${row.school.city}, ${row.school.state}`
              : "Location N/A"}
          </div>
        </div>
      ),
    },
    {
      header: "Product Categories",
      key: "productType",
      render: (row) => (
        <div className="flex flex-wrap gap-1 max-w-37.5">
          {row.productType?.map((pt, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs"
            >
              {pt}
            </span>
          ))}
        </div>
      ),
    },
    {
      header: "Requested On",
      key: "linkedAt",
      render: (row) => (
        <span className="text-slate-600">
          {row.linkedAt ? new Date(row.linkedAt).toLocaleDateString() : "N/A"}
        </span>
      ),
    },
    {
      header: "Warehouse",
      key: "warehouse",
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            goToWarehouse(row.retailerId);
          }}
          icon={Building}
        >
          View Warehouse
        </Button>
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
              confirmReject(row);
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
        <span>Loading pending requests...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">
          School Retailer Approvals
        </h1>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600 shrink-0">
            Filter by Retailer:
          </label>
          <select
            className="border-slate-300 rounded-md focus:ring-bukizz-orange focus:border-bukizz-orange text-sm p-2 bg-white min-w-[200px]"
            value={selectedRetailerFilter}
            onChange={(e) => setSelectedRetailerFilter(e.target.value)}
          >
            <option value="all">All Retailers</option>
            {retailersMap.map((rt, i) => (
              <option key={rt.id + i} value={rt.id}>
                {rt.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-100">
        {filteredData.length > 0 ? (
          <DataTable
            columns={columns}
            data={filteredData}
            onRowClick={() => {}}
          />
        ) : (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center h-full">
            <CheckCircle className="w-16 h-16 mb-4 text-green-100 fill-green-500" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              All Caught Up!
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              No pending school association requests at the moment.
            </p>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        onConfirm={handleApprove}
        title="Approve School Association"
        message={`Are you sure you want to approve the association between **${selectedRequest?.retailer?.shop_name || "this retailer"}** and **${selectedRequest?.school?.name || "this school"}**?`}
        confirmText={isApproving ? "Approving..." : "Approve Association"}
        isLoading={isApproving}
        confirmVariant="success"
      />

      <ConfirmationModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleReject}
        title="Reject School Association"
        message={`Are you sure you want to reject the association between **${selectedRequest?.retailer?.shop_name || "this retailer"}** and **${selectedRequest?.school?.name || "this school"}**? This action cannot be undone.`}
        confirmText={isRejecting ? "Rejecting..." : "Reject Application"}
        isLoading={isRejecting}
        confirmVariant="danger"
      />
    </div>
  );
};

export default RetailerSchoolApprovalsPage;
