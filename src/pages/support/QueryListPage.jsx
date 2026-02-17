import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  AlertCircle,
  Clock,
  CheckCircle,
  MoreHorizontal,
} from "lucide-react";
import { mockOrderQueries } from "../../data/mockData";
import { DataTable } from "../../components/common";
import { Button } from "../../components/ui";

const QueryListPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all"); // all, open, resolved
  const [queries, setQueries] = useState([]);
  const [filteredQueries, setFilteredQueries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Stats Data (Mocked for UI matching)
  const stats = {
    unassigned: 12,
    avgResponse: "1.4h",
    resolvedToday: 28,
  };

  useEffect(() => {
    // Simulate Fetch
    const sorted = [...mockOrderQueries].sort((a, b) => {
      // Sort by Priority (High > Medium > Low)
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      // Then by Date (Newest first)
      return new Date(b.created_at) - new Date(a.created_at);
    });
    setQueries(sorted);
    setFilteredQueries(sorted);
  }, []);

  useEffect(() => {
    let result = queries;

    // Filter by Tab
    if (activeTab === "open") {
      result = result.filter((q) => q.status !== "resolved");
    } else if (activeTab === "resolved") {
      result = result.filter((q) => q.status === "resolved");
    }

    // Filter by Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (q) =>
          q.subject.toLowerCase().includes(lower) ||
          q.order_number?.toLowerCase().includes(lower) ||
          q.id.toLowerCase().includes(lower),
      );
    }

    setFilteredQueries(result);
  }, [activeTab, searchTerm, queries]);

  const columns = [
    {
      header: "TICKET ID",
      accessor: "id",
      className: "w-[120px]",
      render: (row) => (
        <span
          className="font-bold text-slate-900 cursor-pointer hover:text-bukizz-orange"
          onClick={() => navigate(`/orderqueries/${row.id}`)}
        >
          #{row.id}
        </span>
      ),
    },
    {
      header: "SUBJECT",
      accessor: "subject",
      className: "w-[300px]",
      render: (row) => (
        <div
          onClick={() => navigate(`/orderqueries/${row.id}`)}
          className="cursor-pointer group"
        >
          <div className="font-bold text-slate-900 group-hover:text-bukizz-orange transition-colors">
            {row.subject}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Customer: {row.customer_name}
          </div>
        </div>
      ),
    },
    {
      header: "ORDER #",
      accessor: "order_number",
      render: (row) => (
        <span
          className="font-bold text-orange-500 hover:text-orange-600 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/orders/${row.order_id}`);
          }}
        >
          {row.order_number}
        </span>
      ),
    },
    {
      header: "PRIORITY",
      accessor: "priority",
      render: (row) => {
        const styles = {
          high: "bg-red-100 text-red-700",
          medium: "bg-orange-100 text-orange-700",
          low: "bg-blue-100 text-blue-700",
        };
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${styles[row.priority]}`}
          >
            {row.priority}
          </span>
        );
      },
    },
    {
      header: "STATUS",
      accessor: "status",
      render: (row) => {
        const styles = {
          open: "text-slate-700",
          in_progress: "text-slate-700",
          resolved: "text-green-600",
        };
        return (
          <span
            className={`text-sm font-medium capitalize ${styles[row.status]}`}
          >
            {row.status === "in_progress" ? "In Progress" : row.status}
          </span>
        );
      },
    },
    {
      header: "CREATED AT",
      accessor: "created_at",
      className: "text-right",
      render: (row) => {
        const date = new Date(row.created_at);
        return (
          <span className="text-sm text-slate-500">
            {date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
            ,{" "}
            {date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        );
      },
    },
  ];

  return (
    <div className="p-8 bg-[#F8F9FC] min-h-screen font-sans">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        {/* Search */}
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-bukizz-orange transition-colors" />
          <input
            type="text"
            placeholder="Search by Ticket ID or Order #..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-bukizz-orange transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4">
          {/* Notif Bell Placeholder */}
          <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#F8F9FC]"></span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
          </button>

          <Button className="bg-bukizz-orange hover:bg-orange-600 text-white font-bold px-6 py-2.5 shadow-md shadow-orange-200">
            <Plus size={18} className="mr-2" />
            New Ticket
          </Button>
        </div>
      </div>

      {/* Title & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            Support Queries
          </h1>
          <p className="text-slate-500 text-sm">
            Manage and respond to customer order inquiries
          </p>
        </div>

        <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
          {["all", "open", "resolved"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-1.5 text-sm font-semibold rounded-md transition-all ${
                activeTab === tab
                  ? "bg-bukizz-orange text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <DataTable
          columns={columns}
          data={filteredQueries}
          pagination
          itemsPerPage={8} // Matches designs usually showing fewer items but clearer
          onRowClick={(row) => navigate(`/orderqueries/${row.id}`)}
        />
      </div>

      {/* Bottom Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Unassigned Tickets */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              Unassigned Tickets
            </p>
            <p className="text-3xl font-bold text-orange-500 mt-1">
              {stats.unassigned}
            </p>
          </div>
        </div>

        {/* Avg First Response */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              Avg. First Response
            </p>
            <p className="text-3xl font-bold text-orange-500 mt-1">
              {stats.avgResponse}
            </p>
          </div>
        </div>

        {/* Resolved Today */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Resolved Today</p>
            <p className="text-3xl font-bold text-orange-500 mt-1">
              {stats.resolvedToday}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueryListPage;
