import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  useEditor,
  EditorContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Image as ImageIcon,
  Link as LinkIcon,
  Table as TableIcon,
  Heading1,
  Heading2,
  Undo,
  Redo,
  X,
  Check,
  Loader2,
  Grid,
  Trash2,
} from "lucide-react";
import api from "../../services/api";

/**
 * ResizableImageView Component
 * Renders an image with drag-to-resize handles
 */
const ResizableImageView = ({ node, updateAttributes, selected }) => {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const imageRef = useRef(null);
  const startDataRef = useRef({
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    aspectRatio: 1,
  });

  const { src, alt, width, height } = node.attrs;

  const handleMouseDown = useCallback((e, direction) => {
    e.preventDefault();
    e.stopPropagation();

    const img = imageRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();
    startDataRef.current = {
      width: rect.width,
      height: rect.height,
      x: e.clientX,
      y: e.clientY,
      aspectRatio: rect.width / rect.height,
    };

    setIsResizing(true);
    setResizeDirection(direction);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const {
        width: startWidth,
        height: startHeight,
        x: startX,
        y: startY,
        aspectRatio,
      } = startDataRef.current;

      let deltaX = e.clientX - startX;
      let deltaY = e.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      // Calculate new dimensions based on drag direction
      if (resizeDirection.includes("e")) {
        newWidth = Math.max(50, startWidth + deltaX);
      } else if (resizeDirection.includes("w")) {
        newWidth = Math.max(50, startWidth - deltaX);
      }

      if (resizeDirection.includes("s")) {
        newHeight = Math.max(50, startHeight + deltaY);
      } else if (resizeDirection.includes("n")) {
        newHeight = Math.max(50, startHeight - deltaY);
      }

      // Maintain aspect ratio for corner handles
      if (resizeDirection.length === 2) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          newHeight = newWidth / aspectRatio;
        } else {
          newWidth = newHeight * aspectRatio;
        }
      }

      updateAttributes({
        width: Math.round(newWidth),
        height: Math.round(newHeight),
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, resizeDirection, updateAttributes]);

  const handles = ["nw", "n", "ne", "w", "e", "sw", "s", "se"];

  return (
    <NodeViewWrapper className="resizable-image-wrapper">
      <div
        className={`resizable-image-container ${selected ? "selected" : ""} ${isResizing ? "resizing" : ""}`}
        style={{
          width: width ? `${width}px` : "auto",
          height: height ? `${height}px` : "auto",
          display: "inline-block",
          position: "relative",
        }}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt || ""}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
          }}
          draggable={false}
        />

        {selected && (
          <>
            {handles.map((direction) => (
              <div
                key={direction}
                className={`resize-handle resize-handle-${direction}`}
                onMouseDown={(e) => handleMouseDown(e, direction)}
              />
            ))}
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
};

/**
 * Custom ResizableImage Extension
 */
const ResizableImage = Image.extend({
  name: "resizableImage",

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute("width") ||
          element.style.width?.replace("px", ""),
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return { width: attributes.width };
        },
      },
      height: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute("height") ||
          element.style.height?.replace("px", ""),
        renderHTML: (attributes) => {
          if (!attributes.height) return {};
          return { height: attributes.height };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

/**
 * ImageGrid Node for displaying images in grid layouts
 */
const ImageGridView = ({
  node,
  updateAttributes,
  deleteNode,
  selected,
  editor,
}) => {
  const { layout, images, width } = node.attrs;
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const gridRef = useRef(null);
  const startDataRef = useRef({ width: 0, x: 0 });

  const getGridClass = () => {
    switch (layout) {
      case "2x1":
        return "image-grid-2x1";
      case "2x2":
        return "image-grid-2x2";
      case "3x1":
        return "image-grid-3x1";
      case "4x1":
        return "image-grid-4x1";
      case "2x3":
        return "image-grid-2x3";
      case "3x2":
        return "image-grid-3x2";
      case "3x3":
        return "image-grid-3x3";
      default:
        return "image-grid-2x2";
    }
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    if (newImages.length === 0) {
      deleteNode();
    } else {
      updateAttributes({ images: newImages });
    }
  };

  // Drag-and-drop handlers for reordering
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
    // Add a slight delay to show the drag effect
    setTimeout(() => {
      e.target.style.opacity = "0.5";
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = "1";
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e) => {
    // Only reset if we're leaving the grid item entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = draggedIndex;

    if (dragIndex === null || dragIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder images
    const newImages = [...images];
    const [draggedImage] = newImages.splice(dragIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    updateAttributes({ images: newImages });
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Resize handlers
  const handleMouseDown = useCallback((e, direction) => {
    e.preventDefault();
    e.stopPropagation();

    const grid = gridRef.current;
    if (!grid) return;

    const rect = grid.getBoundingClientRect();
    startDataRef.current = {
      width: rect.width,
      x: e.clientX,
    };

    setIsResizing(true);
    setResizeDirection(direction);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const { width: startWidth, x: startX } = startDataRef.current;

      const deltaX = e.clientX - startX;
      let newWidth = startWidth;

      // Calculate new width based on drag direction
      if (resizeDirection === "e" || resizeDirection === "se") {
        newWidth = Math.max(200, startWidth + deltaX);
      } else if (resizeDirection === "w") {
        newWidth = Math.max(200, startWidth - deltaX);
      }

      updateAttributes({
        width: Math.round(newWidth),
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, resizeDirection, updateAttributes]);

  const handles = ["w", "e", "se"];

  return (
    <NodeViewWrapper className="image-grid-wrapper">
      <div
        ref={gridRef}
        className={`image-grid-resizable-container ${selected ? "selected" : ""} ${isResizing ? "resizing" : ""}`}
        style={{
          width: width ? `${width}px` : "100%",
          position: "relative",
        }}
      >
        <div className={`image-grid ${getGridClass()}`}>
          {images.map((img, index) => (
            <div
              key={index}
              className={`image-grid-item ${
                draggedIndex === index ? "dragging" : ""
              } ${dragOverIndex === index ? "drag-over" : ""}`}
              draggable={selected}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
            >
              <img
                src={img.src}
                alt={img.alt || `Image ${index + 1}`}
                draggable={false}
              />
              {selected && (
                <>
                  <div
                    className="image-grid-drag-handle"
                    title="Drag to reorder"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <circle cx="8" cy="6" r="2" />
                      <circle cx="16" cy="6" r="2" />
                      <circle cx="8" cy="12" r="2" />
                      <circle cx="16" cy="12" r="2" />
                      <circle cx="8" cy="18" r="2" />
                      <circle cx="16" cy="18" r="2" />
                    </svg>
                  </div>
                  <button
                    className="image-grid-remove-btn"
                    onClick={() => removeImage(index)}
                    title="Remove image"
                  >
                    <X size={12} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Resize handles */}
        {selected && (
          <>
            <div
              className="grid-resize-handle grid-resize-handle-w"
              onMouseDown={(e) => handleMouseDown(e, "w")}
            />
            <div
              className="grid-resize-handle grid-resize-handle-e"
              onMouseDown={(e) => handleMouseDown(e, "e")}
            />
            <div
              className="grid-resize-handle grid-resize-handle-se"
              onMouseDown={(e) => handleMouseDown(e, "se")}
            />
          </>
        )}
      </div>
      {selected && (
        <div className="image-grid-controls">
          <span className="text-xs text-slate-500">Layout:</span>
          {["2x1", "2x2", "3x1", "4x1", "2x3", "3x2", "3x3"].map((l) => (
            <button
              key={l}
              className={`grid-layout-btn ${layout === l ? "active" : ""}`}
              onClick={() => updateAttributes({ layout: l })}
            >
              {l}
            </button>
          ))}
          <button
            className="grid-layout-btn"
            onClick={() => updateAttributes({ width: null })}
            title="Reset to full width"
          >
            100%
          </button>
          <button
            className="grid-delete-btn"
            onClick={deleteNode}
            title="Delete grid"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </NodeViewWrapper>
  );
};

const ImageGridNode = Node.create({
  name: "imageGrid",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      layout: {
        default: "2x2",
      },
      images: {
        default: [],
      },
      width: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-width"),
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return { "data-width": attributes.width };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-image-grid]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-image-grid": "" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageGridView);
  },
});

/**
 * MenuBar Component
 * Renders the toolbar with formatting buttons.
 */
const MenuBar = ({
  editor,
  onImageClick,
  onTableClick,
  onGridClick,
  isUploading,
}) => {
  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const ToolbarButton = ({
    onClick,
    isActive,
    disabled,
    icon: Icon,
    title,
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        isActive
          ? "bg-orange-100 text-orange-600"
          : "text-slate-500 hover:bg-slate-200 hover:text-slate-700"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <Icon size={16} className={title === "Uploading" ? "animate-spin" : ""} />
    </button>
  );

  return (
    <div className="bg-slate-50 border-b border-slate-200 p-2 flex flex-wrap gap-1 items-center sticky top-0 z-10">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        icon={Bold}
        title="Bold"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        icon={Italic}
        title="Italic"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        icon={UnderlineIcon}
        title="Underline"
      />

      <div className="w-px h-5 bg-slate-300 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive("heading", { level: 1 })}
        icon={Heading1}
        title="Heading 1"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        icon={Heading2}
        title="Heading 2"
      />

      <div className="w-px h-5 bg-slate-300 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        icon={List}
        title="Bullet List"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        icon={ListOrdered}
        title="Ordered List"
      />

      <div className="w-px h-5 bg-slate-300 mx-1" />

      <ToolbarButton
        onClick={setLink}
        isActive={editor.isActive("link")}
        icon={LinkIcon}
        title="Link"
      />
      <ToolbarButton
        onClick={onImageClick}
        icon={isUploading ? Loader2 : ImageIcon}
        title={isUploading ? "Uploading" : "Insert Image"}
        disabled={isUploading}
      />
      <ToolbarButton
        onClick={onTableClick}
        icon={TableIcon}
        title="Insert Table"
      />
      <ToolbarButton onClick={onGridClick} icon={Grid} title="Image Grid" />

      <div className="w-px h-5 bg-slate-300 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        icon={Undo}
        title="Undo"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        icon={Redo}
        title="Redo"
      />
    </div>
  );
};

/**
 * RichTextEditor Component
 */
const RichTextEditor = ({
  label,
  error,
  className = "",
  value,
  onChange,
  returnHtml = false,
}) => {
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [isUploading, setIsUploading] = useState(false);
  const [showGridDialog, setShowGridDialog] = useState(false);
  const [gridLayout, setGridLayout] = useState("2x2");
  const [gridImages, setGridImages] = useState([]);
  const [isGridUploading, setIsGridUploading] = useState(false);
  const fileInputRef = useRef(null);
  const gridFileInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({}),
      Underline,
      ResizableImage.configure({
        allowBase64: true,
        inline: false,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      ImageGridNode,
      Placeholder.configure({
        placeholder: "Write something amazing...",
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      // Return HTML or plain text based on returnHtml prop
      const content = returnHtml ? editor.getHTML() : editor.getText();
      onChange(content);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none p-4 min-h-[150px] focus:outline-none text-slate-700",
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      if (editor.getText() === "" && value === "") {
        editor.commands.clearContent();
      }
    }
  }, [value, editor]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("image", file);

        const response = await api.post("/images/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.data && response.data.success) {
          const url = response.data.data.url || response.data.url;
          editor
            .chain()
            .focus()
            .insertContent({ type: "resizableImage", attrs: { src: url } })
            .run();
        } else {
          console.error("Upload failed:", response.data);
          alert("Failed to upload image. Please try again.");
        }
      } catch (error) {
        console.error("Image upload error:", error);
        alert("Error uploading image.");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  const handleInsertTable = () => {
    const rows = parseInt(tableRows);
    const cols = parseInt(tableCols);
    if (rows > 0 && cols > 0) {
      editor
        .chain()
        .focus()
        .insertTable({ rows, cols, withHeaderRow: true })
        .run();
      setShowTableDialog(false);
    }
  };

  // Grid image handlers
  const handleGridImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsGridUploading(true);
    const uploadedImages = [];

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("image", file);

        const response = await api.post("/images/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (response.data && response.data.success) {
          const url = response.data.data.url || response.data.url;
          uploadedImages.push({ src: url, alt: file.name });
        }
      } catch (error) {
        console.error("Grid image upload error:", error);
      }
    }

    setGridImages((prev) => [...prev, ...uploadedImages]);
    setIsGridUploading(false);
    if (gridFileInputRef.current) {
      gridFileInputRef.current.value = "";
    }
  };

  const handleInsertGrid = () => {
    if (gridImages.length === 0) return;

    editor
      .chain()
      .focus()
      .insertContent({
        type: "imageGrid",
        attrs: {
          layout: gridLayout,
          images: gridImages,
        },
      })
      .run();

    setShowGridDialog(false);
    setGridImages([]);
    setGridLayout("2x2");
  };

  const removeGridImage = (index) => {
    setGridImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className} relative group`}>
      {label && (
        <label className="text-sm font-medium text-slate-700">{label}</label>
      )}

      <div
        className={`rounded-md border ${
          error ? "border-red-300" : "border-slate-200"
        } bg-white overflow-hidden focus-within:ring-2 focus-within:ring-orange-100 focus-within:border-orange-400 transition-all shadow-sm`}
      >
        <MenuBar
          editor={editor}
          onImageClick={handleImageClick}
          onTableClick={() => setShowTableDialog(!showTableDialog)}
          onGridClick={() => setShowGridDialog(!showGridDialog)}
          isUploading={isUploading}
        />
        <div className="bg-white relative min-h-[150px]">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* Table Dialog Popover */}
      {showTableDialog && (
        <div className="absolute top-12 right-0 md:left-48 z-20 bg-white p-4 rounded-lg shadow-xl border border-slate-200 w-64 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-slate-800">
              Insert Table
            </h3>
            <button
              onClick={() => setShowTableDialog(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Rows</label>
              <input
                type="number"
                min="1"
                max="10"
                value={tableRows}
                onChange={(e) => setTableRows(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-orange-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Columns
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={tableCols}
                onChange={(e) => setTableCols(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-orange-200 focus:outline-none"
              />
            </div>
          </div>
          <button
            onClick={handleInsertTable}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm py-1.5 rounded transition-colors flex items-center justify-center gap-2"
          >
            <Check size={14} /> Insert Table
          </button>
        </div>
      )}

      {/* Grid Dialog Popover */}
      {showGridDialog && (
        <div className="absolute top-12 right-0 md:left-64 z-20 bg-white p-4 rounded-lg shadow-xl border border-slate-200 w-80 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-slate-800">
              Create Image Grid
            </h3>
            <button
              onClick={() => {
                setShowGridDialog(false);
                setGridImages([]);
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          </div>

          {/* Layout Selection */}
          <div className="mb-3">
            <label className="text-xs text-slate-500 mb-2 block">
              Select Layout
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["2x1", "2x2", "3x1", "2x3", "3x2", "3x3"].map((layout) => (
                <button
                  key={layout}
                  onClick={() => setGridLayout(layout)}
                  className={`px-2 py-1.5 text-xs rounded border transition-colors ${
                    gridLayout === layout
                      ? "bg-orange-100 border-orange-400 text-orange-600"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {layout}
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload Area */}
          <div className="mb-3">
            <label className="text-xs text-slate-500 mb-2 block">
              Upload Images
            </label>
            <div
              onClick={() => gridFileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center cursor-pointer hover:border-orange-400 transition-colors"
            >
              {isGridUploading ? (
                <div className="flex items-center justify-center gap-2 text-slate-500">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Uploading...</span>
                </div>
              ) : (
                <div className="text-slate-500">
                  <ImageIcon size={24} className="mx-auto mb-1" />
                  <span className="text-sm">Click to upload images</span>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={gridFileInputRef}
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleGridImageUpload}
            />
          </div>

          {/* Uploaded Images Preview */}
          {gridImages.length > 0 && (
            <div className="mb-3">
              <label className="text-xs text-slate-500 mb-2 block">
                Uploaded ({gridImages.length} images)
              </label>
              <div className="flex flex-wrap gap-2">
                {gridImages.map((img, index) => (
                  <div key={index} className="relative w-12 h-12 group">
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="w-full h-full object-cover rounded border border-slate-200"
                    />
                    <button
                      onClick={() => removeGridImage(index)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleInsertGrid}
            disabled={gridImages.length === 0}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm py-1.5 rounded transition-colors flex items-center justify-center gap-2"
          >
            <Grid size={14} /> Insert Grid
          </button>
        </div>
      )}

      {error && <span className="text-xs text-red-500">{error}</span>}

      {/* Custom Styles for Editor Rendering */}
      <style>{`
        /* Heading Styles */
        .ProseMirror h1 {
          font-size: 1.5em;
          font-weight: 700;
          line-height: 1.2;
          margin-top: 0.75em;
          margin-bottom: 0.5em;
          color: #111827;
        }
        .ProseMirror h2 {
          font-size: 1.25em;
          font-weight: 600;
          line-height: 1.3;
          margin-top: 0.75em;
          margin-bottom: 0.5em;
          color: #374151;
        }

        /* List Styles */
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.6em;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.6em;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        .ProseMirror li {
          margin-top: 0.25em;
          margin-bottom: 0.25em;
        }
        
        /* Table Styles */
        .ProseMirror table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 0;
          overflow: hidden;
        }
        .ProseMirror td,
        .ProseMirror th {
          min-width: 1em;
          border: 1px solid #cbd5e1;
          padding: 6px 8px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }
        .ProseMirror th {
          font-weight: 600;
          text-align: left;
          background-color: #f8fafc;
        }
        .ProseMirror .selectedCell:after {
          z-index: 2;
          position: absolute;
          content: "";
          left: 0; right: 0; top: 0; bottom: 0;
          background: rgba(200, 200, 255, 0.4);
          pointer-events: none;
        }
        .column-resize-handle {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: -2px;
          width: 4px;
          background-color: #adf;
          pointer-events: none;
        }
        .tableWrapper {
          overflow-x: auto;
        }
        .resize-cursor {
          cursor: ew-resize;
          cursor: col-resize;
        }
        
        /* Resizable Image Styles */
        .resizable-image-wrapper {
          display: inline-block;
          margin: 0.5em 0;
        }
        .resizable-image-container {
          position: relative;
          display: inline-block;
          max-width: 100%;
        }
        .resizable-image-container img {
          border-radius: 0.5rem;
          display: block;
        }
        .resizable-image-container.selected {
          outline: 3px solid #f97316;
          outline-offset: 2px;
        }
        .resizable-image-container.resizing {
          user-select: none;
        }
        
        /* Resize Handles */
        .resize-handle {
          position: absolute;
          width: 10px;
          height: 10px;
          background: #f97316;
          border: 2px solid white;
          border-radius: 2px;
          z-index: 10;
        }
        .resize-handle-nw { top: -5px; left: -5px; cursor: nw-resize; }
        .resize-handle-n { top: -5px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
        .resize-handle-ne { top: -5px; right: -5px; cursor: ne-resize; }
        .resize-handle-w { top: 50%; left: -5px; transform: translateY(-50%); cursor: w-resize; }
        .resize-handle-e { top: 50%; right: -5px; transform: translateY(-50%); cursor: e-resize; }
        .resize-handle-sw { bottom: -5px; left: -5px; cursor: sw-resize; }
        .resize-handle-s { bottom: -5px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
        .resize-handle-se { bottom: -5px; right: -5px; cursor: se-resize; }
        
        /* Image Grid Styles */
        .image-grid-wrapper {
          margin: 1em 0;
        }
        .image-grid {
          display: grid;
          gap: 8px;
          border-radius: 0.5rem;
          overflow: hidden;
        }
        .image-grid.selected {
          outline: 3px solid #f97316;
          outline-offset: 2px;
        }
        .image-grid-2x1 { grid-template-columns: repeat(2, 1fr); }
        .image-grid-2x2 { grid-template-columns: repeat(2, 1fr); }
        .image-grid-3x1 { grid-template-columns: repeat(3, 1fr); }
        .image-grid-4x1 { grid-template-columns: repeat(4, 1fr); }
        .image-grid-2x3 { grid-template-columns: repeat(2, 1fr); }
        .image-grid-3x2 { grid-template-columns: repeat(3, 1fr); }
        .image-grid-3x3 { grid-template-columns: repeat(3, 1fr); }
        
        .image-grid-item {
          position: relative;
          aspect-ratio: 1;
          overflow: hidden;
          border-radius: 0.375rem;
        }
        .image-grid-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .image-grid-remove-btn {
          position: absolute;
          top: 4px;
          right: 4px;
          background: rgba(239, 68, 68, 0.9);
          color: white;
          border: none;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .image-grid-item:hover .image-grid-remove-btn {
          opacity: 1;
        }
        
        /* Drag and Drop Styles */
        .image-grid-item.dragging {
          opacity: 0.5;
          transform: scale(0.95);
        }
        .image-grid-item.drag-over {
          outline: 3px dashed #f97316;
          outline-offset: -3px;
          background: rgba(249, 115, 22, 0.1);
        }
        .image-grid-item[draggable="true"] {
          cursor: grab;
        }
        .image-grid-item[draggable="true"]:active {
          cursor: grabbing;
        }
        .image-grid-drag-handle {
          position: absolute;
          top: 4px;
          left: 4px;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          border-radius: 4px;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: grab;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .image-grid-item:hover .image-grid-drag-handle {
          opacity: 1;
        }
        .image-grid-drag-handle:active {
          cursor: grabbing;
        }
        .image-grid-controls {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 8px;
          padding: 6px;
          background: #f8fafc;
          border-radius: 0.375rem;
          flex-wrap: wrap;
        }
        .grid-layout-btn {
          padding: 2px 8px;
          font-size: 11px;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          background: white;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s;
        }
        .grid-layout-btn:hover {
          background: #f1f5f9;
        }
        .grid-layout-btn.active {
          background: #fed7aa;
          border-color: #f97316;
          color: #ea580c;
        }
        .grid-delete-btn {
          margin-left: auto;
          padding: 4px;
          color: #ef4444;
          background: white;
          border: 1px solid #fecaca;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .grid-delete-btn:hover {
          background: #fef2f2;
        }
        
        /* Grid Resizable Container */
        .image-grid-resizable-container {
          position: relative;
          max-width: 100%;
          overflow: visible;
        }
        .image-grid-resizable-container.selected {
          outline: 3px solid #f97316;
          outline-offset: 4px;
        }
        .image-grid-resizable-container.resizing {
          user-select: none;
        }
        
        /* Grid Resize Handles */
        .grid-resize-handle {
          position: absolute;
          background: #f97316;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          z-index: 100;
          pointer-events: auto;
        }
        .grid-resize-handle:hover {
          background: #ea580c;
          transform: scale(1.1);
        }
        .grid-resize-handle-w {
          top: 50%;
          left: -8px;
          width: 12px;
          height: 28px;
          transform: translateY(-50%);
          cursor: ew-resize;
          border-radius: 4px;
        }
        .grid-resize-handle-w:hover {
          transform: translateY(-50%) scale(1.1);
        }
        .grid-resize-handle-e {
          top: 50%;
          right: -8px;
          width: 12px;
          height: 28px;
          transform: translateY(-50%);
          cursor: ew-resize;
          border-radius: 4px;
        }
        .grid-resize-handle-e:hover {
          transform: translateY(-50%) scale(1.1);
        }
        .grid-resize-handle-se {
          bottom: -8px;
          right: -8px;
          width: 16px;
          height: 16px;
          cursor: nwse-resize;
          border-radius: 4px;
        }
        .grid-resize-handle-se:hover {
          transform: scale(1.1);
        }
        
        /* Legacy Image Styles */
        .ProseMirror img {
            display: block;
            max-width: 100%;
            height: auto;
            border-radius: 0.5rem;
            margin: 0.5em 0;
        }
        .ProseMirror img.ProseMirror-selectednode {
            outline: 3px solid #f97316;
        }
        
        /* Placeholder */
        .ProseMirror p.is-editor-empty:first-child::before {
            color: #94a3b8;
            content: attr(data-placeholder);
            float: left;
            height: 0;
            pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
