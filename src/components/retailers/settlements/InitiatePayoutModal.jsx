import React, { useState, useEffect } from "react";
import { X, Banknote } from "lucide-react";
import { Button, Input, Select } from "../../ui";
import { useToast } from "../../../context/ToastContext";
import api from "../../../services/api";

const formatINR = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(num);
};

const PAYMENT_MODE_OPTIONS = [
  { value: "NEFT", label: "NEFT" },
  { value: "IMPS", label: "IMPS" },
  { value: "RTGS", label: "RTGS" },
  { value: "UPI", label: "UPI" },
  { value: "MANUAL_CASH", label: "Manual Cash" },
];

const CASH_MODE = "MANUAL_CASH";

const InitiatePayoutModal = ({
  isOpen,
  onClose,
  retailerId,
  totalOwed,
  onSuccess,
}) => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    paymentMode: "",
    referenceNumber: "",
    notes: "",
    receiptFile: null,
  });
  const [errors, setErrors] = useState({});

  // Pre-fill amount whenever modal opens or totalOwed changes
  useEffect(() => {
    if (isOpen) {
      setForm({
        amount: String(Number(totalOwed) || ""),
        paymentMode: "",
        referenceNumber: "",
        notes: "",
        receiptFile: null,
      });
      setErrors({});
    }
  }, [isOpen, totalOwed]);

  // Lock scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleChange = (field) => (e) => {
    if (field === "receiptFile") {
      setForm((prev) => ({ ...prev, [field]: e.target.files[0] || null }));
    } else {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    }
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    const amount = Number(form.amount);

    if (!form.amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = "Please enter a valid amount greater than ₹0.";
    } else if (amount > Number(totalOwed)) {
      newErrors.amount = `Amount cannot exceed the available balance of ${formatINR(totalOwed)}.`;
    }

    if (!form.paymentMode) {
      newErrors.paymentMode = "Please select a payment mode.";
    }

    if (
      form.paymentMode &&
      form.paymentMode !== CASH_MODE &&
      !form.referenceNumber.trim()
    ) {
      newErrors.referenceNumber =
        "UTR / Reference number is required for bank transfers.";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    let receiptUrl;

    try {
      // Step 1: Upload Receipt File if provided
      if (form.receiptFile) {
        const uploadData = new FormData();
        uploadData.append("image", form.receiptFile); // API expects 'image' key
        uploadData.append("bucket", "settlements");
        uploadData.append("folder", "receipts");

        const uploadRes = await api.post("/images/upload", uploadData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        receiptUrl = uploadRes.data?.url || uploadRes.data?.data?.url;
      }

      // Step 2: Execute Payout with the receipt URL
      await api.post("/settlements/admin/execute", {
        retailerId,
        amount: Number(form.amount),
        paymentMode: form.paymentMode,
        referenceNumber: form.referenceNumber.trim() || undefined,
        notes: form.notes.trim() || undefined,
        receiptUrl,
      });

      toast.success("Payout executed successfully!");
      onClose();
      onSuccess?.();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to execute payout. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Banknote size={20} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Initiate Payout
              </h3>
              <p className="text-xs text-slate-400">
                Available:{" "}
                <span className="font-semibold text-emerald-600">
                  {formatINR(totalOwed)}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {/* Amount */}
            <Input
              label="Amount (₹)"
              type="number"
              min="0.01"
              step="0.01"
              max={totalOwed}
              value={form.amount}
              onChange={handleChange("amount")}
              error={errors.amount}
              placeholder={`Max: ${formatINR(totalOwed)}`}
            />

            {/* Payment Mode */}
            <Select
              label="Payment Mode"
              options={PAYMENT_MODE_OPTIONS}
              value={form.paymentMode}
              onChange={handleChange("paymentMode")}
              placeholder="Select payment mode"
              error={errors.paymentMode}
            />

            {/* Reference / UTR */}
            <Input
              label={
                form.paymentMode === CASH_MODE
                  ? "Reference Number (Optional)"
                  : "UTR / Reference Number *"
              }
              type="text"
              value={form.referenceNumber}
              onChange={handleChange("referenceNumber")}
              error={errors.referenceNumber}
              placeholder={
                form.paymentMode === CASH_MODE
                  ? "e.g. Receipt number (optional)"
                  : "e.g. UTR12345678"
              }
            />

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">
                Notes{" "}
                <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                value={form.notes}
                onChange={handleChange("notes")}
                placeholder="Any additional remarks for this payout..."
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition-all"
              />
            </div>

            {/* Receipt Upload */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
              <label className="text-sm font-medium text-slate-700">
                Payment Receipt{" "}
                <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="file"
                accept=".pdf, .png, .jpg, .jpeg"
                onChange={handleChange("receiptFile")}
                className="w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-orange-50 file:text-orange-700
                  hover:file:bg-orange-100 cursor-pointer
                "
              />
              <p className="text-xs text-slate-400 mt-1">
                Supported formats: PDF, PNG, JPG (Max 5MB)
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 text-white"
            >
              {isSubmitting ? "Processing..." : "Confirm Payout"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InitiatePayoutModal;
