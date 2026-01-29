import React, { useState, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
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
} from "lucide-react";
import api from "../../services/api";

/**
 * MenuBar Component
 * Renders the toolbar with formatting buttons.
 */
const MenuBar = ({ editor, onImageClick, onTableClick, isUploading }) => {
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
 * ImageResizeMenu Component
 * A custom floating menu that appears when an image is selected.
 */
const ImageResizeMenu = ({ editor }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!editor) return;

    const updateMenu = () => {
      const isImageActive = editor.isActive("image");
      setShowMenu(isImageActive);

      if (isImageActive) {
        // Get position of selected image
        const { view } = editor;
        const { from } = view.state.selection;
        const node = view.nodeDOM(from);

        if (node && node.getBoundingClientRect) {
          const rect = node.getBoundingClientRect();
          const editorRect = view.dom.getBoundingClientRect();
          setMenuPosition({
            top: rect.top - editorRect.top - 40,
            left: rect.left - editorRect.left + rect.width / 2 - 80,
          });
        }
      }
    };

    editor.on("selectionUpdate", updateMenu);
    editor.on("transaction", updateMenu);

    return () => {
      editor.off("selectionUpdate", updateMenu);
      editor.off("transaction", updateMenu);
    };
  }, [editor]);

  if (!showMenu || !editor) return null;

  const setImageWidth = (width) => {
    editor
      .chain()
      .focus()
      .updateAttributes("image", { style: `width: ${width}` })
      .run();
  };

  return (
    <div
      className="absolute bg-white shadow-lg border border-slate-200 rounded-md p-1 flex gap-1 z-30"
      style={{ top: menuPosition.top, left: menuPosition.left }}
    >
      <button
        onClick={() => setImageWidth("25%")}
        className="text-xs px-2 py-1 hover:bg-slate-100 rounded text-slate-600"
      >
        25%
      </button>
      <button
        onClick={() => setImageWidth("50%")}
        className="text-xs px-2 py-1 hover:bg-slate-100 rounded text-slate-600"
      >
        50%
      </button>
      <button
        onClick={() => setImageWidth("100%")}
        className="text-xs px-2 py-1 hover:bg-slate-100 rounded text-slate-600"
      >
        100%
      </button>
      <button
        onClick={() => {
          const width = window.prompt("Enter width (e.g. 300px or 60%)");
          if (width) setImageWidth(width);
        }}
        className="text-xs px-2 py-1 hover:bg-slate-100 rounded text-slate-600"
      >
        Custom
      </button>
    </div>
  );
};

/**
 * RichTextEditor Component
 */
const RichTextEditor = ({ label, error, className = "", value, onChange }) => {
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({}),
      Underline,
      Image.configure({
        allowBase64: true,
        inline: true,
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
      Placeholder.configure({
        placeholder: "Write something amazing...",
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
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
          editor.chain().focus().setImage({ src: url }).run();
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
          isUploading={isUploading}
        />
        <div className="bg-white relative min-h-[150px]">
          <ImageResizeMenu editor={editor} />
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
        
        /* Image Styles */
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
