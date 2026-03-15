import api from "./api";

// Map endpoints to functions
// Backend Base: http://localhost:5001/api/v1

export const loginAPI = async (email, password) => {
  const response = await api.post("/auth/login", { 
    email, 
    password,
    loginAs: "admin"
  });
  if (response.data.success) {
    return response.data.data;
  } else {
    throw new Error(response.data.message);
  }
};

export const registerAPI = async (fullName, email, password) => {
  const response = await api.post("/auth/register", {
    fullName,
    email,
    password,
  });
  if (response.data.success) {
    return response.data.data;
  } else {
    throw new Error(response.data.message);
  }
};

export const refreshTokenAPI = async (refreshToken) => {
  const response = await api.post("/auth/refresh-token", { refreshToken });
  if (response.data.success) {
    return response.data.data;
  } else {
    throw new Error(response.data.message);
  }
};

export const getCurrentUserAPI = async () => {
  const response = await api.get("/auth/me");

  // Handle direct resource return (no envelope) or enveloped return
  if (response.data && response.data.success === undefined) {
    // Assuming if we got here (200 OK via axios), it's the user object
    return response.data;
  }

  if (response.data.success) {
    return response.data.data;
  } else {
    throw new Error(response.data.message);
  }
};

export const verifyTokenAPI = async () => {
  const response = await api.get("/auth/verify-token");
  if (response.data.success) {
    return response.data.data;
  } else {
    throw new Error(response.data.message);
  }
};

export const logoutAPI = async (refreshToken) => {
  // Some backends require the refresh token to blacklist it on logout
  // If not required by backend, this can be skipped or passed as null
  const response = await api.post("/auth/logout", { refreshToken });
  if (response.data.success) {
    return response.data.data;
  } else {
    throw new Error(response.data.message);
  }
};

export const forgotPasswordAPI = async (email) => {
  const response = await api.post("/auth/forgot-password", { email });
  if (response.data.success) {
    return response.data.data;
  } else {
    throw new Error(response.data.message);
  }
};

export const resetPasswordAPI = async (token, newPassword) => {
  const response = await api.post("/auth/reset-password", {
    token,
    newPassword,
  });
  if (response.data.success) {
    return response.data.data;
  } else {
    throw new Error(response.data.message);
  }
};
