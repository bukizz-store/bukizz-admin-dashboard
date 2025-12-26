import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import PagePlaceholder from "./components/common/PagePlaceholder";
import CategoriesPage from "./pages/categories/CategoriesPage";
import { NAV_ITEMS } from "./config/navigation";

function App() {
  // Helper to flatten nested routes if we ever need to generate them dynamically from config
  // For now, we manually map them to ensure everything works as expected with the Placeholder

  const renderRoutes = () => {
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
      return <Route key={path} path={path} element={<PagePlaceholder />} />;
    });
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {renderRoutes()}
          <Route
            path="*"
            element={
              <div className="p-8 text-center text-slate-500">
                404 - Page Not Found
              </div>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
