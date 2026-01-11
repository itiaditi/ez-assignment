import { useState, useRef, useEffect } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Card } from './Card';
import type { Column as ColumnType } from './types';
import './Column.css';

interface ColumnProps {
  column: ColumnType;
  onAddCard: (columnId: string, title: string) => void;
  onEditCard: (cardId: string, newTitle: string) => void;
  onDeleteCard: (cardId: string) => void;
}

const getColumnColor = (columnId: string): string => {
  if (columnId === 'todo') return '#4a90e2'; // Blue
  if (columnId === 'in-progress') return '#ff9800'; // Orange
  if (columnId === 'done') return '#4caf50'; // Green
  return '#666'; // Default gray
};

export function Column({
  column,
  onAddCard,
  onEditCard,
  onDeleteCard,
}: ColumnProps) {
  const [showAddInput, setShowAddInput] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  useEffect(() => {
    if (showAddInput && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [showAddInput]);

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      onAddCard(column.id, newCardTitle.trim());
      setNewCardTitle('');
      setShowAddInput(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCard();
    } else if (e.key === 'Escape') {
      setShowAddInput(false);
      setNewCardTitle('');
    }
  };

  const cardIds = column.cards.map((card) => card.id);

  const columnColor = getColumnColor(column.id);

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column ${isOver ? 'drag-over' : ''}`}
    >
      <div className="column-header" style={{ backgroundColor: columnColor }}>
        <h3 className="column-title">{column.title}</h3>
        <span className="card-count">{column.cards.length}</span>
        <button className="add-column-btn" title="Add column">
          <span>+</span>
        </button>
      </div>

      <div className="column-content">
        <SortableContext
          items={cardIds}
          strategy={verticalListSortingStrategy}
        >
          {column.cards.map((card) => (
            <Card
              key={card.id}
              card={card}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
              columnId={column.id}
            />
          ))}
        </SortableContext>
      </div>

      {showAddInput ? (
        <div className="add-card-input">
          <input
            ref={addInputRef}
            type="text"
            placeholder="Enter card title"
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (!newCardTitle.trim()) {
                setShowAddInput(false);
              }
            }}
          />
          <div className="add-card-actions">
            <button
              className="add-card-btn"
              onClick={handleAddCard}
            >
              Add Card
            </button>
            <button
              className="cancel-btn"
              onClick={() => {
                setShowAddInput(false);
                setNewCardTitle('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          className="add-card-button"
          onClick={() => setShowAddInput(true)}
        >
          + Add Card
        </button>
      )}
    </div>
  );
}

