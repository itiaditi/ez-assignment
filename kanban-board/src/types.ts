export interface Card {
  id: string;
  title: string;
}

export interface Column {
  id: string;
  title: string;
  cards: Card[];
}

export type KanbanBoardProps = {
  columns?: Column[];
  onColumnsChange?: (columns: Column[]) => void;
};

