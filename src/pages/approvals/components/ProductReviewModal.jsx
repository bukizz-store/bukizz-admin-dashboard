import React, { useState } from "react";
import {
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Button from "../../../components/ui/Button";

const ProductReviewModal = ({
  isOpen,
  onClose,
  product,
  onApprove,
  onReject,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [checklist, setChecklist] = useState({
    imagesClear: false,
    noProfanity: false,
    descriptionAccurate: false,
    categoryCorrect: false,
  });
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!isOpen || !product) return null;

  const images = product.images || [product.thumbnail];

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleChecklistChange = (key) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecksPassed = Object.values(checklist).every(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-xl overflow-hidden flex shadow-2xl">
        {/* Left Split: Image Carousel */}
        <div className="w-1/2 bg-slate-900 flex flex-col justify-center relative">
          <div className="flex-1 flex items-center justify-center p-8">
            <img
              src={images[currentImageIndex]}
              alt={`Product ${currentImageIndex + 1}`}
              className="max-h-full max-w-full object-contain rounded-lg"
            />
          </div>

          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <div className="h-20 bg-black/40 flex items-center justify-center gap-2 p-2 overflow-x-auto">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                  currentImageIndex === idx
                    ? "border-blue-500 opacity-100"
                    : "border-transparent opacity-60"
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Right Split: Details & Actions */}
        <div className="w-1/2 flex flex-col h-full bg-white">
          <div className="p-6 border-b border-slate-100 flex justify-between items-start">
            <div>
              <div className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block mb-2">
                {product.category}
              </div>
              <h2 className="text-2xl font-bold text-slate-800 leading-tight mb-1">
                {product.title}
              </h2>
              <p className="text-slate-500 text-sm">
                Sold by:{" "}
                <span className="font-medium text-slate-700">
                  {product.retailer}
                </span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">
                Product Description
              </h3>
              <div
                className="prose prose-sm text-slate-600 max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">
                Specifications
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(product.specifications || {}).map(
                  ([key, value]) => (
                    <div key={key} className="bg-slate-50 p-3 rounded-lg">
                      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                        {key}
                      </div>
                      <div className="text-sm font-medium text-slate-800">
                        {value}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
              <h3 className="text-md font-bold text-yellow-800 flex items-center gap-2 mb-3">
                <AlertTriangle size={18} />
                QC Checklist (Mental Check)
              </h3>
              <div className="space-y-2">
                {[
                  {
                    id: "imagesClear",
                    label: "Images are high quality & clear",
                  },
                  {
                    id: "noProfanity",
                    label: "No profanity or illegal content",
                  },
                  {
                    id: "descriptionAccurate",
                    label: "Description matches images",
                  },
                  { id: "categoryCorrect", label: "Correct category selected" },
                ].map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 p-2 hover:bg-white/50 rounded-lg cursor-pointer transition-colors"
                  >
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        checklist[item.id]
                          ? "bg-green-500 border-green-500 text-white"
                          : "bg-white border-slate-300"
                      }`}
                    >
                      {checklist[item.id] && <CheckCircle size={14} />}
                    </div>
                    <input
                      type="checkbox"
                      checked={checklist[item.id]}
                      onChange={() => handleChecklistChange(item.id)}
                      className="hidden"
                    />
                    <span
                      className={`text-sm ${checklist[item.id] ? "text-slate-900 font-medium" : "text-slate-600"}`}
                    >
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {showRejectForm && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-5 animate-in fade-in slide-in-from-bottom-2">
                <h4 className="font-semibold text-red-800 mb-2">
                  Correction Note (Required)
                </h4>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain what needs to be fixed..."
                  className="w-full p-3 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                  rows={3}
                />
                <div className="flex justify-end gap-2 mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRejectForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={!rejectReason.trim()}
                    onClick={() => onReject(product.id, rejectReason)}
                  >
                    Submit Rejection
                  </Button>
                </div>
              </div>
            )}
          </div>

          {!showRejectForm && (
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="text-sm">
                <span className="font-semibold text-slate-900 text-lg">
                  ₹{product.price}
                </span>
                <span className="text-slate-500 ml-2">Selling Price</span>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setShowRejectForm(true)}
                >
                  Reject
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white px-8"
                  disabled={!allChecksPassed}
                  title={!allChecksPassed ? "Complete QC checklist first" : ""}
                  onClick={() => onApprove(product.id)}
                >
                  Approve & Publish
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductReviewModal;
