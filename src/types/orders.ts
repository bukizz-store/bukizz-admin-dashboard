export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";
export type PaymentStatus = "paid" | "unpaid" | "refunded";
export type QueryPriority = "high" | "medium" | "low";
export type QueryStatus = "open" | "in_progress" | "resolved";

export interface OrderAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface ProductSnapshot {
  image_url: string;
  color?: string;
  size?: string;
  [key: string]: any;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string;
  sku: string;
  title: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_snapshot: ProductSnapshot;
}

export interface OrderEvent {
  id: string;
  order_id: string;
  previous_status: OrderStatus | null;
  new_status: OrderStatus;
  changed_by: string; // admin uuid
  note?: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  currency: string;
  shipping_address: OrderAddress;
  billing_address: OrderAddress;
  contact_phone: string;
  contact_email: string;
  payment_method: string;
  payment_status: PaymentStatus;
  retailer_id: string;
  created_at: string;
  // Optional expanded fields for UI convenience
  items?: OrderItem[];
  events?: OrderEvent[];
  customer_name?: string; // For display
}

export interface OrderQuery {
  id: string;
  order_id: string;
  user_id: string;
  subject: string;
  message: string;
  priority: QueryPriority;
  status: QueryStatus;
  attachments?: string[]; // Array of URLs
  created_at: string;
  // Optional expanded fields
  order_number?: string; // For display
  customer_name?: string; // For display
  customer_email?: string; // For display
}
