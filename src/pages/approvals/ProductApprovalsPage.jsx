import React, { useState } from "react";
import DataTable from "../../components/common/DataTable";
import { CheckCircle, PackageSearch } from "lucide-react";
import Button from "../../components/ui/Button";
import ProductReviewModal from "./components/ProductReviewModal";
import { useToast } from "../../context/ToastContext";

const ProductApprovalsPage = () => {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // Placeholder data - replace with API call
  // Endpoint: GET {{api_base}}/products?approval_status=pending
  const [data, setData] = useState([
    {
      id: 101,
      title: "Premium Wireless Headphones",
      thumbnail: "https://via.placeholder.com/150",
      images: [
        "https://via.placeholder.com/600x600?text=Side+View",
        "https://via.placeholder.com/600x600?text=Front+View",
        "https://via.placeholder.com/600x600?text=In+Box",
      ],
      retailer: "John's Electronics",
      price: 2499,
      category: "Electronics",
      description:
        "<p><strong>High quality sound</strong> with noise cancellation. Perfect for daily commute.</p><ul><li>Bluetooth 5.0</li><li>20h Battery</li></ul>",
      specifications: {
        Brand: "SoundMax",
        Model: "SM-200",
        Color: "Black",
        Warranty: "1 Year",
      },
      submittedOn: "2023-11-01",
    },
    {
      id: 102,
      title: "Leather Laptop Bag",
      thumbnail: "https://via.placeholder.com/150?text=Bag",
      images: ["https://via.placeholder.com/600x600?text=Bag+View"],
      retailer: "Jane's Fashion",
      price: 4999,
      category: "Fashion",
      description: "<p>Genuine leather laptop bag for professionals.</p>",
      specifications: {
        Material: "Leather",
        Size: "15.6 inch",
        Color: "Brown",
      },
      submittedOn: "2023-11-02",
    },
  ]);

  const handleReview = (product) => {
    setSelectedProduct(product);
    setIsReviewOpen(true);
  };

  const handleApprove = async (id) => {
    // PATCH /products/:id/publish
    toast.success("Product approved and published!");
    setData((prev) => prev.filter((item) => item.id !== id));
    setIsReviewOpen(false);
  };

  const handleReject = async (id, reason) => {
    // PATCH /products/:id/reject with reason
    toast.success("Product rejected and returned to retailer.");
    setData((prev) => prev.filter((item) => item.id !== id));
    setIsReviewOpen(false);
  };

  const columns = [
    {
      header: "Product",
      key: "product",
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.thumbnail}
            alt={row.title}
            className="w-12 h-12 rounded object-cover border border-slate-200"
          />
          <span className="font-medium text-slate-800 line-clamp-1">
            {row.title}
          </span>
        </div>
      ),
    },
    {
      header: "Retailer",
      key: "retailer",
      render: (row) => <span className="text-slate-600">{row.retailer}</span>,
    },
    {
      header: "Category",
      key: "category",
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {row.category}
        </span>
      ),
    },
    {
      header: "Price",
      key: "price",
      render: (row) => (
        <span className="font-semibold text-slate-900">₹{row.price}</span>
      ),
    },
    {
      header: "Actions",
      key: "actions",
      render: (row) => (
        <Button
          size="sm"
          onClick={() => handleReview(row)}
          icon={PackageSearch}
        >
          Review
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Product Approvals</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {data.length > 0 ? (
          <DataTable columns={columns} data={data} />
        ) : (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-medium text-slate-900">All Clear!</h3>
            <p>No pending products to review.</p>
          </div>
        )}
      </div>

      <ProductReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        product={selectedProduct}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
};

export default ProductApprovalsPage;
