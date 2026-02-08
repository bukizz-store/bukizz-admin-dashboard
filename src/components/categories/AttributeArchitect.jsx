import React, { useState, useCallback } from "react";
import { Plus, Layers } from "lucide-react";
import AttributeNode from "./AttributeNode";

// Generate UUID
const generateId = () => {
  return "attr_" + Math.random().toString(36).substring(2, 11);
};

// Create a new empty attribute
const createAttribute = () => ({
  id: generateId(),
  label: "",
  key: "",
  type: "text",
  required: false,
  config: {},
  fields: [],
});

const AttributeArchitect = ({ value = [], onChange }) => {
  // Use internal state if no external control provided
  const [internalAttributes, setInternalAttributes] = useState(value);

  const attributes = onChange ? value : internalAttributes;
  const setAttributes = onChange || setInternalAttributes;

  // Deep update helper - updates a node anywhere in the tree
  const updateNestedNode = useCallback(
    (id, newData) => {
      const updateRecursive = (nodes) => {
        return nodes.map((node) => {
          if (node.id === id) {
            return { ...node, ...newData };
          }
          if (node.fields && node.fields.length > 0) {
            return { ...node, fields: updateRecursive(node.fields) };
          }
          return node;
        });
      };

      setAttributes((prev) => updateRecursive(prev));
    },
    [setAttributes],
  );

  // Remove a node from anywhere in the tree
  const removeNode = useCallback(
    (id) => {
      const removeRecursive = (nodes) => {
        return nodes
          .filter((node) => node.id !== id)
          .map((node) => {
            if (node.fields && node.fields.length > 0) {
              return { ...node, fields: removeRecursive(node.fields) };
            }
            return node;
          });
      };

      setAttributes((prev) => removeRecursive(prev));
    },
    [setAttributes],
  );

  // Add a child to a specific parent (or root if parentId is null)
  const addChild = useCallback(
    (parentId = null) => {
      const newAttribute = createAttribute();

      if (!parentId) {
        // Add to root level
        setAttributes((prev) => [...prev, newAttribute]);
        return;
      }

      // Add as child of parent
      const addRecursive = (nodes) => {
        return nodes.map((node) => {
          if (node.id === parentId) {
            return { ...node, fields: [...(node.fields || []), newAttribute] };
          }
          if (node.fields && node.fields.length > 0) {
            return { ...node, fields: addRecursive(node.fields) };
          }
          return node;
        });
      };

      setAttributes((prev) => addRecursive(prev));
    },
    [setAttributes],
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-violet-50 text-violet-500 rounded-lg">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Product Attributes
            </h2>
            <p className="text-sm text-slate-500">
              Define the attributes products in this category should have
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => addChild(null)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add Attribute
        </button>
      </div>

      {/* Attributes Tree */}
      <div className="space-y-3">
        {attributes.map((attr) => (
          <AttributeNode
            key={attr.id}
            attribute={attr}
            onUpdate={updateNestedNode}
            onRemove={removeNode}
            onAddChild={addChild}
            depth={0}
          />
        ))}

        {attributes.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
            <Layers size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 mb-2">No attributes defined yet</p>
            <button
              type="button"
              onClick={() => addChild(null)}
              className="inline-flex items-center gap-1 text-sm font-medium text-orange-500 hover:text-orange-600"
            >
              <Plus size={16} />
              Add your first attribute
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttributeArchitect;
