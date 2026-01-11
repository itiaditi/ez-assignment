import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import { Column } from './Column';
import type { Column as ColumnType, Card as CardType, KanbanBoardProps } from './types';
import './KanbanBoard.css';

function generateId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const defaultColumns: ColumnType[] = [
  {
    id: 'todo',
    title: 'Todo',
    cards: [
      { id: generateId(), title: 'Design UI mockups' },
      { id: generateId(), title: 'Set up project structure' },
    ],
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    cards: [
      { id: generateId(), title: 'Implement authentication' },
    ],
  },
  {
    id: 'done',
    title: 'Done',
    cards: [
      { id: generateId(), title: 'Project setup' },
      { id: generateId(), title: 'Configure build tools' },
    ],
  },
];

export function KanbanBoard({
  columns: initialColumns,
  onColumnsChange,
}: KanbanBoardProps) {
  const [columns, setColumns] = useState<ColumnType[]>(
    initialColumns || defaultColumns
  );
  const [activeCard, setActiveCard] = useState<CardType | null>(null);

  const handleAddCard = useCallback((columnId: string, title: string) => {
    const newCard: CardType = {
      id: generateId(),
      title,
    };

    setColumns((prev) => {
      const updated = prev.map((col) =>
        col.id === columnId
          ? { ...col, cards: [...col.cards, newCard] }
          : col
      );
      onColumnsChange?.(updated);
      return updated;
    });
  }, [onColumnsChange]);

  const handleEditCard = useCallback((cardId: string, newTitle: string) => {
    setColumns((prev) => {
      const updated = prev.map((col) => ({
        ...col,
        cards: col.cards.map((card) =>
          card.id === cardId ? { ...card, title: newTitle } : card
        ),
      }));
      onColumnsChange?.(updated);
      return updated;
    });
  }, [onColumnsChange]);

  const handleDeleteCard = useCallback((cardId: string) => {
    setColumns((prev) => {
      const updated = prev.map((col) => ({
        ...col,
        cards: col.cards.filter((card) => card.id !== cardId),
      }));
      onColumnsChange?.(updated);
      return updated;
    });
  }, [onColumnsChange]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    // Find the card
    for (const column of columns) {
      const card = column.cards.find((c) => c.id === active.id);
      if (card) {
        setActiveCard(card);
        break;
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over || active.id === over.id) {
      return;
    }

    // Find source column and card
    let sourceColumn: ColumnType | undefined;
    let sourceIndex = -1;
    let card: CardType | undefined;

    for (const col of columns) {
      const index = col.cards.findIndex((c) => c.id === active.id);
      if (index !== -1) {
        sourceColumn = col;
        sourceIndex = index;
        card = col.cards[index];
        break;
      }
    }

    if (!sourceColumn || !card) {
      return;
    }

    // Check if dropping on a column (droppable area)
    const targetColumn = columns.find((col) => col.id === over.id);
    
    if (targetColumn) {
      // Dropped on a column droppable area
      if (targetColumn.id === sourceColumn.id) {
        // Same column - this case is handled by SortableContext within the column
        // If we're here, it means we're at the end of the column
        return;
      } else {
        // Different column - move card to end of target column
        setColumns((prev) => {
          const updated = prev.map((col) => {
            if (col.id === sourceColumn!.id) {
              return {
                ...col,
                cards: col.cards.filter((c) => c.id !== active.id),
              };
            }
            if (col.id === targetColumn.id) {
              return {
                ...col,
                cards: [...col.cards, card!],
              };
            }
            return col;
          });
          onColumnsChange?.(updated);
          return updated;
        });
      }
    } else {
      // Dropping on another card - find target column and position
      let targetColumnId: string | undefined;
      let targetCardIndex = -1;

      for (const col of columns) {
        const index = col.cards.findIndex((c) => c.id === over.id);
        if (index !== -1) {
          targetColumnId = col.id;
          targetCardIndex = index;
          break;
        }
      }

      if (!targetColumnId) {
        return;
      }

      if (sourceColumn.id === targetColumnId) {
        // Same column, reordering (handled by SortableContext, but we handle it here too)
        if (targetCardIndex === sourceIndex) {
          return; // No change
        }

        const newCards = [...sourceColumn.cards];
        newCards.splice(sourceIndex, 1);
        
        // Adjust target index if needed
        const adjustedIndex = targetCardIndex > sourceIndex ? targetCardIndex : targetCardIndex;
        newCards.splice(adjustedIndex, 0, card);
        
        setColumns((prev) => {
          const updated = prev.map((col) =>
            col.id === sourceColumn.id ? { ...col, cards: newCards } : col
          );
          onColumnsChange?.(updated);
          return updated;
        });
      } else {
        // Different column - move to target card's position in target column
        setColumns((prev) => {
          const updated = prev.map((col) => {
            if (col.id === sourceColumn.id) {
              return {
                ...col,
                cards: col.cards.filter((c) => c.id !== active.id),
              };
            }
            if (col.id === targetColumnId) {
              const newCards = [...col.cards];
              newCards.splice(targetCardIndex, 0, card!);
              return {
                ...col,
                cards: newCards,
              };
            }
            return col;
          });
          onColumnsChange?.(updated);
          return updated;
        });
      }
    }
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-board">
        {columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            onAddCard={handleAddCard}
            onEditCard={handleEditCard}
            onDeleteCard={handleDeleteCard}
          />
        ))}
      </div>
      <DragOverlay>
        {activeCard ? (
          <div className="drag-overlay-card">{activeCard.title}</div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

