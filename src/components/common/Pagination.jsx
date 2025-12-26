import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  itemsPerPage = 10,
  onItemsPerPageChange,
  totalItems,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 text-sm text-slate-600">
      {/* Left: Rows per page */}
      <div className="flex items-center gap-2">
        <span>Rows per page:</span>
        <select
          value={itemsPerPage}
          onChange={(e) =>
            onItemsPerPageChange && onItemsPerPageChange(Number(e.target.value))
          }
          className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 outline-none focus:border-bukizz-orange focus:ring-1 focus:ring-bukizz-orange cursor-pointer"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
        {totalItems && (
          <span className="ml-2 text-slate-400">(Total {totalItems})</span>
        )}
      </div>

      {/* Right: Navigation */}
      <div className="flex items-center gap-4">
        <span>
          Page <span className="font-medium text-slate-900">{currentPage}</span>{" "}
          of <span className="font-medium text-slate-900">{totalPages}</span>
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
