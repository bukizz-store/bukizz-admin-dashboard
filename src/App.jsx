import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import PagePlaceholder from "./components/common/PagePlaceholder";
import CategoriesPage from "./pages/categories/CategoriesPage";
import CategoryFormPage from "./pages/categories/CategoryFormPage";
import CategoryDetailPage from "./pages/categories/CategoryDetailPage";
import SchoolsListPage from "./pages/schools/SchoolsListPage";
import SchoolFormPage from "./pages/schools/SchoolFormPage";
import SchoolDetailPage from "./pages/schools/SchoolDetailPage";
import RetailersListPage from "./pages/retailers/RetailersListPage";
import RetailerFormPage from "./pages/retailers/RetailerFormPage";
import RetailerDetailPage from "./pages/retailers/RetailerDetailPage";
import WarehouseDetailPage from "./pages/warehouses/WarehouseDetailPage";
import ProductListPage from "./pages/products/ProductListPage";
import ProductFormPage from "./pages/products/ProductFormPage";
import ProductDetailPage from "./pages/products/ProductDetailPage";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import UserProfile from "./pages/profile/UserProfile";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { NAV_ITEMS } from "./config/navigation";

function App() {
  // Helper to flatten nested routes if we ever need to generate them dynamically from config
  // For now, we manually map them to ensure everything works as expected with the Placeholder

  const renderDashboardRoutes = () => {
    // Collect all paths from config
    const paths = [];
    NAV_ITEMS.forEach((item) => {
      if (item.path) paths.push(item.path);
      if (item.items) {
        item.items.forEach((subItem) => {
          if (subItem.path) paths.push(subItem.path);
        });
      }
    });

    return paths.map((path) => {
      if (path === "/categories") {
        return <Route key={path} path={path} element={<CategoriesPage />} />;
      }
      if (path === "/schools") {
        return <Route key={path} path={path} element={<SchoolsListPage />} />;
      }
      return <Route key={path} path={path} element={<PagePlaceholder />} />;
    });
  };

  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Dashboard Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<MainLayout />}>
                {/* Specific Routes for Categories */}
                <Route
                  path="/categories/create"
                  element={<CategoryFormPage />}
                />
                <Route
                  path="/categories/edit/:id"
                  element={<CategoryFormPage />}
                />
                <Route
                  path="/categories/:id"
                  element={<CategoryDetailPage />}
                />

                {/* Specific Routes for Schools */}
                <Route path="/schools/create" element={<SchoolFormPage />} />
                <Route path="/schools/edit/:id" element={<SchoolFormPage />} />
                <Route path="/schools/:id" element={<SchoolDetailPage />} />

                {/* Retailers */}
                <Route path="/retailers" element={<RetailersListPage />} />
                <Route
                  path="/retailers/create"
                  element={<RetailerFormPage />}
                />
                <Route path="/retailers/:id" element={<RetailerDetailPage />} />

                {/* Warehouse */}
                <Route
                  path="/warehouse/:id"
                  element={<WarehouseDetailPage />}
                />

                {/* Products */}
                <Route path="/products" element={<ProductListPage />} />
                <Route path="/products/create" element={<ProductFormPage />} />
                <Route
                  path="/products/edit/:id"
                  element={<ProductFormPage />}
                />
                <Route path="/products/:id" element={<ProductDetailPage />} />

                {renderDashboardRoutes()}
                <Route path="profile" element={<UserProfile />} />
                <Route
                  path="*"
                  element={
                    <div className="p-8 text-center text-slate-500">
                      404 - Page Not Found
                    </div>
                  }
                />
              </Route>
            </Route>

            {/* Default Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
