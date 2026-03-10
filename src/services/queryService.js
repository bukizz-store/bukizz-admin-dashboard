import api from "./api";

/**
 * Fetch paginated support queries for admin list view.
 * Maps to GET /orders/admin/queries
 */
export const fetchQueries = async ({
  page = 1,
  limit = 10,
  status = "",
  search = "",
} = {}) => {
  const params = {
    page,
    limit,
    status: status || undefined,
    search: search || undefined,
  };
  Object.keys(params).forEach(
    (k) => params[k] === undefined && delete params[k],
  );
  const response = await api.get("/orders/admin/queries", { params });
  return response.data;
};

/**
 * Fetch a single query's full details (thread, order, customer).
 * Maps to GET /orders/admin/queries/:queryId
 */
export const fetchQueryById = async (queryId) => {
  const response = await api.get(`/orders/admin/queries/${queryId}`);
  return response.data;
};

/**
 * Post a reply to a query thread.
 * Maps to POST /orders/admin/queries/:queryId/reply
 */
export const addQueryReply = async (queryId, { message, attachments = [] }) => {
  const response = await api.post(`/orders/admin/queries/${queryId}/reply`, {
    message,
    attachments,
  });
  return response.data;
};

/**
 * Update a query's status (e.g. "Resolved").
 * Maps to PUT /orders/admin/queries/:queryId/status
 */
export const updateQueryStatus = async (queryId, status) => {
  const response = await api.put(`/orders/admin/queries/${queryId}/status`, {
    status,
  });
  return response.data;
};
