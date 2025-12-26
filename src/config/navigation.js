import {
  LayoutDashboard,
  Layers,
  GraduationCap,
  Package,
  Backpack,
  ShoppingBag,
  ClipboardList,
} from "lucide-react";

export const NAV_ITEMS = [
  {
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
    group: "main",
  },
  {
    label: "Categories",
    path: "/categories",
    icon: Layers,
    group: "main",
  },
  {
    label: "Schools",
    path: "/schools",
    icon: GraduationCap,
    group: "main",
  },
  {
    group: "Catalog",
    items: [
      {
        path: "/products",
        label: "All Products",
        icon: Package,
      },
      {
        path: "/products/school",
        label: "School Products",
        icon: Backpack,
      },
      {
        path: "/products/general",
        label: "General Products",
        icon: ShoppingBag,
      },
    ],
  },
  {
    group: "Sales",
    items: [
      {
        path: "/orders",
        label: "Orders",
        icon: ClipboardList,
      },
    ],
  },
];

// Helper map for Breadcrumbs and Page Titles
export const PATH_LABEL_MAP = {
  "/": "Dashboard",
  "/categories": "Categories",
  "/schools": "Schools",
  "/schools/add": "Onboard School",
  "/products": "All Products",
  "/products/school": "School Products",
  "/products/general": "General Products",
  "/orders": "Orders",
};
