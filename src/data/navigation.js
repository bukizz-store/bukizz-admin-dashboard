import {
  LayoutDashboard,
  Layers,
  GraduationCap,
  Package,
  Backpack,
  ShoppingBag,
  ClipboardList,
} from "lucide-react";

export const navigationConfig = [
  {
    path: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    group: "main",
  },
  {
    path: "/categories",
    label: "Categories",
    icon: Layers,
    group: "main",
  },
  {
    path: "/schools",
    label: "Schools",
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
