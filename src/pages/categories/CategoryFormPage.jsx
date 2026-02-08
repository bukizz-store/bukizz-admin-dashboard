import React, { useState, useEffect } from "react";
import {
  useParams,
  useNavigate,
  Link,
  useSearchParams,
} from "react-router-dom";
import { ArrowLeft, Edit3, Image as ImageIcon } from "lucide-react";
import {
  Input,
  RichTextEditor,
  ImageUpload,
  Button,
} from "../../components/ui";
import { AttributeArchitect } from "../../components/categories";
import api from "../../services/api";

const CategoryFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = Boolean(id);
  const parentIdParam = searchParams.get("parentId");

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    parentId: parentIdParam || null,
  });
  const [imageFile, setImageFile] = useState(null);
  const [initialImagePreview, setInitialImagePreview] = useState(null);
  const [attributes, setAttributes] = useState([]);

  // Slug generation utility
  const generateSlug = (text) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-") // Replace spaces with -
      .replace(/[^\w\-]+/g, "") // Remove all non-word chars
      .replace(/\-\-+/g, "-") // Replace multiple - with single -
      .replace(/^-+/, "") // Trim - from start
      .replace(/-+$/, ""); // Trim - from end
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  // Fetch data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchCategory = async () => {
        try {
          setIsLoading(true);
          const response = await api.get(`/categories/${id}`);
          const data = response.data.data.category;

          console.log(data);

          setFormData({
            name: data.name || "",
            slug: data.slug || generateSlug(data.name || ""),
            description: data.description || "",
            parentId: data.parentId || null,
          });

          // Load existing attributes if available
          if (data.productAttributes && Array.isArray(data.productAttributes)) {
            setAttributes(data.productAttributes);
          }

          if (data.image) {
            setInitialImagePreview(data.image);
          }
        } catch (error) {
          console.error("Failed to fetch category", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchCategory();
    }
  }, [id, isEditMode]);

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("slug", formData.slug);
      submitData.append("description", formData.description);
      submitData.append("productAttributes", JSON.stringify(attributes));
      if (formData.parentId) {
        submitData.append("parentId", formData.parentId);
      }

      if (imageFile) {
        submitData.append("image", imageFile);
      }

      // Critical: Unset Content-Type so browser sets the multipart boundary for files
      const config = {
        headers: {
          "Content-Type": undefined,
        },
      };

      if (isEditMode) {
        await api.put(`/categories/${id}`, submitData, config);
      } else {
        await api.post("/categories", submitData, config);
      }

      navigate("/categories");
    } catch (error) {
      console.error("Submission failed", error);
      // Ideally show a toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/categories"
          className="inline-flex items-center text-slate-500 hover:text-slate-700 mb-4 transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to List
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">
          {isEditMode ? "Edit Category" : "Add New Category"}
        </h1>
        <p className="text-slate-500 mt-1">
          Manage title, description and media for this category.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Section A: Basic Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
            <div className="p-2 bg-orange-50 text-orange-500 rounded-lg">
              <Edit3 size={20} />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">
              Basic Information
            </h2>
          </div>

          <div className="space-y-6">
            <Input
              label="Category Name"
              required
              value={formData.name}
              onChange={handleNameChange}
              placeholder="e.g. School Supplies"
            />

            <RichTextEditor
              label="Description"
              value={formData.description}
              onChange={(val) => setFormData({ ...formData, description: val })}
              placeholder="Enter details about this category..."
            />
          </div>
        </div>

        {/* Section B: Media & Offers */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
            <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
              <ImageIcon size={20} />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">
              Media & Offers
            </h2>
          </div>

          <div className="space-y-6">
            <ImageUpload
              label="Category Image"
              values={
                imageFile
                  ? [imageFile]
                  : initialImagePreview
                    ? [initialImagePreview]
                    : []
              }
              onChange={(files) => {
                if (files && files.length > 0) {
                  setImageFile(files[0]);
                } else {
                  setImageFile(null);
                  setInitialImagePreview(null);
                }
              }}
            />
          </div>
        </div>

        {/* Section C: Product Attributes */}
        <AttributeArchitect value={attributes} onChange={setAttributes} />
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end gap-4 mt-8">
        <Button variant="ghost" onClick={() => navigate("/categories")}>
          Cancel
        </Button>
        <Button variant="outline">Save as Draft</Button>
        <Button variant="primary" onClick={handleSubmit} isLoading={isLoading}>
          {isEditMode ? "Update Category" : "Create Category"}
        </Button>
      </div>
    </div>
  );
};

export default CategoryFormPage;
