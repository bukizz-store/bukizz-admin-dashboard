import React from "react";
import { useAuth } from "../../context/AuthContext";
import StatusBadge from "../../components/common/StatusBadge";
import { LogOut, User, Mail, ShieldCheck } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { useNavigate } from "react-router-dom";

// Note: Adjusting imports based on project structure knowledge
// Input is in components/ui/Input.jsx
// Button is in components/ui/Button.jsx

import InputField from "../../components/ui/Input";
import ActionButton from "../../components/ui/Button";

const UserProfile = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.info("Logged out successfully");
    navigate("/login");
  };

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
        <p className="text-slate-500">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Helper Banner/Background (Optional visual flair) */}
        <div className="h-32 bg-linear-to-r from-slate-800 to-bukizz-navy"></div>

        <div className="px-8 pb-8">
          {/* Avatar - Negative Margin to pull it up */}
          <div className="relative -mt-12 mb-6 flex justify-between items-end">
            <div className="w-24 h-24 rounded-full bg-white p-1.5 shadow-md">
              <div className="w-full h-full rounded-full bg-bukizz-orange flex items-center justify-center text-white text-3xl font-bold">
                {getInitials(user.full_name)}
              </div>
            </div>

            {/* Status Badge */}
            <div className="mb-2">
              <StatusBadge
                status={user.isVerified ? "Verified Account" : "Unverified"}
                type={user.isVerified ? "success" : "warning"}
              />
            </div>
          </div>

          {/* Read Only Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Full Name"
              value={user.name || user.full_name || ""}
              icon={User}
              readOnly
              className="bg-slate-50 border-slate-200"
            />

            <InputField
              label="Email Address"
              value={user.email || ""}
              icon={Mail}
              readOnly
              className="bg-slate-50 border-slate-200"
            />

            <InputField
              label="User Role"
              value={user.role || "Administrator"}
              icon={ShieldCheck}
              readOnly
              className="bg-slate-50 border-slate-200"
            />

            <div className="md:col-span-2 pt-6 border-t border-slate-100 flex justify-end">
              <ActionButton
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                onClick={handleLogout}
              >
                <LogOut size={16} className="mr-2" />
                Sign Out
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
