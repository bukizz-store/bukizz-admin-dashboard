import axios from "axios";

// Create Axios Instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 & Refresh Token
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Reject if authorized or if the retry flag is already set (infinite loop prevention)
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const refreshToken = localStorage.getItem("refreshToken");

      // If we don't have a refresh token, we can't refresh. Logout.
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      // Call Refresh Endpoint
      const response = await axios.post(
        "http://localhost:5001/api/v1/auth/refresh-token",
        {
          refreshToken,
        }
      );

      const { accessToken } = response.data;

      // Update Local Storage
      localStorage.setItem("accessToken", accessToken);

      // Update Header for the original request
      originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;

      // Retry Original Request
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh failed (expired or invalid) - Logout user
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      // Redirect to login (window.location is simple/robust for full re-auth)
      // Alternatively, we could emit an event for the context to handle
      window.location.href = "/login";

      return Promise.reject(refreshError);
    }
  }
);

export default api;
