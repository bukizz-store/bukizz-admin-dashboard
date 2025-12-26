import React from "react";

const DataGrid = ({ data, renderItem }) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full p-8 text-center text-slate-500 bg-white rounded-lg border border-slate-200 border-dashed">
        No items to display.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {data.map((item, index) => (
        <div key={item.id || index} className="h-full">
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
};

export default DataGrid;
