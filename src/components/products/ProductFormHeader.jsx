import React from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "../ui";

const ProductFormHeader = ({ isEditMode, isDuplicateMode, isSaving, onSave, onCancel }) => {
  const getTitle = () => {
    if (isDuplicateMode) return "Duplicate Product";
    if (isEditMode) return "Edit Product";
    return "Create Product";
  };

  const getSubtitle = () => {
    if (isDuplicateMode) return "Create a new product based on an existing one";
    if (isEditMode) return "Update product details and inventory";
    return "Add a new product to your catalog";
  };

  const getButtonText = () => {
    if (isDuplicateMode) return "Create Duplicate";
    if (isEditMode) return "Update Product";
    return "Save Product";
  };

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
          {getTitle()}
        </h1>
        <p className="text-sm text-slate-500">
          {getSubtitle()}
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
          {getButtonText()}
        </Button>
      </div>
    </div>
  );
};

export default ProductFormHeader;
