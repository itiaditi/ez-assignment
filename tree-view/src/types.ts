export interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
  isExpanded?: boolean;
  isLoading?: boolean;
  hasLoaded?: boolean;
}

export type TreeViewProps = {
  data: TreeNode[];
  onDataChange?: (data: TreeNode[]) => void;
};

