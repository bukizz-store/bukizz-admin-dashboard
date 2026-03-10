import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  Paperclip,
  User,
  ShoppingBag,
  CheckCircle,
  MoreVertical,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  fetchQueryById,
  addQueryReply,
  updateQueryStatus,
} from "../../services/queryService";
import { Button } from "../../components/ui";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ─── Component ────────────────────────────────────────────────────────────────

const QueryResolutionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [query, setQuery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // ── Fetch Detail ──────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchQueryById(id);
        // console.log("Query Data:", res.data);
        setQuery(res.data);
      } catch (err) {
        console.error("Failed to fetch query:", err);
        setError("Failed to load ticket details.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // ── Send Reply ────────────────────────────────────────────────────────────

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await addQueryReply(id, { message: replyText, attachments: [] });
      // Optimistically append reply to thread
      setQuery((prev) => ({
        ...prev,
        thread: [
          ...(prev.thread || []),
          {
            sender: "admin",
            message: replyText,
            createdAt: new Date().toISOString(),
            attachments: [],
          },
        ],
      }));
      setReplyText("");
    } catch (err) {
      console.error("Failed to send reply:", err);
      alert("Failed to send reply. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // ── Update Status ─────────────────────────────────────────────────────────

  const handleResolve = async () => {
    if (
      !window.confirm("Are you sure you want to mark this ticket as resolved?")
    )
      return;
    setStatusUpdating(true);
    try {
      await updateQueryStatus(id, "resolved");
      setQuery((prev) => ({ ...prev, status: "resolved" }));
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update ticket status. Please try again.");
    } finally {
      setStatusUpdating(false);
    }
  };

  // ── Loading / Error / Not Found ───────────────────────────────────────────

  if (loading)
    return (
      <div className="flex items-center justify-center p-20 text-slate-500 font-medium gap-3">
        <RefreshCw className="h-5 w-5 animate-spin text-bukizz-orange" />
        Loading ticket details...
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <AlertCircle className="h-10 w-10 text-red-300 mb-3" />
        <p className="text-red-600 font-medium mb-4">{error}</p>
        <Button
          variant="outline"
          onClick={() => navigate("/orderqueries")}
        >
          Back to Queries
        </Button>
      </div>
    );

  if (!query)
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <h2 className="text-xl font-bold text-slate-800">Ticket not found</h2>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/orderqueries")}
        >
          Back to Queries
        </Button>
      </div>
    );

  // ── Derived Data ──────────────────────────────────────────────────────────

  const priority = (query.priority || "").toLowerCase();
  const status = (query.status || "").toLowerCase();
  const customer = query.customer || {};
  const order = query.order || {};
  const thread = query.thread || [];

  const priorityStyles = {
    high: "bg-red-100 text-red-700",
    medium: "bg-orange-100 text-orange-700",
    low: "bg-blue-100 text-blue-700",
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#F8F9FC]">
      {/* Left Panel - Ticket View */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200 bg-white shadow-xl shadow-slate-200/50 z-10 m-4 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/orderqueries")}
              className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Ticket {query.ticketId || `#${id.slice(0, 8)}`}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${priorityStyles[priority] || "bg-slate-100 text-slate-600"}`}
                >
                  {query.priority}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${status === "resolved" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}
                >
                  {query.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                {query.subject}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {status !== "resolved" && (
              <Button
                variant="outline"
                className="border-green-200 text-green-700 hover:bg-green-50 font-bold text-xs uppercase tracking-wide"
                icon={CheckCircle}
                onClick={handleResolve}
                disabled={statusUpdating}
              >
                {statusUpdating ? "Updating…" : "Mark Resolved"}
              </Button>
            )}
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Content — Thread */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#F8F9FC]">
          {thread.map((msg, idx) => {
            const isAdmin = msg.sender === "admin";
            return (
              <div key={idx} className={`flex gap-5 max-w-4xl ${isAdmin ? "ml-auto flex-row-reverse" : ""}`}>
                {/* Avatar */}
                {isAdmin ? (
                  <div className="w-10 h-10 rounded-full bg-bukizz-orange flex items-center justify-center text-white shrink-0 shadow-md shadow-orange-200">
                    <span className="font-bold text-xs">ME</span>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-sm">
                    <User size={20} />
                  </div>
                )}

                {/* Bubble */}
                <div className="flex-1 space-y-2">
                  <div className={`flex items-baseline justify-between ${isAdmin ? "flex-row-reverse" : ""}`}>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {isAdmin ? "You" : customer.name || "Customer"}
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">
                      {formatDateTime(msg.createdAt)}
                    </span>
                  </div>
                  <div
                    className={`p-6 rounded-2xl border text-slate-700 text-sm leading-relaxed shadow-sm ${
                      isAdmin
                        ? "bg-orange-50 border-orange-200 rounded-tr-none"
                        : "bg-white border-slate-200 rounded-tl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                  </div>

                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex gap-2">
                      {msg.attachments.map((att, aIdx) => (
                        <div
                          key={aIdx}
                          className="w-20 h-20 bg-white border border-slate-200 rounded-lg overflow-hidden cursor-pointer hover:border-orange-300"
                        >
                          <img
                            src={att}
                            alt={`Attachment ${aIdx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.parentElement.innerHTML = `<span class="flex items-center justify-center w-full h-full text-xs text-slate-400">File ${aIdx + 1}</span>`;
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Reply composer */}
          <div className="flex gap-5 pt-4 max-w-4xl">
            <div className="w-10 h-10 rounded-full bg-bukizz-orange flex items-center justify-center text-white shrink-0 shadow-md shadow-orange-200">
              <span className="font-bold text-xs">ME</span>
            </div>
            <div className="flex-1">
              <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-orange-100 focus-within:border-bukizz-orange transition-all">
                <textarea
                  className="w-full p-4 bg-transparent border-none focus:ring-0 text-sm min-h-[140px] resize-none"
                  placeholder="Type your reply here... (Markdown supported)"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
                      <Paperclip size={18} />
                    </button>
                  </div>
                  <Button
                    variant="primary"
                    icon={Send}
                    className="bg-bukizz-orange hover:bg-orange-600 text-white shadow-md shadow-orange-100 font-bold px-6"
                    disabled={!replyText.trim() || sending}
                    onClick={handleSendReply}
                  >
                    {sending ? "Sending…" : "Send Reply"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Context View */}
      <div className="w-[360px] bg-[#F8F9FC] flex flex-col shrink-0 p-4 space-y-6 overflow-y-auto">
        {/* Order Context Card */}
        {order.orderNumber && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                Related Order
              </h3>
              <span
                className="text-xs font-bold text-orange-500 cursor-pointer hover:underline"
                onClick={() => {
                  // order.id might not be in response, so we show order number
                }}
              >
                View Order
              </span>
            </div>

            <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                <ShoppingBag size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {order.orderNumber}
                </p>
                <p className="text-xs text-slate-500">
                  Total: {formatCurrency(order.total)}
                </p>
              </div>
            </div>

            {/* Order Items */}
            {order.items && order.items.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-900">
                  Items in this Order
                </p>
                {order.items.slice(0, 3).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex gap-3 items-center group cursor-pointer"
                  >
                    {item.image ? (
                      <div className="w-8 h-8 rounded-md bg-white border border-slate-200 p-0.5 flex items-center justify-center overflow-hidden">
                        <img
                          src={item.image}
                          className="w-full h-full object-contain"
                          alt={item.title || "Item"}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center">
                        <ShoppingBag size={14} className="text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate group-hover:text-orange-600 transition-colors">
                        {item.title || item.name || `Item ${idx + 1}`}
                      </p>
                      {item.quantity && (
                        <p className="text-[10px] text-slate-400">
                          Qty: {item.quantity}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <p className="text-xs text-slate-400">
                    +{order.items.length - 3} more items
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Customer Context Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">
            Customer Details
          </h3>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-100">
              {(customer.name || "?").charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                {customer.name || "—"}
              </p>
              <p className="text-xs text-slate-400">
                Joined {formatDate(customer.joinedAt)}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                Email
              </p>
              <p className="text-sm font-medium text-slate-700">
                {customer.email || "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                Total Orders
              </p>
              <p className="text-sm font-medium text-slate-700">
                {customer.totalOrders ?? "—"} Orders
                {customer.lifetimeValue != null && (
                  <> (Lifetime Value: {formatCurrency(customer.lifetimeValue)})</>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueryResolutionPage;
