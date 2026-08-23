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

  // Helper to extract clean unwrapped user object
  const effectiveUser = useMemo(() => {
    if (!user) return null;
    return user.user && typeof user.user === "object" ? user.user : user;
  }, [user]);

  // Normalize permissions array from user payload
  const permissions = useMemo(() => {
    if (!effectiveUser) return [];
    if (Array.isArray(effectiveUser.permissions)) return effectiveUser.permissions;
    return [];
  }, [effectiveUser]);

  // Master bypass check (superadmin or admin role bypasses all permission restrictions)
  const isSuperAdmin = useMemo(() => {
    if (!effectiveUser) return false;
    const role = String(effectiveUser.role || "").toLowerCase();
    const roles = Array.isArray(effectiveUser.roles)
      ? effectiveUser.roles.map((r) => String(r).toLowerCase())
      : [];
    return (
      role === "superadmin" ||
      role === "admin" ||
      roles.includes("superadmin") ||
      roles.includes("admin")
    );
  }, [effectiveUser]);

  /**
   * Evaluates if the authenticated user possesses a specific action permission.
   * Master role (superadmin) automatically evaluates to true.
   * @param {string} requiredPermission - Permission string (e.g., 'schools:manage')
   * @returns {boolean}
   */
  const hasPermission = useCallback(
    (requiredPermission) => {
      if (!isAuthenticated || !effectiveUser) return false;
      if (isSuperAdmin) return true;
      if (!requiredPermission) return true;
      return permissions.includes(requiredPermission);
    },
    [isAuthenticated, effectiveUser, isSuperAdmin, permissions]
  );

  /**
   * Evaluates if the authenticated user possesses ANY of the listed permissions.
   * @param {string[]} permissionsList - Array of permission strings
   * @returns {boolean}
   */
  const hasAnyPermission = useCallback(
    (permissionsList = []) => {
      if (!isAuthenticated || !effectiveUser) return false;
      if (isSuperAdmin) return true;
      if (!permissionsList || permissionsList.length === 0) return true;
      return permissionsList.some((perm) => permissions.includes(perm));
    },
    [isAuthenticated, effectiveUser, isSuperAdmin, permissions]
  );

  /**
   * Evaluates if the authenticated user possesses ALL of the listed permissions.
   * @param {string[]} permissionsList - Array of permission strings
   * @returns {boolean}
   */
  const hasAllPermissions = useCallback(
    (permissionsList = []) => {
      if (!isAuthenticated || !effectiveUser) return false;
      if (isSuperAdmin) return true;
      if (!permissionsList || permissionsList.length === 0) return true;
      return permissionsList.every((perm) => permissions.includes(perm));
    },
    [isAuthenticated, effectiveUser, isSuperAdmin, permissions]
  );

  // Initialize Auth State on Mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const userData = await getCurrentUserAPI();
          const resolvedUser = userData?.user || userData;
          setUser(resolvedUser);
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

      const resolvedUser = data?.user || data;
      setUser(resolvedUser);
      setIsAuthenticated(true);

      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(resolvedUser));

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
        const resolvedUser = data?.user || data;
        setUser(resolvedUser);
        setIsAuthenticated(true);
        localStorage.setItem("accessToken", accessToken);
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(resolvedUser));
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
        user: effectiveUser,
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
