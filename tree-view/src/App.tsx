import { useState } from 'react';
import { TreeView } from './TreeView';
import type { TreeNode } from './types';
import './App.css';

function generateId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const initialData: TreeNode[] = [
  {
    id: generateId(),
    name: 'Documents',
    isExpanded: true,
    hasLoaded: true,
    children: [
      {
        id: generateId(),
        name: 'Work',
        isExpanded: false,
        hasLoaded: false,
      },
      {
        id: generateId(),
        name: 'Personal',
        isExpanded: false,
        hasLoaded: false,
      },
    ],
  },
  {
    id: generateId(),
    name: 'Projects',
    isExpanded: false,
    hasLoaded: false,
  },
  {
    id: generateId(),
    name: 'Downloads',
    isExpanded: false,
    hasLoaded: false,
  },
];

function App() {
  const [treeData, setTreeData] = useState<TreeNode[]>(initialData);

  const handleDataChange = (newData: TreeNode[]) => {
    setTreeData(newData);
    console.log('Tree data updated:', newData);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Tree View Component</h1>
        <p>Drag nodes to reorder, double-click to edit, use buttons to add/delete</p>
      </header>
      <main className="app-main">
        <TreeView data={treeData} onDataChange={handleDataChange} />
      </main>
    </div>
  );
}

export default App;

