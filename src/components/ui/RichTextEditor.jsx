import React from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Image as ImageIcon,
} from "lucide-react";

const RichTextEditor = ({ label, error, className = "", ...props }) => {
  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-slate-700">{label}</label>
      )}

      <div
        className={`rounded-md border ${
          error ? "border-red-300" : "border-slate-200"
        } bg-white overflow-hidden focus-within:ring-2 focus-within:ring-orange-100 focus-within:border-orange-400 transition-all`}
      >
        {/* Toolbar */}
        <div className="bg-slate-50 border-b border-slate-200 p-2 flex gap-1">
          <ToolbarButton icon={Bold} />
          <ToolbarButton icon={Italic} />
          <ToolbarButton icon={Underline} />
          <div className="w-px h-5 bg-slate-300 mx-1 self-center" />
          <ToolbarButton icon={List} />
          <ToolbarButton icon={ListOrdered} />
          <div className="w-px h-5 bg-slate-300 mx-1 self-center" />
          <ToolbarButton icon={ImageIcon} />
        </div>

        {/* Editor Area */}
        <textarea
          className="w-full min-h-[120px] p-3 text-sm text-slate-700 focus:outline-none resize-y"
          placeholder="Start typing..."
          value={props.value}
          onChange={(e) => props.onChange && props.onChange(e.target.value)}
        />
      </div>

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};

const ToolbarButton = ({ icon: Icon }) => (
  <button
    type="button"
    className="p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
  >
    <Icon size={16} />
  </button>
);

export default RichTextEditor;
