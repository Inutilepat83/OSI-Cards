/**
 * Tree Utilities
 *
 * Utilities for tree data structure operations.
 *
 * @example
 * ```typescript
 * import { flattenTree, buildTree, findInTree } from '@osi-cards/utils';
 *
 * const flat = flattenTree(tree, 'children');
 * const tree = buildTree(items, 'id', 'parentId');
 * const node = findInTree(tree, node => node.id === '123');
 * ```
 */

export interface TreeNode<T = any> {
  [key: string]: any;
  children?: TreeNode<T>[];
}

export function flattenTree<T extends TreeNode>(tree: T[], childrenKey = 'children'): T[] {
  const result: T[] = [];

  function traverse(nodes: T[]): void {
    nodes.forEach((node) => {
      result.push(node);
      if (node[childrenKey]) {
        traverse(node[childrenKey]);
      }
    });
  }

  traverse(tree);
  return result;
}

export function buildTree<T extends Record<string, any>>(
  items: T[],
  idKey = 'id',
  parentKey = 'parentId',
  childrenKey = 'children'
): T[] {
  const map = new Map<any, T>();
  const roots: T[] = [];

  items.forEach((item) => {
    map.set(item[idKey], { ...item, [childrenKey]: [] });
  });

  items.forEach((item) => {
    const node = map.get(item[idKey])!;
    const parentId = item[parentKey];

    if (parentId === null || parentId === undefined) {
      roots.push(node);
    } else {
      const parent = map.get(parentId);
      if (parent) {
        parent[childrenKey].push(node);
      }
    }
  });

  return roots;
}

export function findInTree<T extends TreeNode>(
  tree: T[],
  predicate: (node: T) => boolean,
  childrenKey = 'children'
): T | null {
  for (const node of tree) {
    if (predicate(node)) return node;

    if (node[childrenKey]) {
      const found = findInTree(node[childrenKey], predicate, childrenKey);
      if (found) return found;
    }
  }

  return null;
}

export function mapTree<T extends TreeNode, U extends TreeNode>(
  tree: T[],
  mapper: (node: T) => U,
  childrenKey = 'children'
): U[] {
  return tree.map((node) => {
    const mapped = mapper(node);
    if (node[childrenKey]) {
      (mapped as any)[childrenKey] = mapTree(node[childrenKey], mapper, childrenKey);
    }
    return mapped;
  });
}

export function filterTree<T extends TreeNode>(
  tree: T[],
  predicate: (node: T) => boolean,
  childrenKey = 'children'
): T[] {
  const filtered: T[] = [];

  tree.forEach((node) => {
    if (predicate(node)) {
      const newNode = { ...node } as any;
      if (node[childrenKey]) {
        newNode[childrenKey] = filterTree(node[childrenKey], predicate, childrenKey);
      }
      filtered.push(newNode);
    }
  });

  return filtered;
}

export function getTreeDepth<T extends TreeNode>(tree: T[], childrenKey = 'children'): number {
  let maxDepth = 0;

  function traverse(nodes: T[], depth: number): void {
    maxDepth = Math.max(maxDepth, depth);
    nodes.forEach((node) => {
      if (node[childrenKey]) {
        traverse(node[childrenKey], depth + 1);
      }
    });
  }

  traverse(tree, 1);
  return maxDepth;
}

export function getTreeNodeCount<T extends TreeNode>(tree: T[], childrenKey = 'children'): number {
  return flattenTree(tree, childrenKey).length;
}

export function getPath<T extends TreeNode>(
  tree: T[],
  predicate: (node: T) => boolean,
  childrenKey = 'children'
): T[] | null {
  function traverse(nodes: T[], path: T[]): T[] | null {
    for (const node of nodes) {
      const newPath = [...path, node];

      if (predicate(node)) {
        return newPath;
      }

      if (node[childrenKey]) {
        const found = traverse(node[childrenKey], newPath);
        if (found) return found;
      }
    }
    return null;
  }

  return traverse(tree, []);
}
