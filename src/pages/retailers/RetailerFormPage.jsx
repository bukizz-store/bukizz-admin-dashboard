import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button, Input } from "../../components/ui";
import { useToast } from "../../context/ToastContext";
import api from "../../services/api";

const RetailerFormPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    dob: "",
    city: "",
    state: "",
    gender: "male",
    is_active: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validate = () => {
    if (!formData.full_name.trim()) {
      toast.error("Full Name is required");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!formData.password.trim()) {
      toast.error("Password is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Step 1: Register User
      const registerPayload = {
        fullName: formData.full_name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        provider: "email",
      };

      // console.log("Step 1: Registering", registerPayload);
      const registerRes = await api.post("/auth/register", registerPayload);
      console.log("Step 1: Registering", registerRes.data);
      const { data } = registerRes.data;
      const { user } = data;
      const { id } = user;
      // Step 2: Update Profile
      const profilePayload = {
        fullName: formData.full_name,
        phone: formData.phone,
        city: formData.city,
        state: formData.state,
        dob: formData.dob,
        gender: formData.gender,
        is_active: formData.is_active,
        role: "retailer",
        metadata: {
          source: "admin_dashboard",
          onboarded_by: "admin",
        },
      };

      // console.log("Step 2: Updating Profile", profilePayload);
      const profileRes = await api.put(`/users/admin/${id}`, profilePayload);
      console.log("Step 2: Updating Profile", profileRes.data);

      toast.success("Retailer created successfully");
      navigate("/retailers");
    } catch (error) {
      console.error("Failed to create retailer:", error);
      toast.error("Failed to create retailer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-bukizz-bg min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/retailers")}
          className="flex items-center text-slate-500 hover:text-slate-700 transition-colors mb-2"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to Retailers
        </button>
        <h1 className="text-2xl font-bold text-bukizz-navy">
          Onboard New Retailer
        </h1>
      </div>

      <div className="max-w-3xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-semibold text-slate-800">
              New Retailer Registration
            </h2>
            <p className="text-sm text-slate-500">
              Enter the retailer's basic details to create their account.
            </p>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="col-span-2 md:col-span-1">
              <Input
                label="Full Name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Ex. Rahul Sharma"
                icon={User}
                required
              />
            </div>

            {/* Email */}
            <div className="col-span-2 md:col-span-1">
              <Input
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="rahul@example.com"
                icon={Mail}
                required
              />
            </div>

            {/* Phone */}
            <div className="col-span-2 md:col-span-1">
              <Input
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                icon={Phone}
              />
            </div>

            {/* Password */}
            <div className="col-span-2 md:col-span-1">
              <Input
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Secure Password"
                required
              />
            </div>

            {/* Date of Birth */}
            <div className="col-span-2 md:col-span-1">
              <Input
                label="Date of Birth"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleChange}
                required
              />
            </div>

            {/* Gender */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Gender
              </label>
              <div className="relative">
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none text-slate-900 text-sm"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* City */}
            <div className="col-span-2 md:col-span-1">
              <Input
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Ex. New Delhi"
                icon={MapPin}
              />
            </div>

            {/* State */}
            <div className="col-span-2 md:col-span-1">
              <Input
                label="State"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="Ex. Delhi"
                icon={MapPin}
              />
            </div>

            {/* Is Active */}
            <div className="col-span-2">
              <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                />
                <div>
                  <div className="font-medium text-slate-900">
                    Active Account
                  </div>
                  <div className="text-xs text-slate-500">
                    If unchecked, the retailer won't be able to log in
                    immediately.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/retailers")}
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
              {isSubmitting ? "Creating..." : "Create Retailer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RetailerFormPage;
