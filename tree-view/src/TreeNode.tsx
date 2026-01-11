import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TreeNode as TreeNodeType } from './types';
import './TreeNode.css';

interface TreeNodeProps {
  node: TreeNodeType;
  onToggle: (id: string) => void;
  onAddChild: (parentId: string, name: string) => void;
  onEdit: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onLoadChildren: (id: string) => Promise<void>;
  level: number;
}

export function TreeNode({
  node,
  onToggle,
  onAddChild,
  onEdit,
  onDelete,
  onLoadChildren,
  level,
}: TreeNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.name);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: node.id,
    disabled: isEditing || isAddingChild,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasChildren = node.children && node.children.length > 0;
  const isLeaf = !hasChildren && !node.children;
  
  // Get first letter of node name for icon
  const nodeIcon = node.name.charAt(0).toUpperCase();
  const isRoot = level === 0;

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (showAddInput && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [showAddInput]);

  const handleDoubleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
      setEditValue(node.name);
    }
  };

  const handleEditSave = () => {
    if (editValue.trim()) {
      onEdit(node.id, editValue.trim());
      setIsEditing(false);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(node.name);
    }
  };

  const handleToggle = () => {
    if (!isLeaf) {
      if (!node.hasLoaded && node.children === undefined) {
        onLoadChildren(node.id);
      }
      onToggle(node.id);
    }
  };

  const handleAddChild = () => {
    if (newChildName.trim()) {
      onAddChild(node.id, newChildName.trim());
      setNewChildName('');
      setShowAddInput(false);
    }
  };

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddChild();
    } else if (e.key === 'Escape') {
      setShowAddInput(false);
      setNewChildName('');
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${node.name}" and all its children?`)) {
      onDelete(node.id);
    }
  };

  const handleExpandIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleToggle();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`tree-node ${isDragging ? 'dragging' : ''}`}
      {...attributes}
    >
      <div
        className="tree-node-content"
        style={{ paddingLeft: `${level * 24}px` }}
        {...(isLeaf ? {} : listeners)}
      >
        <div className="tree-node-header">
          <div className="node-icon-wrapper">
            <div className={`node-icon ${isRoot ? 'root-icon' : 'child-icon'}`}>
              {nodeIcon}
            </div>
          </div>
          
          {isEditing ? (
            <input
              ref={editInputRef}
              className="edit-input"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleEditSave}
              onKeyDown={handleEditKeyDown}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <input
              type="text"
              className="node-name-input"
              value={node.name}
              readOnly
              onDoubleClick={handleDoubleClick}
              title="Double-click to edit"
            />
          )}

          <button
            className="action-btn add-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowAddInput(true);
            }}
            title="Add child"
          >
            +
          </button>
        </div>

        {showAddInput && (
          <div className="add-child-input">
            <input
              ref={addInputRef}
              type="text"
              placeholder="Enter child name"
              value={newChildName}
              onChange={(e) => setNewChildName(e.target.value)}
              onKeyDown={handleAddKeyDown}
              onBlur={() => {
                if (!newChildName.trim()) {
                  setShowAddInput(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <button onClick={handleAddChild}>Add</button>
            <button
              onClick={() => {
                setShowAddInput(false);
                setNewChildName('');
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {node.isExpanded && hasChildren && (
        <div className="tree-node-children">
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              onToggle={onToggle}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              onLoadChildren={onLoadChildren}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

