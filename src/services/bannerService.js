import api from "./api";

const bannerService = {
  // Get all admin banners
  getBanners: async (params) => {
    const response = await api.get("/banners", { params });
    return response.data;
  },

  // Create a new banner
  createBanner: async (data) => {
    const response = await api.post("/banners", data);
    return response.data;
  },

  // Update a banner
  updateBanner: async (id, data) => {
    const response = await api.put(`/banners/${id}`, data);
    return response.data;
  },

  // Delete a banner
  deleteBanner: async (id) => {
    const response = await api.delete(`/banners/${id}`);
    return response.data;
  },
};

export default bannerService;
