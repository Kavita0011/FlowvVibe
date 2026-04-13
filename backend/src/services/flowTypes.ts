export interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
}

export function parseFlowData(raw: unknown): FlowData {
  if (raw && typeof raw === 'object' && 'nodes' in raw && 'edges' in raw) {
    const o = raw as { nodes: FlowNode[]; edges: FlowEdge[] };
    return {
      nodes: Array.isArray(o.nodes) ? o.nodes : [],
      edges: Array.isArray(o.edges) ? o.edges : [],
    };
  }
  return { nodes: [], edges: [] };
}
