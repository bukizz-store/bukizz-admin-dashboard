import React, { useState, useEffect } from "react";
import {
  useParams,
  useNavigate,
  Link,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  School,
  MapPin,
  Image as ImageIcon,
  Save,
} from "lucide-react";
import { Input, ImageUpload, Button } from "../../components/ui";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";

const SchoolFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isEditMode = Boolean(id);

  const [isLoading, setIsLoading] = useState(false);

  // Core Data State
  const [formData, setFormData] = useState({
    name: "",
    board: "",
    type: "", // public, private, charter, international, other
    email: "", // Top level & Contact level
    phone: "", // Top level & Contact level
    website: "", // Contact level only
    // Address
    addr_line1: "",
    addr_line2: "",
    addr_city: "",
    addr_state: "",
    addr_pincode: "",
    addr_country: "India",
  });

  // Media State (Only one image supported by schema)
  const [imageFile, setImageFile] = useState(null);
  const [initialImage, setInitialImage] = useState(null);

  // Fetch Data on Edit
  useEffect(() => {
    if (isEditMode) {
      const fetchSchool = async () => {
        setIsLoading(true);
        try {
          const response = await api.get(`/schools/${id}`);
          const data = response.data.data.school;

          setFormData({
            name: data.name || "",
            board: data.board || "",
            type: data.type || "",
            email: data.email || data.contact?.email || "",
            phone: data.phone || data.contact?.phone || "",
            website: data.contact?.website || "",
            addr_line1: data.address?.line1 || "",
            addr_line2: data.address?.line2 || "",
            addr_city: data.city || data.address?.city || "",
            addr_state: data.state || data.address?.state || "",
            addr_pincode: data.postalCode || data.address?.postalCode || "",
            addr_country: data.country || data.address?.country || "India",
          });

          if (data.image) setInitialImage(data.image);
        } catch (error) {
          console.error("Fetch failed", error);
          toast.error("Failed to load school details");
        } finally {
          setIsLoading(false);
        }
      };
      fetchSchool();
    }
  }, [id, isEditMode, toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const submitData = new FormData();

      // 1. Top Level Fields
      submitData.append("name", formData.name);
      submitData.append("type", formData.type);
      if (formData.board) submitData.append("board", formData.board);

      submitData.append("city", formData.addr_city);
      submitData.append("state", formData.addr_state);
      submitData.append("country", formData.addr_country);
      submitData.append("postalCode", formData.addr_pincode);

      submitData.append("phone", formData.phone);
      if (formData.email) submitData.append("email", formData.email);

      // 2. Address Object
      submitData.append("address[line1]", formData.addr_line1);
      if (formData.addr_line2)
        submitData.append("address[line2]", formData.addr_line2);
      submitData.append("address[city]", formData.addr_city);
      submitData.append("address[state]", formData.addr_state);
      submitData.append("address[postalCode]", formData.addr_pincode);
      submitData.append("address[country]", formData.addr_country);

      // 3. Contact Object
      submitData.append("contact[phone]", formData.phone);
      if (formData.email) submitData.append("contact[email]", formData.email);
      if (formData.website)
        submitData.append("contact[website]", formData.website);

      // 4. Image
      if (imageFile) submitData.append("image", imageFile);

      // Critical config for file upload
      const config = { headers: { "Content-Type": undefined } };

      if (isEditMode) {
        await api.put(`/schools/${id}`, submitData, config);
        toast.success("School updated successfully! Redirecting...");
      } else {
        await api.post("/schools", submitData, config);
        toast.success("School onboarded successfully! Redirecting...");
      }

      setTimeout(() => navigate("/schools"), 1200);
    } catch (error) {
      console.error("Submission error", error);
      toast.error("Failed to save school");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            to="/schools"
            className="inline-flex items-center text-slate-500 hover:text-slate-700 mb-2 transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Schools
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEditMode ? "Edit School" : "Onboard New School"}
          </h1>
          <p className="text-slate-500 mt-1">
            Complete the form below to register a new institution.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => navigate("/schools")}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isLoading}
            icon={Save}
          >
            {isEditMode ? "Save Changes" : "Publish School"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Identity Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-100">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2 bg-orange-50 text-orange-500 rounded-lg">
                <School size={20} />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">
                Institutional Details
              </h2>
            </div>

            <div className="space-y-6">
              <Input
                label="School Name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. St. Xavier's High School"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Affiliation Board <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="board"
                    value={formData.board}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                  >
                    <option value="">Select Board</option>
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                    <option value="IB">IB</option>
                    <option value="State Board">State Board</option>
                    <option value="IGCSE">IGCSE</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Institution Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                  >
                    <option value="">Select Type</option>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="charter">Charter</option>
                    <option value="international">International</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Official Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@school.edu"
                />
                <Input
                  label="Contact Number"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                />
              </div>
              <Input
                label="Website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://www.school.edu"
              />
            </div>
          </div>

          {/* Location Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-100">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                <MapPin size={20} />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">Location</h2>
            </div>

            <div className="space-y-6">
              <Input
                label="Street Address (Line 1)"
                name="addr_line1"
                required
                value={formData.addr_line1}
                onChange={handleChange}
                placeholder="Block, Street, Area"
              />
              <Input
                label="Street Address (Line 2)"
                name="addr_line2"
                value={formData.addr_line2}
                onChange={handleChange}
                placeholder="Apartment, Studio, or Floor"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="City"
                  name="addr_city"
                  required
                  value={formData.addr_city}
                  onChange={handleChange}
                  placeholder="e.g. Mumbai"
                />
                <Input
                  label="State"
                  name="addr_state"
                  required
                  value={formData.addr_state}
                  onChange={handleChange}
                  placeholder="e.g. Maharashtra"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Postal Code"
                  name="addr_pincode"
                  required
                  value={formData.addr_pincode}
                  onChange={handleChange}
                  placeholder="e.g. 400001"
                />
                <Input
                  label="Country"
                  name="addr_country"
                  value={formData.addr_country}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1/3) */}
        <div className="lg:col-span-1 space-y-8">
          {/* Branding Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-100">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2 bg-purple-50 text-purple-500 rounded-lg">
                <ImageIcon size={20} />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">Branding</h2>
            </div>

            <div className="space-y-6">
              <ImageUpload
                label="School Image / Logo"
                initialPreview={initialImage}
                onChange={(files) => {
                  if (files.length > 0) setImageFile(files[0]);
                }}
              />
              <p className="text-xs text-slate-400 -mt-4">
                Recommended: Square or Landscape (PNG/JPG)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolFormPage;
