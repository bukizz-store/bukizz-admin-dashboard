import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Save, ArrowLeft } from "lucide-react";
import ImageUpload from "../../components/ui/ImageUpload";
import bannerService from "../../services/bannerService";
import { useToast } from "../../context/ToastContext";
import Button from "../../components/ui/Button";

const BannerFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    cities: ["All"],
    pages: ["home"],
    desktopImageUrl: "",
    mobileImageUrl: "",
    altText: "",
    redirectUrl: "",
    sortOrder: 0,
    isActive: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If we have banner data in state (from list page navigation), use it directly
    if (isEditing && location.state?.banner) {
      const { banner } = location.state;
      setFormData({
        cities: banner.cities || ["All"],
        pages: banner.pages || ["home"],
        desktopImageUrl: banner.desktop_image_url || "",
        mobileImageUrl: banner.mobile_image_url || "",
        altText: banner.alt_text || "",
        redirectUrl: banner.redirect_url || "",
        sortOrder: banner.sort_order || 0,
        isActive: banner.is_active !== undefined ? banner.is_active : true,
      });
    } else if (isEditing) {
      // If no state, we would fetch the specific banner here
      // But we passed data via state. Assuming it's available.
    }
  }, [id, location.state, isEditing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleArrayChange = (field, value) => {
    setFormData((prev) => {
      const currentArray = prev[field] || [];
      if (currentArray.includes(value)) {
        return { ...prev, [field]: currentArray.filter(item => item !== value) };
      } else {
        return { ...prev, [field]: [...currentArray, value] };
      }
    });
  };

  // Helper to handle image URL inputs directly.
  // In a full implementation, you would use a file input and upload to Supabase storage to get the URL here.
  // Assuming simple URL text inputs for now based on context and existing Supabase 'carousel_images' bucket.
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing) {
        await bannerService.updateBanner(id, formData);
        toast.success("Banner updated successfully");
      } else {
        await bannerService.createBanner(formData);
        toast.success("Banner created successfully");
      }
      navigate("/banners");
    } catch (error) {
      console.error("Error saving banner:", error);
      toast.error(error.response?.data?.error || "Failed to save banner");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/banners")}
            className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditing ? "Edit Banner" : "Create New Banner"}
          </h1>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Cities Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cities *</label>
              <div className="flex gap-4 flex-wrap">
                {["All", "Kanpur", "Gurugram"].map(city => (
                  <label key={city} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.cities.includes(city)}
                      onChange={() => handleArrayChange("cities", city)}
                      className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="text-sm text-gray-700">{city}</span>
                  </label>
                ))}
              </div>
              {formData.cities.length === 0 && <p className="text-xs text-red-500 mt-1">Please select at least one city.</p>}
            </div>

            {/* Pages Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pages *</label>
              <div className="flex gap-4 flex-wrap">
                {[
                  { id: "home", label: "Home" },
                  { id: "cart", label: "Cart" },
                  { id: "category", label: "Category" },
                  { id: "school", label: "School" },
                  { id: "order_placed", label: "Order Placed" },
                ].map(page => (
                  <label key={page.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.pages.includes(page.id)}
                      onChange={() => handleArrayChange("pages", page.id)}
                      className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="text-sm text-gray-700">{page.label}</span>
                  </label>
                ))}
              </div>
              {formData.pages.length === 0 && <p className="text-xs text-red-500 mt-1">Please select at least one page.</p>}
            </div>

            {/* Desktop Image */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Desktop Image *</label>
              <ImageUpload
                values={formData.desktopImageUrl ? [formData.desktopImageUrl] : []}
                onChange={(urls) => setFormData(prev => ({ ...prev, desktopImageUrl: urls[0] || "" }))}
                maxImages={1}
                multiple={false}
                bucket="carousel_images"
                folder="banners"
              />
              <p className="text-xs text-gray-500 mt-1">Recommended size: 1920x400 (or maintain 21:9 aspect ratio).</p>
            </div>

            {/* Mobile Image */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Image *</label>
              <ImageUpload
                values={formData.mobileImageUrl ? [formData.mobileImageUrl] : []}
                onChange={(urls) => setFormData(prev => ({ ...prev, mobileImageUrl: urls[0] || "" }))}
                maxImages={1}
                multiple={false}
                bucket="carousel_images"
                folder="banners"
              />
              <p className="text-xs text-gray-500 mt-1">Recommended size: 600x800 (or maintain 16:9 vertical aspect ratio).</p>
            </div>

            {/* Redirect URL */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Redirect URL (Optional)</label>
              <input
                type="url"
                name="redirectUrl"
                value={formData.redirectUrl}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <p className="text-xs text-gray-500 mt-1">URL to open when the banner is clicked.</p>
            </div>

            {/* Alt Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Alt Text (Optional)</label>
              <input
                type="text"
                name="altText"
                value={formData.altText}
                onChange={handleChange}
                placeholder="Description for screen readers"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
              <input
                type="number"
                name="sortOrder"
                value={formData.sortOrder}
                onChange={(e) => setFormData(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <p className="text-xs text-gray-500 mt-1">Lower numbers appear first.</p>
            </div>

            {/* Is Active */}
            <div className="flex items-center mt-4">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-gray-900">
                Banner is Active
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-100 gap-4 mb-10">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/banners")}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              disabled={formData.cities.length === 0 || formData.pages.length === 0}
              icon={Save}
              className="px-8"
            >
              {isEditing ? "Update Banner" : "Save Banner"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BannerFormPage;
