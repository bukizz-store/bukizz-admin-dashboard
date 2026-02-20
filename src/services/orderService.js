import api from "./api";

export const fetchOrders = async ({
  page = 1,
  limit = 20,
  search = "",
  status = "",
  retailerId = "",
}) => {
  const params = {
    page,
    limit,
    search,
    status: status === "ALL" ? "" : status,
    retailerId,
  };
  // Updated to use the correct search endpoint
  const response = await api.get("/orders/admin/search", { params });
  return response.data;
};

export const updateOrderStatus = async (orderId, status) => {
  const response = await api.patch(`/admin/orders/${orderId}/status`, {
    status,
  });
  return response.data;
};
