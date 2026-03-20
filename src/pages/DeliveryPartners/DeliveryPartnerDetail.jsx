import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  CheckCircle,
  Truck,
  AlertTriangle,
  Clock,
  Car,
  FileText,
  CreditCard,
  Download,
  Wallet,
  Loader2,
  Eye
} from "lucide-react";
import { Button, Tooltip, ConfirmationModal } from "../../components/ui";
import { StatusBadge, DataTable, Pagination } from "../../components/common";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import DPInitiatePayoutModal from "./DPInitiatePayoutModal";

const DeliveryPartnerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [partner, setPartner] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active-loadout"); 
  const [codAllowed, setCodAllowed] = useState(true);

  // Action Modals State
  const [unassignModalOpen, setUnassignModalOpen] = useState(false);
  const [selectedOrderToUnassign, setSelectedOrderToUnassign] = useState(null);
  const [isUnassigning, setIsUnassigning] = useState(false);

  // Live Data States
  const [orders, setOrders] = useState([]);
  const [slaData, setSlaData] = useState(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const [ledger, setLedger] = useState([]);
  const [ledgerPagination, setLedgerPagination] = useState({ page: 1, limit: 10, totalPages: 1 });
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);

  const [history, setHistory] = useState([]);
  const [historyPagination, setHistoryPagination] = useState({ page: 1, limit: 10, totalPages: 1 });
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch DP Profile
  useEffect(() => {
    const fetchPartner = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/admin/delivery-partners/${id}`);
        const dpData = res.data.data;
        const mappedPartner = {
            id: dpData.profile?.id,
            fullName: dpData.profile?.fullName,
            email: dpData.profile?.email,
            phone: dpData.profile?.phone,
            is_active: dpData.profile?.isActive,
            phone_verified: true,
            vehicle_type: dpData.vehicle?.type || "N/A",
            vehicle_plate: dpData.vehicle?.registrationNumber || "N/A",
            uncleared_cod: dpData.financials?.walletBalance || 0,
            dl_number: dpData.kyc?.data?.drivingLicenseNumber || dpData.kyc?.data?.dl_number || "Upload Pending",
            pan_number: dpData.kyc?.data?.panNumber || dpData.kyc?.data?.pan_number || "Upload Pending",
            aadhaar_number: dpData.kyc?.data?.aadhaarNumber || dpData.kyc?.data?.aadharNumber || "Upload Pending",
            bank_account: dpData.bank?.accountNumberMasked || "N/A",
            bank_ifsc: dpData.bank?.ifsc || "N/A",
            bank_name: dpData.bank?.accountName || "N/A",
            activeOrderCount: dpData.activeOrderCount || 0,
            kyc: dpData.kyc // For document URLs
        };
        
        setPartner(mappedPartner);
        setCodAllowed(dpData.financials?.isCodEligible ?? false);
      } catch (error) {
        console.error("Failed to load details:", error);
        toast.error("Failed to load details");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchPartner();
    }
  }, [id, refreshKey]);

  // Fetch Loadout
  useEffect(() => {
    if (activeTab === "active-loadout" && id) {
       const fetchLoadout = async () => {
          setIsLoadingOrders(true);
          try {
             const res = await api.get(`/admin/delivery-partners/${id}/active-loadout`);
             setOrders(res.data.data.orders || []);
             setSlaData(res.data.data.sla || null);
          } catch(err) {
             console.error("Failed to load active orders", err);
             // Fail silently on UI if mocked
          } finally {
             setIsLoadingOrders(false);
          }
       };
       fetchLoadout();
    }
  }, [activeTab, id]);

  // Fetch Ledger
  useEffect(() => {
    if (activeTab === "ledger-settlements" && id) {
       const fetchLedger = async () => {
          setIsLoadingLedger(true);
          try {
             const res = await api.get(`/admin/delivery-partners/${id}/ledger`, {
                params: { page: ledgerPagination.page, limit: ledgerPagination.limit }
             });
             setLedger(res.data.data.transactions || []);
             setLedgerPagination(res.data.data.pagination || { page: 1, limit: 10, totalPages: 1 });
          } catch(err) {
             console.error("Failed to load ledger", err);
          } finally {
             setIsLoadingLedger(false);
          }
       };
       fetchLedger();
    }
  }, [activeTab, id, ledgerPagination.page, ledgerPagination.limit, refreshKey]);

  // Fetch History
  useEffect(() => {
    if (activeTab === "history" && id) {
       const fetchHistory = async () => {
          setIsLoadingHistory(true);
          try {
             const res = await api.get(`/admin/delivery-partners/${id}/history`, {
                params: { page: historyPagination.page, limit: historyPagination.limit }
             });
             setHistory(res.data.data.orders || []);
             setHistoryPagination(res.data.data.pagination || { page: 1, limit: 10, totalPages: 1 });
          } catch(err) {
             console.error("Failed to load history", err);
          } finally {
             setIsLoadingHistory(false);
          }
       };
       fetchHistory();
    }
  }, [activeTab, id, historyPagination.page, historyPagination.limit, refreshKey]);

  const handleUnassign = async () => {
      if (!selectedOrderToUnassign) return;
      setIsUnassigning(true);
      try {
          await api.post(`/admin/delivery-partners/${id}/unassign`, { 
              orderId: selectedOrderToUnassign.id
          });
          toast.success("Order un-assigned successfully");
          // Refresh the page data
          setRefreshKey(prev => prev + 1);
          setUnassignModalOpen(false);
          setSelectedOrderToUnassign(null);
      } catch (error) {
          toast.error("Failed to un-assign order");
      } finally {
          setIsUnassigning(false);
      }
  };

  const handleToggleCod = async () => {
      const originalValue = codAllowed;
      const newValue = !codAllowed;
      setCodAllowed(newValue); // Optimistic UI
      try {
          await api.patch(`/admin/delivery-partners/${id}/cod-status`, { isCodEligible: newValue });
          toast.success(`COD Eligibility turned ${newValue ? 'ON' : 'OFF'}`);
      } catch (err) {
          setCodAllowed(originalValue);
          toast.error("Failed to update COD eligibility");
      }
  };

  const handleViewDoc = (url) => {
    if (url) window.open(url, "_blank");
    else toast.error("Document not uploaded yet");
  };

  const handleDownloadDoc = (url) => {
    if (!url) {
      toast.error("Document not uploaded yet");
      return;
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = "KYC_Document";
    a.click();
  };

  const aadhaarUrl = partner?.kyc?.data?.aadhaarPhotoUrl || partner?.kyc?.data?.aadharPhotoUrl || partner?.kyc?.data?.aadhaarFrontPhotoUrl;
  const panUrl = partner?.kyc?.data?.panPhotoUrl || partner?.kyc?.data?.pan_photo_url;
  const dlUrl = partner?.kyc?.data?.drivingLicensePhotoUrl || partner?.kyc?.data?.dlPhotoUrl || partner?.kyc?.data?.dl_photo_url;

  if (isLoading) {
    return (
        <div className="flex items-center justify-center p-8 h-screen text-slate-500">
            <Loader2 className="animate-spin mr-2" /> Loading DP profile...
        </div>
    );
  }

  if (!partner) {
    return <div className="p-8 text-center text-slate-500">Delivery Partner not found</div>;
  }

  // Columns for Ledger Table
  const ledgerColumns = [
    {
        header: "Date/Time",
        accessor: "created_at",
        render: (row) => new Date(row.created_at).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
        })
    },
    { header: "Transaction ID", accessor: "id" },
    { header: "Type", accessor: "transaction_type" },
    { header: "Order ID", accessor: "order_id" },
    {
        header: "Amount",
        accessor: "amount",
        render: (row) => (
            <span className={row.amount > 0 ? "text-green-600" : "text-red-600"}>
                {row.amount > 0 ? "+" : ""}₹{Math.abs(row.amount)}
            </span>
        )
    },
    {
        header: "Closing Balance",
        accessor: "runningBalance",
        render: (row) => `₹${row.runningBalance}`
    }
  ];

  const historyColumns = [
    {
        header: "Order ID",
        accessor: "order_number",
        render: (row) => (
            <div>
              <button 
                  onClick={() => navigate(`/orders/${row.id}`)}
                  className="text-orange-600 hover:text-orange-700 font-medium hover:underline text-left cursor-pointer"
              >
                  {row.order_number || row.id.substring(0, 8)}
              </button>
              {row.dispatch_id && <div className="text-[10px] text-slate-500 font-medium mt-0.5 tracking-wide">DISPATCH: {row.dispatch_id.toUpperCase()}</div>}
            </div>
        )
    },
    {
        header: "Date Completed",
        accessor: "updated_at",
        render: (row) => new Date(row.updated_at).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
        })
    },
    {
        header: "Amount",
        accessor: "total_amount",
        render: (row) => `₹${row.total_amount}`
    },
    {
        header: "Method",
        accessor: "payment_method",
        render: (row) => (
            <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase ${row.payment_method === 'cod' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                {row.payment_method}
            </span>
        )
    },
    {
        header: "Address",
        accessor: "shipping_address",
        render: (row) => <span className="line-clamp-1">{row.shipping_address?.line1}, {row.shipping_address?.city}</span>
    },
    {
        header: "Status",
        accessor: "status",
        render: (row) => (
            <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase bg-blue-50 text-blue-700">
                {row.status?.replace("_", " ")}
            </span>
        )
    }
  ];

  return (
    <div className="p-6 bg-bukizz-bg min-h-screen space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate("/admin/delivery-partners")}
          className="flex items-center text-slate-500 hover:text-slate-700 transition-colors mb-4"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to List
        </button>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xl font-bold">
              {partner?.fullName?.charAt(0) || "D"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                {partner?.fullName}
                <StatusBadge
                  status={partner.is_active ? "active" : "inactive"}
                  type={partner.is_active ? "success" : "error"}
                />
              </h1>
              <div className="text-sm text-slate-500 flex items-center gap-2">
                DP ID: #{partner.id}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">
          Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
              <Phone size={20} />
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Contact</div>
              <div className="text-slate-900 font-medium">{partner.phone}</div>
              {partner.phone_verified && (
                <div className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                  <CheckCircle size={10} /> Verified
                </div>
              )}
              <div className="text-sm text-slate-600 mt-1">{partner.email}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg shrink-0">
              <Car size={20} />
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Vehicle</div>
              <div className="text-slate-900 font-medium">{partner.vehicle_type}</div>
              <div className="text-sm text-slate-600 mt-0.5">{partner.vehicle_plate}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg shrink-0">
              <Wallet size={20} />
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Wallet Balance</div>
              <div className="text-xl font-bold text-slate-900">₹{partner.uncleared_cod}</div>
              <div className="text-xs text-slate-500 mt-0.5">Net amount owed to DP</div>
            </div>
          </div>

          <div className="flex items-center gap-4 justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
             <div>
                <div className="text-sm font-semibold text-slate-800">COD Orders Allowed</div>
                <div className="text-xs text-slate-500 mt-0.5">Toggle COD eligibility</div>
             </div>
             <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-slate-500 uppercase font-semibold">COD Allowed</div>
                <div className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${codAllowed ? 'bg-emerald-500' : 'bg-slate-300'}`} onClick={handleToggleCod}>
                    <div className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform ${codAllowed ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>
          </div>
        </div>
      </div>

      {/* Tabs Area */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-slate-200 pb-1">
          {/* Tabs */}
          <div className="flex gap-8 overflow-x-auto">
            {[
              { id: "active-loadout", label: "Active Loadout" },
              { id: "history", label: "Delivery History" },
              { id: "profile-kyc", label: "Profile & KYC" },
              { id: "ledger-settlements", label: "Ledger & Settlements" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-medium transition-colors whitespace-nowrap relative ${
                  activeTab === tab.id
                    ? "text-orange-500"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500 rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content A: Active Loadout */}
        {activeTab === "active-loadout" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
             {/* SLA Timer Banner */}
             {slaData?.warning && (
                 <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3 text-amber-800">
                    <AlertTriangle size={20} className="shrink-0" />
                    <div className="text-sm">
                        <strong>SLA Warning:</strong> Order(s) have been assigned for {slaData?.elapsedFormatted} without delivery. Please monitor.
                    </div>
                 </div>
             )}

             {isLoadingOrders ? (
                 <div className="flex justify-center p-8 text-slate-500"><Loader2 className="animate-spin" /></div>
             ) : orders.length === 0 ? (
                 <div className="bg-white border-dashed border border-slate-200 rounded-xl p-8 text-center text-slate-500">
                     No active orders currently assigned to this partner.
                 </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orders.map(order => (
                        <div key={order.id} className="bg-white border text-center md:text-left border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <button 
                                            onClick={() => navigate(`/orders/${order.id}`)}
                                            className="text-sm font-bold text-orange-600 hover:text-orange-700 hover:underline text-left cursor-pointer transition-colors"
                                        >
                                            {order.order_number || order.id}
                                        </button>
                                        {order.dispatch_id && <div className="text-[10px] text-slate-500 font-medium mt-0.5 tracking-wide">DISPATCH: {order.dispatch_id.toUpperCase()}</div>}
                                        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1"><Clock size={12}/> Assigned: {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                    </div>
                                    <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase bg-blue-50 text-blue-700 border border-blue-100">
                                        {order.status?.replace("_", " ")}
                                    </span>
                                </div>
                                <div className="mb-4">
                                    <div className="text-sm font-medium text-slate-800">Delivery Address</div>
                                    <div className="text-sm text-slate-600 mt-0.5 line-clamp-2">{order.shipping_address?.line1}, {order.shipping_address?.city}</div>
                                </div>
                                <div className="flex justify-between items-center mb-4 p-2 bg-slate-50 rounded">
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Amount</span>
                                    <span className="font-bold text-slate-800">₹{order.total_amount} {order.payment_method === "cod" && <span className="text-[10px] bg-amber-100 text-amber-800 px-1 py-0.5 rounded ml-1">COD</span>}</span>
                                </div>
                            </div>
                            <Button 
                                variant="danger" 
                                className="w-full justify-center" 
                                size="sm"
                                onClick={() => {
                                    setSelectedOrderToUnassign(order);
                                    setUnassignModalOpen(true);
                                }}
                            >
                                Force Un-assign
                            </Button>
                        </div>
                    ))}
                </div>
             )}
          </div>
        )}

        {/* Tab Content B: Profile & KYC */}
        {activeTab === "profile-kyc" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <FileText size={20} className="text-slate-400" /> KYC Documents
                    </h2>
                    <StatusBadge status="Verified" type="success" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Aadhaar */}
                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                        <div className="text-sm font-semibold text-slate-700 mb-2">Aadhaar Card</div>
                        <div className="text-xs text-slate-500 mb-3">{partner.aadhaar_number || "Upload Pending"}</div>
                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm" icon={Eye} className="w-full justify-center" onClick={() => handleViewDoc(aadhaarUrl)}>View</Button>
                            <Button variant="outline" size="sm" icon={Download} className="w-full justify-center" onClick={() => handleDownloadDoc(aadhaarUrl)}>DL</Button>
                        </div>
                    </div>
                    {/* PAN */}
                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                        <div className="text-sm font-semibold text-slate-700 mb-2">PAN Card</div>
                        <div className="text-xs text-slate-500 mb-3">{partner.pan_number || "Upload Pending"}</div>
                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm" icon={Eye} className="w-full justify-center" onClick={() => handleViewDoc(panUrl)}>View</Button>
                            <Button variant="outline" size="sm" icon={Download} className="w-full justify-center" onClick={() => handleDownloadDoc(panUrl)}>DL</Button>
                        </div>
                    </div>
                     {/* DL */}
                     <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                        <div className="text-sm font-semibold text-slate-700 mb-2">Driving License</div>
                        <div className="text-xs text-slate-500 mb-3">{partner.dl_number || "Upload Pending"}</div>
                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm" icon={Eye} className="w-full justify-center" onClick={() => handleViewDoc(dlUrl)}>View</Button>
                            <Button variant="outline" size="sm" icon={Download} className="w-full justify-center" onClick={() => handleDownloadDoc(dlUrl)}>DL</Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center mb-4 border-b border-slate-100 pb-2">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <CreditCard size={20} className="text-slate-400" /> Bank Details
                    </h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                        <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Account Holder Name</div>
                        <div className="text-sm font-medium text-slate-900">{partner.bank_name || partner.fullName}</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Account Number</div>
                        <div className="text-sm font-medium text-slate-900">{partner.bank_account || "N/A"}</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 font-semibold uppercase mb-1">IFSC Code</div>
                        <div className="text-sm font-medium text-slate-900">{partner.bank_ifsc || "N/A"}</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Bank Name</div>
                        <div className="text-sm font-medium text-slate-900">HDFC Bank</div>
                    </div>
                </div>
            </div>

          </div>
        )}

        {/* Tab Content C: Ledger & Settlements */}
        {activeTab === "ledger-settlements" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-2">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                   <h2 className="text-lg font-semibold text-slate-800">Financial Ledger</h2>
                   <p className="text-sm text-slate-500">Transaction history and settlements</p>
                </div>
                <Button variant="primary" onClick={() => setIsPayoutModalOpen(true)}>Initiate Payout</Button>
             </div>

             {isLoadingLedger ? (
                 <div className="flex justify-center p-8 text-slate-500"><Loader2 className="animate-spin" /></div>
             ) : (
                 <>
                    <DataTable
                    columns={ledgerColumns}
                    data={ledger}
                    pagination={false}
                    emptyMessage="No transactions found."
                    />

                    {ledger.length > 0 && (
                        <div className="mt-4">
                            <Pagination
                                currentPage={ledgerPagination.page}
                                totalPages={ledgerPagination.totalPages}
                                itemsPerPage={ledgerPagination.limit}
                                totalItems={ledgerPagination.total}
                                onPageChange={(p) => setLedgerPagination(prev => ({...prev, page: p}))}
                                onItemsPerPageChange={(l) => setLedgerPagination(prev => ({...prev, limit: l, page: 1}))}
                            />
                        </div>
                    )}
                </>
             )}
          </div>
        )}

        {/* Tab Content D: History */}
        {activeTab === "history" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-2">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                   <h2 className="text-lg font-semibold text-slate-800">Delivery History</h2>
                   <p className="text-sm text-slate-500">Past orders delivered or cancelled by this partner</p>
                </div>
             </div>

             {isLoadingHistory ? (
                 <div className="flex justify-center p-8 text-slate-500"><Loader2 className="animate-spin" /></div>
             ) : (
                 <>
                    <DataTable
                    columns={historyColumns}
                    data={history}
                    pagination={false}
                    emptyMessage="No historical orders found."
                    />

                    {history.length > 0 && (
                        <div className="mt-4">
                            <Pagination
                                currentPage={historyPagination.page}
                                totalPages={historyPagination.totalPages}
                                itemsPerPage={historyPagination.limit}
                                totalItems={historyPagination.total}
                                onPageChange={(p) => setHistoryPagination(prev => ({...prev, page: p}))}
                                onItemsPerPageChange={(l) => setHistoryPagination(prev => ({...prev, limit: l, page: 1}))}
                            />
                        </div>
                    )}
                </>
             )}
          </div>
        )}
      </div>

      {/* Unassign Modal */}
      <ConfirmationModal
        isOpen={unassignModalOpen}
        onClose={() => setUnassignModalOpen(false)}
        onConfirm={handleUnassign}
        title="Force Un-assign Order"
        message={`Are you sure you want to un-assign order ${selectedOrderToUnassign?.id || selectedOrderToUnassign?.order_number} from ${partner?.fullName}? This will move the order back to the pending pool.`}
        confirmText={isUnassigning ? "Processing..." : "Confirm Un-assign"}
        isLoading={isUnassigning}
      />

      {/* DP Initiate Payout Modal */}
      <DPInitiatePayoutModal 
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        dpId={id}
        totalOwed={partner.uncleared_cod}
        onSuccess={() => setRefreshKey(prev => prev + 1)}
      />
    </div>
  );
};

export default DeliveryPartnerDetail;
