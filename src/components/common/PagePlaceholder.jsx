import React from "react";
import { useLocation } from "react-router-dom";

const PagePlaceholder = () => {
  const location = useLocation();
  const title =
    location.pathname.split("/").filter(Boolean).pop() || "Dashboard";
  const displayTitle =
    title.charAt(0).toUpperCase() + title.slice(1).replace(/-/g, " ");

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center min-h-[400px]">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          {displayTitle}
        </h1>
        <p className="text-slate-500">
          Content for {location.pathname} goes here.
        </p>
        <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm font-mono text-slate-600">
          Component: src/pages/{displayTitle.replace(/\s+/g, "")}.jsx
        </div>
      </div>
    </div>
  );
};

export default PagePlaceholder;
