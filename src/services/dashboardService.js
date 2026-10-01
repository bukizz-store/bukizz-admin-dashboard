import api from "./api";

/**
 * Fetch aggregated executive admin dashboard metrics,
 * revenue trends, order distributions, and operational alerts.
 * @param {string[]} [retailerIds] - Optional array of retailer user IDs to filter metrics
 * @returns {Promise<Object>} Dashboard overview response data
 */
export const getAdminDashboardOverview = async (retailerIds = []) => {
  const params = {};
  if (Array.isArray(retailerIds) && retailerIds.length > 0) {
    params.retailerIds = retailerIds.join(",");
  }
  const response = await api.get("/admin/dashboard/overview", { params });
  return response.data?.data || response.data;
};

