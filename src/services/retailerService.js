import api from "./api";

export const searchRetailers = async (role = "retailer") => {
  const response = await api.get("/users/admin/search", { params: { role } });
  return response.data;
};
