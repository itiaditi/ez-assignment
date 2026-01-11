import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TreeNode } from './TreeNode';
import type { TreeNode as TreeNodeType, TreeViewProps } from './types';
import './TreeView.css';

function findNode(
  nodes: TreeNodeType[],
  id: string
): { node: TreeNodeType; parent: TreeNodeType[]; index: number } | null {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) {
      return { node: nodes[i], parent: nodes, index: i };
    }
    if (nodes[i].children) {
      const found = findNode(nodes[i].children!, id);
      if (found) return found;
    }
  }
  return null;
}

function updateNode(
  nodes: TreeNodeType[],
  id: string,
  updater: (node: TreeNodeType) => TreeNodeType
): TreeNodeType[] {
  return nodes.map((node) => {
    if (node.id === id) {
      return updater(node);
    }
    if (node.children) {
      return {
        ...node,
        children: updateNode(node.children, id, updater),
      };
    }
    return node;
  });
}

function deleteNode(nodes: TreeNodeType[], id: string): TreeNodeType[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => {
      if (node.children) {
        return {
          ...node,
          children: deleteNode(node.children, id),
        };
      }
      return node;
    });
}

function addChildNode(
  nodes: TreeNodeType[],
  parentId: string,
  newNode: TreeNodeType
): TreeNodeType[] {
  return nodes.map((node) => {
    if (node.id === parentId) {
      return {
        ...node,
        children: [...(node.children || []), newNode],
        isExpanded: true,
      };
    }
    if (node.children) {
      return {
        ...node,
        children: addChildNode(node.children, parentId, newNode),
      };
    }
    return node;
  });
}

function generateId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Simulate lazy loading
async function simulateLazyLoad(): Promise<TreeNodeType[]> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return [
    {
      id: generateId(),
      name: 'Child 1',
      hasLoaded: false,
    },
    {
      id: generateId(),
      name: 'Child 2',
      hasLoaded: false,
    },
  ];
}

export function TreeView({ data: initialData, onDataChange }: TreeViewProps) {
  const [data, setData] = useState<TreeNodeType[]>(initialData);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleToggle = useCallback((id: string) => {
    setData((prev) =>
      updateNode(prev, id, (node) => ({
        ...node,
        isExpanded: !node.isExpanded,
      }))
    );
  }, []);

  const handleAddChild = useCallback((parentId: string, name: string) => {
    const newNode: TreeNodeType = {
      id: generateId(),
      name,
      hasLoaded: false,
    };
    setData((prev) => {
      const updated = addChildNode(prev, parentId, newNode);
      onDataChange?.(updated);
      return updated;
    });
  }, [onDataChange]);

  const handleEdit = useCallback((id: string, newName: string) => {
    setData((prev) => {
      const updated = updateNode(prev, id, (node) => ({ ...node, name: newName }));
      onDataChange?.(updated);
      return updated;
    });
  }, [onDataChange]);

  const handleDelete = useCallback((id: string) => {
    setData((prev) => {
      const updated = deleteNode(prev, id);
      onDataChange?.(updated);
      return updated;
    });
  }, [onDataChange]);

  const handleLoadChildren = useCallback(async (id: string) => {
    setData((prev) =>
      updateNode(prev, id, (node) => ({
        ...node,
        isLoading: true,
      }))
    );

    try {
      const children = await simulateLazyLoad();
      setData((prev) => {
        const updated = updateNode(prev, id, (node) => ({
          ...node,
          children,
          isLoading: false,
          hasLoaded: true,
          isExpanded: true,
        }));
        onDataChange?.(updated);
        return updated;
      });
    } catch (error) {
      setData((prev) =>
        updateNode(prev, id, (node) => ({
          ...node,
          isLoading: false,
        }))
      );
    }
  }, [onDataChange]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const activeFound = findNode(data, active.id as string);
    const overFound = findNode(data, over.id as string);

    if (!activeFound || !overFound) {
      return;
    }

    const { node: activeNode, parent: activeParent, index: activeIndex } = activeFound;
    const { node: overNode, parent: overParent, index: overIndex } = overFound;

    // Prevent dropping a node into its own descendant
    const isDescendant = (nodeId: string, ancestor: TreeNodeType): boolean => {
      if (ancestor.id === nodeId) return true;
      if (ancestor.children) {
        return ancestor.children.some((child) => isDescendant(nodeId, child));
      }
      return false;
    };

    if (activeNode.children && isDescendant(over?.id as string, activeNode)) {
      return; // Prevent circular nesting
    }

    setData((prev) => {
      // Remove from active parent first
      let updated = prev;
      if (activeParent === prev) {
        // Removing from root level
        updated = prev.filter((_, i) => i !== activeIndex);
      } else {
        // Removing from a child node
        updated = updateNode(prev, activeParent[0].id, (node) => ({
          ...node,
          children: node.children?.filter((_, i) => i !== activeIndex) || [],
        }));
      }

      // Determine where to add: as child of overNode or as sibling
      // If dragging over a node that can have children (has children array or undefined),
      // add as child. If it's a leaf (children is null or empty array), add as sibling.
      const canHaveChildren = overNode.children === undefined || Array.isArray(overNode.children);

      if (canHaveChildren) {
        // Add as child of overNode
        updated = updateNode(updated, over?.id as string, (node) => ({
          ...node,
          children: [...(node.children || []), activeNode],
          isExpanded: true,
        }));
      } else {
        // Add as sibling (same parent as overNode)
        if (overParent === updated) {
          // Adding as sibling at root level
          const newRoot = [...updated];
          const targetIndex = overIndex >= activeIndex ? overIndex + 1 : overIndex;
          newRoot.splice(targetIndex, 0, activeNode);
          updated = newRoot;
        } else {
          // Adding as sibling within a parent
          updated = updateNode(updated, overParent[0].id, (node) => {
            const newChildren = [...(node.children || [])];
            const targetIndex = overIndex >= activeIndex ? overIndex + 1 : overIndex;
            newChildren.splice(targetIndex, 0, activeNode);
            return {
              ...node,
              children: newChildren,
            };
          });
        }
      }

      onDataChange?.(updated);
      return updated;
    });
  };

  const getFlatNodeIds = (nodes: TreeNodeType[]): string[] => {
    const ids: string[] = [];
    const collectIds = (nodeList: TreeNodeType[]) => {
      nodeList.forEach((node) => {
        ids.push(node.id);
        if (node.children && node.isExpanded) {
          collectIds(node.children);
        }
      });
    };
    collectIds(nodes);
    return ids;
  };

  const activeNode = activeId ? findNode(data, activeId)?.node : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="tree-view">
        <SortableContext
          items={getFlatNodeIds(data)}
          strategy={verticalListSortingStrategy}
        >
          {data.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              onToggle={handleToggle}
              onAddChild={handleAddChild}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onLoadChildren={handleLoadChildren}
              level={0}
            />
          ))}
        </SortableContext>
      </div>
      <DragOverlay>
        {activeNode ? (
          <div className="drag-overlay-node">{activeNode.name}</div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

