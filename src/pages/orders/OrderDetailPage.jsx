import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  Truck,
  Mail,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  User,
  MapPin,
  CreditCard,
  Edit,
  ChevronDown,
  Package,
  Phone,
} from "lucide-react";
import {
  mockOrders,
  mockOrderItems,
  mockOrderEvents,
  mockOrderQueries,
} from "../../data/mockData";
import { Button, Tooltip } from "../../components/ui";

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeQuery, setActiveQuery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeItemId, setActiveItemId] = useState(null);

  useEffect(() => {
    if (items.length > 0 && !activeItemId) {
      setActiveItemId(items[0].id);
    }
  }, [items, activeItemId]);

  useEffect(() => {
    setLoading(true);
    // Simulate Fetch
    setTimeout(() => {
      const foundOrder = mockOrders.find((o) => o.id === id);
      if (foundOrder) {
        setOrder(foundOrder);
        setItems(mockOrderItems.filter((i) => i.order_id === id));
        setEvents(
          mockOrderEvents
            .filter((e) => e.order_id === id)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
        );

        // Check for active queries
        const query = mockOrderQueries.find(
          (q) => q.order_id === id && q.status !== "resolved",
        );
        setActiveQuery(query);
      }
      setLoading(false);
    }, 500);
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-slate-700">Order not found</h2>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/orders")}
        >
          Back to Orders
        </Button>
      </div>
    );
  }

  // Handle image error
  const handleImageError = (e) => {
    e.target.src = "https://via.placeholder.com/150?text=No+Image";
  };

  const statusStyles = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-orange-100 text-orange-800",
    shipped: "bg-blue-100 text-blue-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  // Logic to determine main item (for now default to first, later could be via URL param)

  const activeItem = items.find((i) => i.id === activeItemId) || items[0];
  const otherItems = items.filter((i) => i.id !== activeItem?.id);

  return (
    <div className="p-6 bg-[#F8F9FC] min-h-screen font-sans">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6 font-medium">
        <span
          className="cursor-pointer hover:text-bukizz-navy"
          onClick={() => navigate("/")}
        >
          Dashboard
        </span>
        <span className="text-slate-300">/</span>
        <span
          className="cursor-pointer hover:text-bukizz-navy"
          onClick={() => navigate("/orders")}
        >
          Orders
        </span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-400">#{order.order_number}</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-semibold">Item Detail</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-slate-900">
            Order #{order.order_number}
          </h1>
          <span
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${statusStyles[order.status] || "bg-gray-100"}`}
          >
            {order.status}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            icon={Mail}
            className="bg-white text-slate-600 border-slate-200 shadow-sm hover:bg-slate-50 font-semibold"
          >
            Contact Customer
          </Button>
          <Button
            variant="outline"
            icon={Printer}
            className="bg-white text-slate-600 border-slate-200 shadow-sm hover:bg-slate-50 font-semibold"
          >
            Print Invoice
          </Button>
          <Button
            variant="primary"
            icon={Truck}
            className="bg-bukizz-orange hover:bg-orange-600 text-white border-transparent shadow-md shadow-orange-100 font-bold px-6"
          >
            Ship Item
          </Button>
        </div>
      </div>

      {/* Alert Banner */}
      {activeQuery && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-8 flex items-start sm:items-center gap-4 shadow-sm">
          <div className="p-2.5 bg-red-100 rounded-lg shrink-0">
            <AlertCircle className="text-red-500 w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-red-900 font-bold text-sm mb-1">
              Open Query for this Item
            </h3>
            <p className="text-red-700 text-sm font-medium">
              Subject: "{activeQuery.subject}"
            </p>
          </div>
          <button
            onClick={() => navigate(`/orderqueries/${activeQuery.id}`)}
            className="text-sm font-bold text-red-600 hover:text-red-800 underline decoration-2 underline-offset-2 whitespace-nowrap"
          >
            View Item Query #{activeQuery.id.slice(0, 7).toUpperCase()}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Main) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main Item Card */}
          {activeItem && (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Item Information
                </h3>
                <div className="bg-slate-100 px-3 py-1.5 rounded-md text-xs font-mono font-semibold text-slate-500">
                  ID: {activeItem.sku.split("-")[1] || "ITM-001"}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-8">
                {/* Product Image */}
                <div className="w-full sm:w-56 aspect-3/4 bg-slate-50 rounded-xl shrink-0 border border-slate-100 p-6 flex items-center justify-center group">
                  <img
                    src={activeItem.product_snapshot.image_url}
                    alt={activeItem.title}
                    onError={handleImageError}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-sm"
                  />
                </div>

                {/* Product Details */}
                <div className="flex-1 flex flex-col pt-2">
                  <div className="mb-6">
                    <span className="inline-block text-[10px] font-extrabold text-orange-500 uppercase tracking-widest mb-2">
                      TEXTBOOKS
                    </span>
                    <h4 className="text-2xl font-bold text-slate-900 mb-3 leading-tight">
                      {activeItem.title}
                    </h4>
                    <p className="text-slate-500 text-sm leading-relaxed max-w-lg">
                      Standard Edition 2023. Includes all core subjects as per
                      the latest CBSE curriculum. High-quality paper with
                      colored illustrations.
                      {activeItem.product_snapshot.color &&
                        ` Color: ${activeItem.product_snapshot.color}.`}
                      {activeItem.product_snapshot.size &&
                        ` Size: ${activeItem.product_snapshot.size}.`}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-8 mb-8">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                        SKU Number
                      </p>
                      <p className="text-sm font-bold text-slate-900 font-mono">
                        {activeItem.sku}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                        Quantity
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {activeItem.quantity} Units
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                        Unit Price
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        ₹{activeItem.unit_price.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-100">
                    <span className="text-sm text-slate-500 font-semibold">
                      Line Total (Incl. Taxes)
                    </span>
                    <span className="text-3xl font-bold text-orange-500 tracking-tight">
                      ₹{activeItem.total_price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activity History */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-8">
              Item Activity History
            </h3>

            <div className="relative pl-3">
              {/* Vertical Dashed Line */}
              <div className="absolute left-4.75 top-3 bottom-0 w-px border-l-2 border-dashed border-slate-200" />

              <div className="space-y-10">
                {events.map((event, idx) => (
                  <div
                    key={event.id}
                    className="relative flex gap-6 items-start group"
                  >
                    {/* Icon Bubble */}
                    <div
                      className={`z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm ${
                        idx === 0
                          ? "bg-orange-500 text-white shadow-orange-100"
                          : "bg-green-50 text-green-500"
                      }`}
                    >
                      {event.new_status === "pending" ||
                      event.new_status === "processing" ? (
                        <RefreshCw
                          size={16}
                          className={idx === 0 ? "animate-spin-slow" : ""}
                        />
                      ) : event.new_status === "shipped" ? (
                        <Truck size={16} />
                      ) : (
                        <CheckCircle size={18} />
                      )}
                    </div>

                    <div className="pt-2">
                      <h4 className="text-base font-bold text-slate-900">
                        {event.new_status === "pending"
                          ? "Item Reserved"
                          : event.new_status === "processing"
                            ? "Order Processing"
                            : event.new_status === "shipped"
                              ? "Handed to Logistics"
                              : `Order ${event.new_status.charAt(0).toUpperCase() + event.new_status.slice(1)}`}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium mt-1 flex items-center gap-2">
                        {new Date(event.created_at).toLocaleString()}
                      </p>

                      {idx === 0 && (
                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          <span className="text-xs font-semibold text-slate-600">
                            Stock Lock #SL-102
                          </span>
                        </div>
                      )}

                      {event.changed_by !== "system" && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-5 h-5 rounded-full bg-slate-200 overflow-hidden">
                            <User size={20} className="mt-1 text-slate-400" />
                          </div>
                          <span className="text-xs text-slate-500 font-medium">
                            Verified by {event.changed_by}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Other Items Section */}
          {otherItems.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6">
                Other Items in this Order
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {otherItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setActiveItemId(item.id)}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4 cursor-pointer hover:border-orange-300 hover:shadow-md transition-all group"
                  >
                    <div className="w-16 h-16 bg-slate-100 rounded-lg shrink-0 flex items-center justify-center p-2 border border-slate-100 group-hover:border-orange-100">
                      <img
                        src={item.product_snapshot.image_url}
                        alt={item.title}
                        onError={handleImageError}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm line-clamp-2">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Qty: {item.quantity} • ₹{item.unit_price}
                      </p>
                      <span
                        className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                          order.status === "shipped" ||
                          order.status === "delivered"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
          {/* Manage Item Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-6">
              Manage Item
            </h3>

            <div className="mb-6">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2 block">
                Update Item Status
              </label>
              <div className="relative group">
                <select
                  className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 font-semibold transition-all cursor-pointer hover:border-slate-300"
                  defaultValue={order.status}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none group-hover:text-slate-600 transition-colors" />
              </div>
            </div>

            <button className="w-full bg-bukizz-orange hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl shadow-md shadow-orange-100 hover:shadow-orange-200 transition-all text-sm transform active:scale-[0.98]">
              Update Item
            </button>
          </div>

          {/* Warehouse Details (New) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-6">
              Warehouse Details
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-100">
                  <Package size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Gurugram Central
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">WH-GGN-001</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 border border-slate-100">
                <p>
                  <span className="font-bold">Zone:</span> A-12 •{" "}
                  <span className="font-bold">Bin:</span> 44
                </p>
                <p className="mt-1">
                  <span className="font-bold">Picker:</span> Rajesh Kumar
                </p>
              </div>
            </div>
          </div>

          {/* Customer Info Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-6">
              Customer Info
            </h3>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-lg border border-orange-100 shrink-0">
                {order.customer_name.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-slate-900 text-base">
                  {order.customer_name}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Member since 2021
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 group cursor-pointer">
                <Mail
                  size={16}
                  className="text-orange-400 shrink-0 group-hover:scale-110 transition-transform"
                />
                <span className="text-sm text-slate-600 font-medium group-hover:text-bukizz-orange transition-colors">
                  {order.contact_email}
                </span>
              </div>
              <div className="flex items-center gap-3 group cursor-pointer">
                <Phone
                  size={16}
                  className="text-orange-400 shrink-0 group-hover:scale-110 transition-transform"
                />
                <span className="text-sm text-slate-600 font-medium group-hover:text-bukizz-orange transition-colors">
                  {order.contact_phone}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Address Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                Shipping Address
              </h3>
              <button className="text-[10px] font-bold text-orange-600 hover:text-orange-700 uppercase tracking-wider hover:underline decoration-2 underline-offset-2">
                Edit
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                <span className="block mb-1 text-slate-900 font-bold">
                  {order.shipping_address.street}
                </span>
                {order.shipping_address.city}, {order.shipping_address.state},
                <br />
                {order.shipping_address.zip}
                <br />
                {order.shipping_address.country}
              </p>
            </div>
          </div>

          {/* Payment Info Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-6">
              Payment Info
            </h3>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-orange-500 border border-slate-100">
                  <CreditCard size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {order.payment_method}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    TXN: {order.id.split("-")[1] || "BKP-8821"}
                  </div>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  order.payment_status === "paid"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {order.payment_status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
