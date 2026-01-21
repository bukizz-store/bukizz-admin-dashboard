import React, { useState } from "react";
import {
  X,
  Save,
  Loader2,
  MapPin,
  Building,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { Button, Input } from "../ui";
import { useToast } from "../../context/ToastContext";
import api from "../../services/api";

const AddWarehouseModal = ({ isOpen, onClose, retailerId, onSuccess }) => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contact_email: "",
    contact_phone: "",
    address: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "India",
    },
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("addr_")) {
      const addrField = name.replace("addr_", "");
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [addrField]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        retailerId: retailerId,
        name: formData.name,
        contactEmail: formData.contact_email,
        contactPhone: formData.contact_phone,
        address: {
          line1: formData.address.line1,
          line2: formData.address.line2,
          city: formData.address.city,
          state: formData.address.state,
          postalCode: formData.address.postal_code,
          country: formData.address.country,
        },
      };

      // Real API call
      const response = await api.post("/warehouses/admin", payload);
      console.log("Warehouse added successfully", response.data);
      toast.success("Warehouse added successfully");
      onSuccess(response.data.data || response.data || payload); // Pass back real data if avail

      onClose();
      // Reset form
      setFormData({
        name: "",
        contact_email: "",
        contact_phone: "",
        address: {
          line1: "",
          line2: "",
          city: "",
          state: "",
          postal_code: "",
          country: "India",
        },
      });
    } catch (error) {
      console.error("Failed to add warehouse:", error);
      toast.error("Failed to add warehouse");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Add New Warehouse
            </h2>
            <p className="text-sm text-slate-500">
              Register a warehouse location for this retailer.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto max-h-[80vh]"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Building size={16} className="text-slate-400" /> Basic Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Warehouse Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ex. North Zone Depot"
                  required
                />
                <Input
                  label="Contact Phone"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  placeholder="+91..."
                  icon={Phone}
                />
                <div className="col-span-2">
                  <Input
                    label="Contact Email"
                    name="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    placeholder="warehouse@example.com"
                    icon={Mail}
                  />
                </div>
              </div>
            </div>

            <div className="col-span-2 border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-slate-400" /> Location Address
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Input
                    label="Address Line 1"
                    name="addr_line1"
                    value={formData.address.line1}
                    onChange={handleChange}
                    placeholder="Street address, building, floor..."
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    label="Address Line 2"
                    name="addr_line2"
                    value={formData.address.line2}
                    onChange={handleChange}
                    placeholder="Landmark, suite, unit, etc. (Optional)"
                  />
                </div>
                <Input
                  label="City"
                  name="addr_city"
                  value={formData.address.city}
                  onChange={handleChange}
                  placeholder="Ex. Mumbai"
                  required
                />
                <Input
                  label="State"
                  name="addr_state"
                  value={formData.address.state}
                  onChange={handleChange}
                  placeholder="Ex. Maharashtra"
                  required
                />
                <Input
                  label="Postal Code"
                  name="addr_postal_code"
                  value={formData.address.postal_code}
                  onChange={handleChange}
                  placeholder="Ex. 400001"
                  required
                />
                <Input
                  label="Country"
                  name="addr_country"
                  value={formData.address.country}
                  onChange={handleChange}
                  disabled
                  className="bg-slate-50"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={isSubmitting ? Loader2 : Save}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Warehouse"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWarehouseModal;
