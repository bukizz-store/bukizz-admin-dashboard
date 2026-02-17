import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  Paperclip,
  User,
  ShoppingBag,
  CreditCard,
  ExternalLink,
  Clock,
  MoreVertical,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  mockOrderQueries,
  mockOrders,
  mockOrderItems,
} from "../../data/mockData";
import { Button, Tooltip } from "../../components/ui";

const QueryResolutionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(null);
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const foundQuery = mockOrderQueries.find((q) => q.id === id);
      if (foundQuery) {
        setQuery(foundQuery);
        const foundOrder = mockOrders.find((o) => o.id === foundQuery.order_id);
        if (foundOrder) {
          setOrder(foundOrder);
          setOrderItems(
            mockOrderItems.filter((i) => i.order_id === foundOrder.id),
          );
        }
      }
      setLoading(false);
    }, 500);
  }, [id]);

  const handleResolve = () => {
    if (
      window.confirm("Are you sure you want to mark this ticket as resolved?")
    ) {
      setQuery((prev) => ({ ...prev, status: "resolved" }));
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center p-20 text-slate-500 font-medium">
        Loading ticket details...
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

  const priorityStyles = {
    high: "bg-red-100 text-red-700",
    medium: "bg-orange-100 text-orange-700",
    low: "bg-blue-100 text-blue-700",
  };

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
                  Ticket #{query.id}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${priorityStyles[query.priority]}`}
                >
                  {query.priority}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${query.status === "resolved" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}
                >
                  {query.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Last updated {new Date(query.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {query.status !== "resolved" && (
              <Button
                variant="outline"
                className="border-green-200 text-green-700 hover:bg-green-50 font-bold text-xs uppercase tracking-wide"
                icon={CheckCircle}
                onClick={handleResolve}
              >
                Mark Resolved
              </Button>
            )}
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#F8F9FC]">
          {/* Customer Message Bubble */}
          <div className="flex gap-5 max-w-4xl">
            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-sm">
              <User size={20} />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-baseline justify-between">
                <h3 className="font-bold text-slate-900 text-sm">
                  {query.customer_name}
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  {new Date(query.created_at).toLocaleString()}
                </span>
              </div>
              <div className="bg-white p-6 rounded-2xl rounded-tl-none border border-slate-200 text-slate-700 text-sm leading-relaxed shadow-sm">
                <p className="font-bold text-slate-900 mb-3 text-base">
                  {query.subject}
                </p>
                <p className="text-slate-600">{query.message}</p>
              </div>
              {/* Attachments (Mock) */}
              <div className="flex gap-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-20 h-20 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-400 cursor-pointer hover:border-orange-300"
                  >
                    Img {i}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Admin Reply Area (Sticky Bottom or Just at end) */}
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
                    disabled={!replyText.trim()}
                    onClick={() => {
                      alert("Reply sent! (Mock)");
                      setReplyText("");
                    }}
                  >
                    Send Reply
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
        {order && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                Related Order
              </h3>
              <span
                className="text-xs font-bold text-orange-500 cursor-pointer hover:underline"
                onClick={() => navigate(`/orders/${order.id}`)}
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
                  {order.order_number}
                </p>
                <p className="text-xs text-slate-500">
                  Total: ₹{order.total_amount}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-900">
                Items in this Ticket
              </p>
              {orderItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 items-center group cursor-pointer"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <div className="w-8 h-8 rounded-md bg-white border border-slate-200 p-0.5 flex items-center justify-center">
                    <img
                      src={item.product_snapshot.image_url}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate group-hover:text-orange-600 transition-colors">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Qty: {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customer Context Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">
            Customer Details
          </h3>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-100">
              {query.customer_name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                {query.customer_name}
              </p>
              <p className="text-xs text-slate-400">Joined Oct 2023</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                Email
              </p>
              <p className="text-sm font-medium text-slate-700">
                {query.customer_email}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                Total Orders
              </p>
              <p className="text-sm font-medium text-slate-700">
                12 Orders (Lifetime Value: ₹45,200)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueryResolutionPage;
