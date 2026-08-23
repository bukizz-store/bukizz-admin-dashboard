import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
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

  // Normalize permissions array from user payload
  const permissions = useMemo(() => {
    if (!user) return [];
    if (Array.isArray(user.permissions)) return user.permissions;
    return [];
  }, [user]);

  // Master bypass check (superadmin role bypasses all permission restrictions)
  const isSuperAdmin = useMemo(() => {
    if (!user) return false;
    const role = user.role || "";
    const roles = Array.isArray(user.roles) ? user.roles : [];
    return role === "superadmin" || roles.includes("superadmin");
  }, [user]);

  /**
   * Evaluates if the authenticated user possesses a specific action permission.
   * Master role (superadmin) automatically evaluates to true.
   * @param {string} requiredPermission - Permission string (e.g., 'schools:manage')
   * @returns {boolean}
   */
  const hasPermission = useCallback(
    (requiredPermission) => {
      if (!isAuthenticated || !user) return false;
      if (isSuperAdmin) return true;
      if (!requiredPermission) return true;
      return permissions.includes(requiredPermission);
    },
    [isAuthenticated, user, isSuperAdmin, permissions]
  );

  /**
   * Evaluates if the authenticated user possesses ANY of the listed permissions.
   * @param {string[]} permissionsList - Array of permission strings
   * @returns {boolean}
   */
  const hasAnyPermission = useCallback(
    (permissionsList = []) => {
      if (!isAuthenticated || !user) return false;
      if (isSuperAdmin) return true;
      if (!permissionsList || permissionsList.length === 0) return true;
      return permissionsList.some((perm) => permissions.includes(perm));
    },
    [isAuthenticated, user, isSuperAdmin, permissions]
  );

  /**
   * Evaluates if the authenticated user possesses ALL of the listed permissions.
   * @param {string[]} permissionsList - Array of permission strings
   * @returns {boolean}
   */
  const hasAllPermissions = useCallback(
    (permissionsList = []) => {
      if (!isAuthenticated || !user) return false;
      if (isSuperAdmin) return true;
      if (!permissionsList || permissionsList.length === 0) return true;
      return permissionsList.every((perm) => permissions.includes(perm));
    },
    [isAuthenticated, user, isSuperAdmin, permissions]
  );

  // Initialize Auth State on Mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const userData = await getCurrentUserAPI();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Auth Initialization Failed:", error);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          setUser(null);
          setIsAuthenticated(false);
        }
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
      localStorage.setItem("user", JSON.stringify(data.user));

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
      const accessToken = data.accessToken || data.access_token || data.token;
      const refreshToken = data.refreshToken || data.refresh_token;

      if (accessToken) {
        setUser(data.user);
        setIsAuthenticated(true);
        localStorage.setItem("accessToken", accessToken);
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
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
      toast?.info?.("Session expired. Please login again.");
    }

    try {
      const refreshToken = localStorage.getItem("refreshToken");
      await logoutAPI(refreshToken);
    } catch (error) {
      console.error("Logout API Error (ignoring):", error);
    } finally {
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
        permissions,
        isSuperAdmin,
        isAuthenticated,
        isLoading,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
