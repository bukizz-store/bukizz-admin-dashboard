import {
  LayoutDashboard,
  Layers,
  GraduationCap,
  Package,
  Backpack,
  ShoppingBag,
  ClipboardList,
  Store,
  ClipboardCheck,
  UserCheck,
  PackageCheck,
  MessageSquare,
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
    label: "Retailers",
    path: "/retailers",
    icon: Store,
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
  {
    group: "Approvals",
    icon: ClipboardCheck,
    items: [
      {
        path: "/approvals/retailers",
        label: "Retailers",
        icon: UserCheck,
      },
      {
        path: "/approvals/products",
        label: "Products",
        icon: PackageCheck,
      },
    ],
  },
  {
    group: "Support",
    items: [
      {
        path: "/orderqueries",
        label: "Queries",
        icon: MessageSquare,
      },
    ],
  },
];

// Helper map for Breadcrumbs and Page Titles
export const PATH_LABEL_MAP = {
  "/": "Dashboard",
  "/categories": "Categories",
  "/schools": "Schools",
  "/retailers": "Retailers",
  "/schools/add": "Onboard School",
  "/products": "All Products",
  "/products/school": "School Products",
  "/products/general": "General Products",
  "/products/general": "General Products",
  "/approvals/retailers": "Retailer Approvals",
  "/approvals/products": "Product Approvals",
  "/orders": "Orders",
  "/orderqueries": "Support Queries",
};
