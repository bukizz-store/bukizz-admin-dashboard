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
import SchoolSortOrderPage from "./pages/schools/SchoolSortOrderPage";
import RetailersListPage from "./pages/retailers/RetailersListPage";
import RetailerFormPage from "./pages/retailers/RetailerFormPage";
import RetailerDetailPage from "./pages/retailers/RetailerDetailPage";
import WarehouseDetailPage from "./pages/warehouses/WarehouseDetailPage";
import DeliveryPartnerList from "./pages/DeliveryPartners/DeliveryPartnerList";
import DeliveryPartnerDetail from "./pages/DeliveryPartners/DeliveryPartnerDetail";
import ProductListPage from "./pages/products/ProductListPage";
import ProductFormPage from "./pages/products/ProductFormPage";
import RetailerApprovalsPage from "./pages/approvals/RetailerApprovalsPage";
import RetailerSchoolApprovalsPage from "./pages/approvals/RetailerSchoolApprovalsPage";
import ProductApprovalsPage from "./pages/approvals/ProductApprovalsPage";
import DeliveryPartnerApprovalsPage from "./pages/approvals/DeliveryPartnerApprovalsPage";
import CashRemittanceApprovalsPage from "./pages/approvals/CashRemittanceApprovalsPage";
import ProductDetailPage from "./pages/products/ProductDetailPage";
import OrderListPage from "./pages/orders/OrderListPage";
import OrderDetailPage from "./pages/orders/OrderDetailPage";
import OrderItemDetailPage from "./pages/orders/OrderItemDetailPage";
import QueryListPage from "./pages/support/QueryListPage";
import QueryResolutionPage from "./pages/support/QueryResolutionPage";
import AdminGlobalSettlements from "./pages/settlements/AdminGlobalSettlements";
import BannerListPage from "./pages/banners/BannerListPage";
import BannerFormPage from "./pages/banners/BannerFormPage";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import UserProfile from "./pages/profile/UserProfile";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { NAV_ITEMS } from "./config/navigation";

function App() {
  const renderDashboardRoutes = () => {
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

            {/* Base Protected Dashboard Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<MainLayout />}>
                {/* Index Route -> default to schools */}
                <Route index element={<Navigate to="/schools" replace />} />

                {/* Categories */}
                <Route
                  path="/categories"
                  element={
                    <ProtectedRoute requiredPermission="categories:read">
                      <CategoriesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/categories/create"
                  element={
                    <ProtectedRoute requiredPermission="categories:manage">
                      <CategoryFormPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/categories/edit/:id"
                  element={
                    <ProtectedRoute requiredPermission="categories:manage">
                      <CategoryFormPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/categories/:id"
                  element={
                    <ProtectedRoute requiredPermission="categories:read">
                      <CategoryDetailPage />
                    </ProtectedRoute>
                  }
                />

                {/* Schools */}
                <Route
                  path="/schools"
                  element={
                    <ProtectedRoute requiredPermission="schools:read">
                      <SchoolsListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/schools/sort"
                  element={
                    <ProtectedRoute requiredPermission="schools:sort_order:manage">
                      <SchoolSortOrderPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/schools/create"
                  element={
                    <ProtectedRoute requiredPermission="schools:manage">
                      <SchoolFormPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/schools/edit/:id"
                  element={
                    <ProtectedRoute requiredPermission="schools:manage">
                      <SchoolFormPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/schools/:id"
                  element={
                    <ProtectedRoute requiredPermission="schools:read">
                      <SchoolDetailPage />
                    </ProtectedRoute>
                  }
                />

                {/* Retailers */}
                <Route
                  path="/retailers"
                  element={
                    <ProtectedRoute requiredPermission="retailers:read">
                      <RetailersListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/retailers/create"
                  element={
                    <ProtectedRoute requiredPermission="retailers:manage">
                      <RetailerFormPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/retailers/:id"
                  element={
                    <ProtectedRoute requiredPermission="retailers:read">
                      <RetailerDetailPage />
                    </ProtectedRoute>
                  }
                />

                {/* Warehouse */}
                <Route
                  path="/warehouse/:id"
                  element={
                    <ProtectedRoute requiredPermission="retailers:warehouses:read">
                      <WarehouseDetailPage />
                    </ProtectedRoute>
                  }
                />

                {/* Products */}
                <Route
                  path="/products"
                  element={
                    <ProtectedRoute requiredPermission="products:read">
                      <ProductListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products/create"
                  element={
                    <ProtectedRoute requiredPermission="products:manage">
                      <ProductFormPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products/edit/:id"
                  element={
                    <ProtectedRoute requiredPermission="products:manage">
                      <ProductFormPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products/:id"
                  element={
                    <ProtectedRoute requiredPermission="products:read">
                      <ProductDetailPage />
                    </ProtectedRoute>
                  }
                />

                {/* Approvals */}
                <Route
                  path="/approvals/retailers"
                  element={
                    <ProtectedRoute requiredPermission="approvals:retailers:read">
                      <RetailerApprovalsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/approvals/school-retailers"
                  element={
                    <ProtectedRoute requiredPermission="approvals:school_retailers:read">
                      <RetailerSchoolApprovalsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/approvals/products"
                  element={
                    <ProtectedRoute requiredPermission="approvals:products:manage">
                      <ProductApprovalsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/approvals/delivery-partners"
                  element={
                    <ProtectedRoute requiredPermission="approvals:delivery_partners:read">
                      <DeliveryPartnerApprovalsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/approvals/cash-remittances"
                  element={
                    <ProtectedRoute requiredPermission="approvals:cash_remittances:read">
                      <CashRemittanceApprovalsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Delivery Partners */}
                <Route
                  path="/admin/delivery-partners"
                  element={
                    <ProtectedRoute requiredPermission="delivery_partners:read">
                      <DeliveryPartnerList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/delivery-partners/:id"
                  element={
                    <ProtectedRoute requiredPermission="delivery_partners:read">
                      <DeliveryPartnerDetail />
                    </ProtectedRoute>
                  }
                />

                {/* Orders */}
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute requiredPermission="orders:read">
                      <OrderListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders/:id"
                  element={
                    <ProtectedRoute requiredPermission="orders:read">
                      <OrderDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders/:id/items/:itemId"
                  element={
                    <ProtectedRoute requiredPermission="orders:read">
                      <OrderItemDetailPage />
                    </ProtectedRoute>
                  }
                />

                {/* Banners */}
                <Route
                  path="/banners"
                  element={
                    <ProtectedRoute requiredPermission="banners:read">
                      <BannerListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/banners/create"
                  element={
                    <ProtectedRoute requiredPermission="banners:manage">
                      <BannerFormPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/banners/edit/:id"
                  element={
                    <ProtectedRoute requiredPermission="banners:manage">
                      <BannerFormPage />
                    </ProtectedRoute>
                  }
                />

                {/* Support Queries */}
                <Route
                  path="/orderqueries"
                  element={
                    <ProtectedRoute requiredPermission="support:queries:read">
                      <QueryListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orderqueries/:id"
                  element={
                    <ProtectedRoute requiredPermission="support:queries:read">
                      <QueryResolutionPage />
                    </ProtectedRoute>
                  }
                />

                {/* Settlements */}
                <Route
                  path="/settlements/due-today"
                  element={
                    <ProtectedRoute requiredPermission="settlements:read">
                      <AdminGlobalSettlements />
                    </ProtectedRoute>
                  }
                />

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
