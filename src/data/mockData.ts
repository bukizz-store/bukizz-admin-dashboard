import {
  Order,
  OrderItem,
  OrderEvent,
  OrderQuery,
  OrderStatus,
  PaymentStatus,
  QueryPriority,
  QueryStatus,
} from "../types/orders";

// Helper to generate UUIDs (simplified)
const generateId = () => Math.random().toString(36).substr(2, 9);
const generateTicketId = (i: number) => `TK-${1280 + i}`; // Sequential for demo
const generateOrderId = (i: number) => `ORD-${9900 - i}`; // Sequential for demo

// Helper to get random item from array
const random = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Helper to get random date within last X days
const randomDate = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * days));
  return date.toISOString();
};

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];
const PAYMENT_STATUSES: PaymentStatus[] = ["paid", "unpaid", "refunded"];
const NAMES = [
  "John Doe",
  "Jane Smith",
  "Alice Johnson",
  "Bob Brown",
  "Charlie Davis",
  "Eva Wilson",
];
const CITIES = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"];

// 1. Generate Orders
export const mockOrders: Order[] = Array.from({ length: 15 }).map((_, i) => {
  const status = random(ORDER_STATUSES);
  const paymentStatus =
    status === "cancelled" ? "refunded" : random(PAYMENT_STATUSES);
  const createdAt = randomDate(30);

  return {
    id: generateId(),
    order_number: `ORD-${2024000 + i}`,
    user_id: generateId(),
    status,
    total_amount: Math.floor(Math.random() * 5000) + 500,
    currency: "INR",
    shipping_address: {
      street: `${Math.floor(Math.random() * 999)} Main St`,
      city: random(CITIES),
      state: "State",
      zip: "10001",
      country: "India",
    },
    billing_address: {
      street: `${Math.floor(Math.random() * 999)} Main St`,
      city: random(CITIES),
      state: "State",
      zip: "10001",
      country: "India",
    },
    contact_phone: "+91 9876543210",
    contact_email: `customer${i}@example.com`,
    payment_method: random(["Credit Card", "UPI", "Net Banking", "COD"]),
    payment_status: paymentStatus,
    retailer_id: generateId(),
    created_at: createdAt,
    customer_name: random(NAMES),
  };
});

// 2. Generate Order Items
export const mockOrderItems: OrderItem[] = mockOrders.flatMap((order) => {
  const numItems = Math.floor(Math.random() * 3) + 1;
  return Array.from({ length: numItems })
    .map(() => ({
      id: generateId(),
      order_id: order.id,
      product_id: generateId(),
      variant_id: generateId(),
      sku: `SKU-${Math.floor(Math.random() * 1000)}`,
      title: `Product ${Math.floor(Math.random() * 100)}`,
      quantity: Math.floor(Math.random() * 5) + 1,
      unit_price: Math.floor(Math.random() * 1000) + 100,
      total_price: 0, // Calculated below
      product_snapshot: {
        image_url: "https://via.placeholder.com/150",
        color: random(["Red", "Blue", "Green", "Black"]),
        size: random(["S", "M", "L", "XL"]),
      },
    }))
    .map((item) => ({
      ...item,
      total_price: item.unit_price * item.quantity,
    }));
});

// 3. Generate Order Events
export const mockOrderEvents: OrderEvent[] = mockOrders.flatMap((order) => {
  const events: OrderEvent[] = [];

  // Created event
  events.push({
    id: generateId(),
    order_id: order.id,
    previous_status: null,
    new_status: "pending",
    changed_by: "system",
    note: "Order placed successfully",
    created_at: order.created_at,
  });

  if (order.status !== "pending") {
    events.push({
      id: generateId(),
      order_id: order.id,
      previous_status: "pending",
      new_status: "processing",
      changed_by: "admin_1",
      note: "Payment verified",
      created_at: new Date(
        new Date(order.created_at).getTime() + 3600000,
      ).toISOString(),
    });
  }

  if (["shipped", "delivered"].includes(order.status)) {
    events.push({
      id: generateId(),
      order_id: order.id,
      previous_status: "processing",
      new_status: "shipped",
      changed_by: "admin_1",
      note: "Order shipped via Fedex",
      created_at: new Date(
        new Date(order.created_at).getTime() + 86400000,
      ).toISOString(),
    });
  }

  if (order.status === "delivered") {
    events.push({
      id: generateId(),
      order_id: order.id,
      previous_status: "shipped",
      new_status: "delivered",
      changed_by: "courier",
      note: "Delivered to recipient",
      created_at: new Date(
        new Date(order.created_at).getTime() + 172800000,
      ).toISOString(),
    });
  }

  return events;
});

// 4. Generate Order Queries
const QUERY_SUBJECTS = [
  "Where is my order?",
  "Wrong item received",
  "Change shipping address",
  "Payment issue",
  "Return request",
];
const QUERY_PRIORITIES: QueryPriority[] = ["high", "medium", "low"];
const QUERY_STATUSES: QueryStatus[] = ["open", "in_progress", "resolved"];

export const mockOrderQueries: OrderQuery[] = Array.from({ length: 42 }).map(
  (_, i) => {
    const order = random(mockOrders);
    const orderNumber = generateOrderId(i); // Use sequential order ID for demo

    return {
      id: generateTicketId(i),
      order_id: order.id,
      user_id: order.user_id,
      subject: random(QUERY_SUBJECTS),
      message:
        "I have an issue with my order. Please help me resolve it as soon as possible.",
      priority: random(QUERY_PRIORITIES),
      status: random(QUERY_STATUSES),
      created_at: randomDate(10),
      order_number: orderNumber,
      customer_name: order.customer_name,
      customer_email: order.contact_email,
    };
  },
);
