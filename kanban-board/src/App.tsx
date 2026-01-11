import { useState } from 'react';
import { KanbanBoard } from './KanbanBoard';
import type { Column } from './types';
import './App.css';

function generateId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const initialColumns: Column[] = [
  {
    id: 'todo',
    title: 'Todo',
    cards: [
      { id: generateId(), title: 'Design UI mockups' },
      { id: generateId(), title: 'Set up project structure' },
      { id: generateId(), title: 'Create user stories' },
    ],
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    cards: [
      { id: generateId(), title: 'Implement authentication' },
      { id: generateId(), title: 'Build API endpoints' },
    ],
  },
  {
    id: 'done',
    title: 'Done',
    cards: [
      { id: generateId(), title: 'Project setup' },
      { id: generateId(), title: 'Configure build tools' },
      { id: generateId(), title: 'Initialize Git repository' },
    ],
  },
];

function App() {
  const [columns, setColumns] = useState<Column[]>(initialColumns);

  const handleColumnsChange = (newColumns: Column[]) => {
    setColumns(newColumns);
    console.log('Kanban board updated:', newColumns);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Kanban Board</h1>
        <p>Drag cards between columns or reorder within columns. Double-click to edit cards.</p>
      </header>
      <main className="app-main">
        <KanbanBoard columns={columns} onColumnsChange={handleColumnsChange} />
      </main>
    </div>
  );
}

export default App;

