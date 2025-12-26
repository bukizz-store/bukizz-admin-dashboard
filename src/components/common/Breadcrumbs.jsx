import React from "react";
import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { PATH_LABEL_MAP } from "../../config/navigation";

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  // If we are on dashboard, show nothing or just Dashboard text
  // Requirement: "Generate the trail dynamically."

  return (
    <nav
      className="flex items-center text-sm font-medium text-slate-500"
      aria-label="Breadcrumb"
    >
      {/* Home Item */}
      <Link
        to="/"
        className="flex items-center hover:text-slate-800 transition-colors"
      >
        <Home size={16} className="mr-1" />
        <span className="sr-only">Dashboard</span>
      </Link>

      {pathnames.length > 0 && (
        <ChevronRight size={16} className="mx-2 text-slate-400" />
      )}

      {pathnames.map((value, index) => {
        // Build the URL for this segment
        const to = `/${pathnames.slice(0, index + 1).join("/")}`;
        const isLast = index === pathnames.length - 1;

        // Resolve Label
        // Check exact match in map first
        let label = PATH_LABEL_MAP[to];

        // If no exact match (e.g. dynamic ID), format the segment
        if (!label) {
          // Heuristic: If it looks like an ID (alphanumeric long), truncate or show generic
          // Using simple capitalization for now as fallback
          label =
            value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, " ");
        }

        return (
          <div key={to} className="flex items-center">
            {isLast ? (
              <span className="text-slate-800 font-bold">{label}</span>
            ) : (
              <>
                <Link
                  to={to}
                  className="hover:text-slate-800 transition-colors"
                >
                  {label}
                </Link>
                <ChevronRight size={16} className="mx-2 text-slate-400" />
              </>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
