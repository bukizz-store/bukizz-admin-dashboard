import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Eye,
  Download,
  Search,
  Filter,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { DataTable, Pagination, StatusBadge } from "../../components/common";
import { Button, Tooltip } from "../../components/ui";
import { mockOrders } from "../../data/mockData";

const OrderListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Load Data
  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      setOrders(mockOrders);
      setFilteredOrders(mockOrders);
      setLoading(false);
    }, 500);
  }, []);

  // Filter Logic
  useEffect(() => {
    let result = orders;

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(
        (order) =>
          order.order_number.toLowerCase().includes(lowerTerm) ||
          order.customer_name.toLowerCase().includes(lowerTerm) ||
          order.contact_email.toLowerCase().includes(lowerTerm),
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(result);
    setCurrentPage(1); // Reset to first page on filter change
  }, [searchTerm, statusFilter, orders]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Stats Calculation
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    revenue: orders
      .filter((o) => o.payment_status === "paid")
      .reduce((acc, curr) => acc + curr.total_amount, 0),
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  const columns = [
    {
      header: "Order #",
      accessor: "order_number",
      render: (row) => (
        <span
          className="font-semibold text-bukizz-navy hover:text-bukizz-orange cursor-pointer"
          onClick={() => navigate(`/orders/${row.id}`)}
        >
          {row.order_number}
        </span>
      ),
    },
    {
      header: "Customer",
      accessor: "customer_name",
      render: (row) => (
        <div>
          <div className="font-medium text-slate-900">{row.customer_name}</div>
          <div className="text-xs text-slate-500">{row.contact_email}</div>
        </div>
      ),
    },
    {
      header: "Date",
      accessor: "created_at",
      render: (row) => (
        <span className="text-sm text-slate-600">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => {
        const styles = {
          pending: "bg-yellow-100 text-yellow-800",
          processing: "bg-blue-100 text-blue-800",
          shipped: "bg-purple-100 text-purple-800",
          delivered: "bg-green-100 text-green-800",
          cancelled: "bg-red-100 text-red-800",
        };
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${styles[row.status] || "bg-gray-100"}`}
          >
            {row.status}
          </span>
        );
      },
    },
    {
      header: "Payment",
      accessor: "payment_status",
      render: (row) => {
        const styles = {
          paid: "text-green-600 bg-green-50",
          unpaid: "text-yellow-600 bg-yellow-50",
          refunded: "text-slate-500 bg-slate-100 line-through",
        };
        return (
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium border border-transparent ${styles[row.payment_status]}`}
          >
            {row.payment_status}
          </span>
        );
      },
    },
    {
      header: "Total",
      accessor: "total_amount",
      render: (row) => (
        <span className="font-bold text-slate-900">
          ₹{row.total_amount.toLocaleString()}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Tooltip content="View Details">
            <button
              onClick={() => navigate(`/orders/${row.id}`)}
              className="p-1.5 text-slate-400 hover:text-bukizz-orange hover:bg-orange-50 rounded transition-colors"
            >
              <Eye size={18} />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-bukizz-bg min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-bukizz-navy">
            Order Management
          </h1>
          <p className="text-sm text-slate-500">
            Track and manage customer orders
          </p>
        </div>
        <Button variant="outline" icon={Download}>
          Export Orders
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Orders"
          value={stats.total}
          icon={ShoppingBag}
          color="bg-blue-500"
        />
        <StatsCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          color="bg-yellow-500"
        />
        <StatsCard
          title="Total Revenue"
          value={`₹${stats.revenue.toLocaleString()}`}
          icon={CheckCircle}
          color="bg-green-500"
        />
        <StatsCard
          title="Cancelled/Returned"
          value={stats.cancelled}
          icon={XCircle}
          color="bg-red-500"
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by Order #, Email, or Name..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-bukizz-orange/20 focus:border-bukizz-orange transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          <select
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-bukizz-orange"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {/* Add more filters here like Date Range if needed */}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={paginatedOrders}
          isLoading={loading}
          onRowClick={(row) => navigate(`/orders/${row.id}`)}
          pagination={false} // We handle pagination externally underneath
        />
        {/* Pagination Footer */}
        {!loading && (
          <div className="border-t border-slate-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={filteredOrders.length}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const StatsCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
        {title}
      </p>
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
    </div>
    <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
      <Icon className={`w-6 h-6 ${color.replace("bg-", "text-")}`} />
    </div>
  </div>
);

export default OrderListPage;
