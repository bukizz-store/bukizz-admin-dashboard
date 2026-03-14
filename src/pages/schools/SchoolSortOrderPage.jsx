import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Save, GripVertical } from "lucide-react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Button } from "../../components/ui";

const SchoolSortOrderPage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentCity = searchParams.get("city") || "gurugram";

  const [schools, setSchools] = useState([]);
  const [localOrders, setLocalOrders] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Fetch schools
  useEffect(() => {
    const fetchSchools = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let allSchools = [];
        let currentPage = 1;
        let totalPages = 1;

        do {
          const params = {
            city: currentCity,
            limit: 100, // Max allowed config
            page: currentPage,
          };

          const response = await api.get("/schools", { params });

          if (response.data?.success) {
            allSchools = [...allSchools, ...response.data.data.schools];
            totalPages = response.data.data.pagination.totalPages;
            currentPage++;
          } else {
            break;
          }
        } while (currentPage <= totalPages);

        setSchools(allSchools);
        
        const initialOrders = {};
        allSchools.forEach((s) => {
          initialOrders[s.id] = s.sortOrder || 0;
        });
        setLocalOrders(initialOrders);
      } catch (err) {
        console.error("Fetch Schools Error:", err);
        setError(err?.response?.data?.message || "Failed to fetch schools.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchools();
  }, [currentCity]);

  const handleCityChange = (e) => {
    setSearchParams({ city: e.target.value });
  };

  const handleOrderChange = (id, value) => {
    setLocalOrders((prev) => ({
      ...prev,
      [id]: parseInt(value) || 0,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = Object.entries(localOrders).map(([id, sortOrder]) => ({
        id,
        sortOrder,
      }));

      const res = await api.put("/schools/sort-order", { orders: updates });
      if (res.data?.success) {
        toast.success("Sort orders updated successfully!");
        // We can optionally refetch here, but state is mostly synced.
      }
    } catch (err) {
      console.error("Save Error:", err);
      toast.error("Failed to update sort orders.");
    } finally {
      setIsSaving(false);
    }
  };

  // Sort schools based on localOrders for preview
  const sortedSchools = [...schools].sort((a, b) => {
    const orderA = localOrders[a.id] ?? (a.sortOrder || 0);
    const orderB = localOrders[b.id] ?? (b.sortOrder || 0);
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });

  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const [dragOverItemIndex, setDragOverItemIndex] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedItemIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      // This is sometimes necessary to start drag in certain browsers
      e.dataTransfer.setData("text/plain", `${index}`);
    }
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragOverItemIndex !== index) {
      setDragOverItemIndex(index);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOverItemIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
    setDragOverItemIndex(null);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === targetIndex) {
      handleDragEnd();
      return;
    }

    const newItems = [...sortedSchools];
    const draggedItem = newItems.splice(draggedItemIndex, 1)[0];
    newItems.splice(targetIndex, 0, draggedItem);

    const updatedOrders = { ...localOrders };
    // Re-assign sequential numbers starting from 1
    newItems.forEach((item, idx) => {
      updatedOrders[item.id] = (idx + 1) * 10; // * 10 allows inserting decimals later if they want, but integer works. Let's just use 1, 2, 3
    });
    
    // Actually, simple sequential integers 1, 2, 3..
    newItems.forEach((item, idx) => {
      updatedOrders[item.id] = idx + 1;
    });

    setLocalOrders(updatedOrders);
    handleDragEnd();
  };

  return (
    <div className="p-6 bg-bukizz-bg min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate(`/schools?city=${currentCity}`)}
              className="p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-bukizz-navy">
              Manage School Sort Order
            </h1>
          </div>
          <p className="text-sm text-slate-500 ml-10">
            Set the display priority of schools. Lower numbers appear first.
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <select
            value={currentCity}
            onChange={handleCityChange}
            className="px-4 py-2 border border-slate-200 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-bukizz-navy"
          >
            <option value="gurugram">Gurugram</option>
            <option value="kanpur">Kanpur</option>
          </select>

          <Button
            variant="primary"
            icon={Save}
            onClick={handleSave}
            loading={isSaving}
            disabled={isLoading || isSaving}
          >
            {isSaving ? "Saving..." : "Save Order"}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-slate-400">
            <Loader2 className="animate-spin w-8 h-8 text-bukizz-orange" />
            <span className="ml-3 font-medium">Loading schools...</span>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">{error}</div>
        ) : sortedSchools.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No schools found for this city.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">Sort Order</th>
                  <th className="px-6 py-4">School Name</th>
                  <th className="px-6 py-4">Identity</th>
                  <th className="px-6 py-4">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedSchools.map((school, index) => (
                  <tr
                    key={school.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`transition-colors cursor-move 
                      ${draggedItemIndex === index ? "opacity-40 bg-slate-100" : "hover:bg-slate-50"}
                      ${dragOverItemIndex === index ? (draggedItemIndex < index ? "border-b-2 border-b-bukizz-navy" : "border-t-2 border-t-bukizz-navy") : ""}
                    `}
                  >
                    <td className="px-6 py-4 w-40">
                      <div className="flex items-center">
                        <GripVertical size={16} className="text-slate-400 mr-3 shrink-0" />
                        <input
                          type="number"
                          className="w-20 px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-bukizz-navy/20 focus:border-bukizz-navy bg-white"
                          value={localOrders[school.id] ?? school.sortOrder ?? 0}
                          onChange={(e) => handleOrderChange(school.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {school.name}
                      </div>
                      <div className="text-xs text-slate-500">#{school.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            school.image && school.image.trim() !== ""
                              ? school.image
                              : "https://placehold.co/100x100?text=School"
                          }
                          alt={school.name}
                          className="w-8 h-8 rounded-md object-cover border border-slate-200"
                          onError={(e) => {
                            e.target.src = "https://placehold.co/100x100?text=School";
                          }}
                        />
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                          {school.board || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {school.city}, {school.state}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolSortOrderPage;
