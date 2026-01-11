import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Card as CardType } from './types';
import './Card.css';

interface CardProps {
  card: CardType;
  onEdit: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  columnId?: string;
}

export function Card({ card, onEdit, onDelete, columnId }: CardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(card.title);
  const editInputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    disabled: isEditing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
      setEditValue(card.title);
    }
  };

  const handleSave = () => {
    if (editValue.trim()) {
      onEdit(card.id, editValue.trim());
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(card.title);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Delete card "${card.title}"?`)) {
      onDelete(card.id);
    }
  };

  const isDoneColumn = columnId === 'done';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card ${isDragging ? 'dragging' : ''} ${isEditing ? 'editing' : ''} ${isDoneColumn ? 'done-card' : ''}`}
      {...attributes}
      {...listeners}
    >
      {isEditing ? (
        <input
          ref={editInputRef}
          className="card-edit-input"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div className="card-content">
          <span
            className="card-title"
            onDoubleClick={handleDoubleClick}
            title="Double-click to edit"
          >
            {card.title}
          </span>
          <button
            className="card-delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            title="Delete card"
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  );
}

