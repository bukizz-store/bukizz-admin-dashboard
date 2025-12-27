import React, { createContext, useContext, useState, useEffect } from "react";
import {
  loginAPI,
  registerAPI,
  logoutAPI,
  getCurrentUserAPI,
} from "../services/authService";
import { useToast } from "./ToastContext";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  // Initialize Auth State on Mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          console.log("token from AuthContext useEffect", token);
          // Verify token by fetching current user
          const userData = await getCurrentUserAPI();
          console.log("userData from AuthContext useEffect", userData);
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Auth Initialization Failed:", error);
          // Token invalid or expired (and refresh failed in interceptor)
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        console.log("No token found");
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Login
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const data = await loginAPI(email, password);
      // Expected data: { user, accessToken, refreshToken }
      console.log("data from AuthContext login", data);

      const accessToken = data.accessToken || data.access_token || data.token;
      const refreshToken = data.refreshToken || data.refresh_token;

      if (!accessToken) {
        console.error("No access token found in login response:", data);
        return {
          success: false,
          message: "Authentication failed: No token received",
        };
      }

      setUser(data.user);
      setIsAuthenticated(true);

      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user)); // Optional cache

      return { success: true };
    } catch (error) {
      console.error("Login Error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Register
  const register = async (fullName, email, password) => {
    setIsLoading(true);
    try {
      const data = await registerAPI(fullName, email, password);

      // Auto-login after register logic usually provided by backend too
      // If backend returns tokens on register:
      const accessToken = data.accessToken || data.access_token || data.token;
      const refreshToken = data.refreshToken || data.refresh_token;

      if (accessToken) {
        setUser(data.user);
        setIsAuthenticated(true);
        localStorage.setItem("accessToken", accessToken);
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      } else {
        // Maybe backend just returns success without tokens, user needs to login
        // For now, we assume tokens if we want auto-login
      }

      return { success: true };
    } catch (error) {
      console.error("Register Error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async (isSessionExpired = false) => {
    if (isSessionExpired) {
      toast.info("Session expired. Please login again.");
    }

    try {
      const refreshToken = localStorage.getItem("refreshToken");
      await logoutAPI(refreshToken);
    } catch (error) {
      console.error("Logout API Error (ignoring):", error);
    } finally {
      // Clear local state regardless of API success
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
