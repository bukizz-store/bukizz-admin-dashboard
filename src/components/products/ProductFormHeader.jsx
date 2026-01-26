import React from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "../ui";

const ProductFormHeader = ({ isEditMode, isSaving, onSave, onCancel }) => {
  return (
    <div className="flex items-center gap-4 mb-6">
      <button
        onClick={onCancel}
        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
      >
        <ArrowLeft size={20} />
      </button>
      <div>
        <h1 className="text-2xl font-bold text-bukizz-navy">
          {isEditMode ? "Edit Product" : "Create Product"}
        </h1>
        <p className="text-sm text-slate-500">
          {isEditMode
            ? "Update product details and inventory"
            : "Add a new product to your catalog"}
        </p>
      </div>
      <div className="ml-auto flex gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          icon={Save}
          onClick={onSave}
          isLoading={isSaving}
        >
          {isEditMode ? "Update Product" : "Save Product"}
        </Button>
      </div>
    </div>
  );
};

export default ProductFormHeader;
