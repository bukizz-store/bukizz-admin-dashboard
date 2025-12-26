import React, { useState } from "react";
import { Pencil, MoreVertical } from "lucide-react";
import {
  FilterBar,
  DataTable,
  DataGrid,
  StatusBadge,
  Pagination,
} from "../../components/common";
import { Button } from "../../components/ui";

// Mock Data
const MOCK_CATEGORIES = [
  {
    id: "#CAT-001",
    name: "Textbooks",
    image:
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=100&auto=format&fit=crop",
    description: "Curriculum aligned textbooks for all grades.",
    offerTag: "Back to School",
    productCount: 124,
    status: "Active",
  },
  {
    id: "#CAT-002",
    name: "Stationery Kits",
    image:
      "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?q=80&w=100&auto=format&fit=crop",
    description: "Essential supplies for primary and secondary.",
    offerTag: "Bundle Deal",
    productCount: 856,
    status: "Active",
  },
  {
    id: "#CAT-005",
    name: "School Uniforms",
    image:
      "https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?q=80&w=100&auto=format&fit=crop",
    description: "Complete uniform sets including shoes.",
    offerTag: null,
    productCount: 42,
    status: "Inactive",
  },
  {
    id: "#CAT-008",
    name: "Accessories",
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=100&auto=format&fit=crop",
    description: "Bags, bottles, lunch boxes, and more.",
    offerTag: "Summer Sale",
    productCount: 156,
    status: "Active",
  },
  {
    id: "#CAT-012",
    name: "Sports Equipment",
    image:
      "https://images.unsplash.com/photo-1592656094267-764a45160876?q=80&w=100&auto=format&fit=crop",
    description: "Gear for football, cricket, basketball.",
    offerTag: null,
    productCount: 89,
    status: "Active",
  },
];

const CategoriesPage = () => {
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'

  // List View Columns
  const columns = [
    {
      header: "Image",
      accessor: "image",
      render: (row) => (
        <img
          src={row.image}
          alt={row.name}
          className="w-10 h-10 rounded-md object-cover border border-slate-100"
        />
      ),
    },
    {
      header: "Name / ID",
      accessor: "name",
      render: (row) => (
        <div>
          <div className="font-bold text-slate-800">{row.name}</div>
          <div className="text-xs text-slate-400">{row.id}</div>
        </div>
      ),
    },
    {
      header: "Description",
      accessor: "description",
      render: (row) => (
        <span
          className="text-slate-500 truncate max-w-[200px] block"
          title={row.description}
        >
          {row.description}
        </span>
      ),
    },
    {
      header: "Offers",
      accessor: "offerTag",
      render: (row) =>
        row.offerTag ? (
          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
            {row.offerTag}
          </span>
        ) : (
          <span className="text-slate-400 text-xs">-</span>
        ),
    },
    {
      header: "Products",
      accessor: "productCount",
      render: (row) => (
        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
          {row.productCount} items
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <div className="flex items-center">
          {/* Custom Toggle Switch Visual */}
          <div
            className={`w-8 h-4 rounded-full p-0.5 transition-colors ${
              row.status === "Active" ? "bg-green-500" : "bg-slate-300"
            }`}
          >
            <div
              className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${
                row.status === "Active" ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </div>
        </div>
      ),
    },
  ];

  // Grid Grid Item Renderer
  const renderGridItem = (item) => (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 border border-slate-100 flex flex-col h-full">
      <div className="relative aspect-video rounded-md overflow-hidden mb-3 bg-slate-100">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
        />
        {item.offerTag && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-white/90 text-purple-700 shadow-sm backdrop-blur-sm">
            {item.offerTag}
          </span>
        )}
      </div>

      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-bold text-slate-800">{item.name}</h3>
          <p className="text-xs text-slate-400">{item.id}</p>
        </div>
        <div
          className={`w-2 h-2 rounded-full mt-1.5 ${
            item.status === "Active" ? "bg-green-500" : "bg-slate-300"
          }`}
        />
      </div>

      <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1">
        {item.description}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        <span className="text-xs font-medium text-slate-500">
          {item.productCount} Products
        </span>
        <Button variant="secondary" size="sm" icon={Pencil}>
          Edit
        </Button>
      </div>
    </div>
  );

  const actions = (row) => (
    <button className="p-2 text-slate-400 hover:text-bukizz-orange hover:bg-orange-50 rounded-full transition-colors">
      <Pencil size={16} />
    </button>
  );

  return (
    <div className="p-6 bg-bukizz-bg min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-bukizz-navy">
            All Categories
          </h1>
          <p className="text-sm text-slate-500">
            Manage your product categories and catalogs
          </p>
        </div>
        <Button variant="primary">+ Add Category</Button>
      </div>

      {/* Controls */}
      <FilterBar
        onSearch={(val) => console.log("Search:", val)}
        filters={[
          { label: "All Branches", options: ["Main Branch", "Downtown"] },
          {
            label: "Status: Active & Inactive",
            options: ["Active", "Inactive"],
          },
        ]}
        view={viewMode}
        onViewChange={setViewMode}
      />

      {/* Content */}
      {viewMode === "list" ? (
        <DataTable columns={columns} data={MOCK_CATEGORIES} actions={actions} />
      ) : (
        <DataGrid data={MOCK_CATEGORIES} renderItem={renderGridItem} />
      )}

      {/* Footer */}
      <Pagination
        currentPage={1}
        totalPages={1}
        itemsPerPage={10}
        totalItems={42}
        onPageChange={() => {}}
      />
    </div>
  );
};

export default CategoriesPage;
