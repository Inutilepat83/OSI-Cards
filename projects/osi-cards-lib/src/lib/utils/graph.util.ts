/**
 * Graph Utilities
 *
 * Utilities for graph/network data structures and algorithms.
 *
 * @example
 * ```typescript
 * import { createGraph, findShortestPath, detectCycle } from '@osi-cards/utils';
 *
 * const graph = createGraph();
 * graph.addEdge('A', 'B', 5);
 * const path = findShortestPath(graph, 'A', 'B');
 * ```
 */

export interface GraphEdge {
  from: string;
  to: string;
  weight?: number;
}

export class Graph {
  private adjacencyList = new Map<string, Map<string, number>>();

  addNode(node: string): void {
    if (!this.adjacencyList.has(node)) {
      this.adjacencyList.set(node, new Map());
    }
  }

  addEdge(from: string, to: string, weight = 1): void {
    this.addNode(from);
    this.addNode(to);
    this.adjacencyList.get(from)!.set(to, weight);
  }

  getNeighbors(node: string): string[] {
    return Array.from(this.adjacencyList.get(node)?.keys() || []);
  }

  hasNode(node: string): boolean {
    return this.adjacencyList.has(node);
  }

  hasEdge(from: string, to: string): boolean {
    return this.adjacencyList.get(from)?.has(to) || false;
  }

  getWeight(from: string, to: string): number | undefined {
    return this.adjacencyList.get(from)?.get(to);
  }

  getNodes(): string[] {
    return Array.from(this.adjacencyList.keys());
  }

  getEdges(): GraphEdge[] {
    const edges: GraphEdge[] = [];

    this.adjacencyList.forEach((neighbors, from) => {
      neighbors.forEach((weight, to) => {
        edges.push({ from, to, weight });
      });
    });

    return edges;
  }

  removeNode(node: string): void {
    this.adjacencyList.delete(node);
    this.adjacencyList.forEach((neighbors) => neighbors.delete(node));
  }

  removeEdge(from: string, to: string): void {
    this.adjacencyList.get(from)?.delete(to);
  }

  clear(): void {
    this.adjacencyList.clear();
  }
}

export function createGraph(): Graph {
  return new Graph();
}

export function bfs(graph: Graph, start: string): string[] {
  const visited = new Set<string>();
  const queue: string[] = [start];
  const result: string[] = [];

  while (queue.length > 0) {
    const node = queue.shift()!;

    if (visited.has(node)) continue;

    visited.add(node);
    result.push(node);

    graph.getNeighbors(node).forEach((neighbor) => {
      if (!visited.has(neighbor)) {
        queue.push(neighbor);
      }
    });
  }

  return result;
}

export function dfs(graph: Graph, start: string): string[] {
  const visited = new Set<string>();
  const result: string[] = [];

  function visit(node: string): void {
    if (visited.has(node)) return;

    visited.add(node);
    result.push(node);

    graph.getNeighbors(node).forEach((neighbor) => visit(neighbor));
  }

  visit(start);
  return result;
}

export function findShortestPath(graph: Graph, start: string, end: string): string[] | null {
  const queue: Array<{ node: string; path: string[] }> = [{ node: start, path: [start] }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { node, path } = queue.shift()!;

    if (node === end) return path;
    if (visited.has(node)) continue;

    visited.add(node);

    graph.getNeighbors(node).forEach((neighbor) => {
      queue.push({ node: neighbor, path: [...path, neighbor] });
    });
  }

  return null;
}

export function detectCycle(graph: Graph): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(node: string): boolean {
    visited.add(node);
    recursionStack.add(node);

    for (const neighbor of graph.getNeighbors(node)) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(node);
    return false;
  }

  for (const node of graph.getNodes()) {
    if (!visited.has(node)) {
      if (hasCycle(node)) return true;
    }
  }

  return false;
}
