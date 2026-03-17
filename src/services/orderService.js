import api from "./api";

/**
 * Fetch orders for admin order list with filters.
 * Maps to GET /orders/admin/search
 */
export const fetchOrders = async ({
  page = 1,
  limit = 20,
  search = "",
  status = "",
  retailerId = "",
  warehouseId = "",
  city = "",
} = {}) => {
  const params = {
    page,
    limit,
    search: search || undefined,
    status: status && status !== "ALL" ? status : undefined,
    retailerId: retailerId || undefined,
    warehouseId: warehouseId || undefined,
    city: city || undefined,
  };
  // Remove undefined keys so they aren't sent as empty strings
  Object.keys(params).forEach(
    (k) => params[k] === undefined && delete params[k],
  );
  const response = await api.get("/orders/admin/search", { params });
  return response.data;
};

/**
 * Fetch a single order by its order ID (the UUID, not orderNumber).
 * Maps to GET /orders/:orderId
 */
export const fetchAdminOrderById = async (orderId) => {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
};

/**
 * Update order status (admin).
 * Maps to PUT /orders/:orderId/status
 */
export const updateOrderStatus = async (orderId, status, note = "") => {
  const response = await api.put(`/orders/${orderId}/status`, {
    status,
    note: note || `Status updated to ${status} by admin`,
  });
  return response.data;
};

/**
 * Update the status of a single order item.
 * Maps to PUT /orders/:orderId/items/:itemId/status
 */
export const updateOrderItemStatus = async (
  orderId,
  itemId,
  status,
  note = "",
) => {
  const response = await api.put(`/orders/${orderId}/items/${itemId}/status`, {
    status,
    note: note || `Item status updated to ${status} by admin`,
  });
  return response.data;
};

/**
 * Fetch a single order item's warehouse detail.
 * Maps to GET /orders/warehouse/items/:itemId
 */
export const fetchAdminOrderItemById = async (itemId) => {
  const response = await api.get(`/orders/warehouse/items/${itemId}`);
  return response.data;
};

/**
 * Fetch warehouses belonging to a specific retailer.
 * Maps to GET /warehouses/retailer/:retailerId
 */
export const fetchWarehousesByRetailer = async (retailerId) => {
  const response = await api.get(`/warehouses/retailer/${retailerId}`);
  return response.data;
};
