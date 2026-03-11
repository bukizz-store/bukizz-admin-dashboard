import React from "react";
import { ImageUpload } from "../ui";

const ProductMedia = ({ images, setImages }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-bold text-slate-800 mb-4">Product Images</h2>
      <ImageUpload
        multiple
        maxImages={10}
        label="Upload Images"
        onChange={(newImages) => setImages(newImages)}
        className="mb-4"
        values={images}
      />
    </div>
  );
};

export default ProductMedia;
