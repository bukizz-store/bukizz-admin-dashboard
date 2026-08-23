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
  Wallet,
  Image as ImageIcon,
  Truck,
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
    permission: "categories:read",
  },
  {
    label: "Schools",
    path: "/schools",
    icon: GraduationCap,
    group: "main",
    permission: "schools:read",
  },
  {
    label: "Retailers",
    path: "/retailers",
    icon: Store,
    group: "main",
    permission: "retailers:read",
  },
  {
    label: "Delivery Partners",
    path: "/admin/delivery-partners",
    icon: Truck,
    group: "main",
    permission: "delivery_partners:read",
  },
  {
    label: "Banners",
    path: "/banners",
    icon: ImageIcon,
    group: "main",
    permission: "banners:read",
  },
  {
    group: "Catalog",
    items: [
      {
        path: "/products",
        label: "All Products",
        icon: Package,
        permission: "products:read",
      },
      {
        path: "/products/school",
        label: "School Products",
        icon: Backpack,
        permission: "products:read",
      },
      {
        path: "/products/general",
        label: "General Products",
        icon: ShoppingBag,
        permission: "products:read",
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
        permission: "orders:read",
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
        permission: "approvals:retailers:read",
      },
      {
        path: "/approvals/school-retailers",
        label: "School Retailers",
        icon: Store,
        permission: "approvals:school_retailers:read",
      },
      {
        path: "/approvals/products",
        label: "Products",
        icon: PackageCheck,
        permission: "approvals:products:manage",
      },
      {
        path: "/approvals/delivery-partners",
        label: "Delivery Partners",
        icon: Truck,
        permission: "approvals:delivery_partners:read",
      },
      {
        path: "/approvals/cash-remittances",
        label: "Cash Remittances",
        icon: Wallet,
        permission: "approvals:cash_remittances:read",
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
        permission: "support:queries:read",
      },
    ],
  },
  {
    group: "Settlements",
    items: [
      {
        path: "/settlements/due-today",
        label: "Due Settlements",
        icon: Wallet,
        permission: "settlements:read",
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
  "/admin/delivery-partners": "Delivery Partners",
  "/schools/add": "Onboard School",
  "/products": "All Products",
  "/products/school": "School Products",
  "/products/general": "General Products",
  "/approvals/retailers": "Retailer Approvals",
  "/approvals/school-retailers": "School Retailer Approvals",
  "/approvals/products": "Product Approvals",
  "/approvals/delivery-partners": "Delivery Partner Approvals",
  "/approvals/cash-remittances": "Cash Remittance Approvals",
  "/orders": "Orders",
  "/orderqueries": "Support Queries",
  "/settlements/due-today": "Due Settlements",
  "/banners": "Banners",
  "/banners/create": "Create Banner",
};
