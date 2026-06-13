import { NodeType, TrafficLevel } from '../data/nodes';

// Traffic level numeric weights for propagation math
const TRAFFIC_WEIGHT: Record<TrafficLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

const WEIGHT_TO_LEVEL = (w: number): TrafficLevel => {
  if (w >= 2.5) return 'high';
  if (w >= 1.5) return 'medium';
  return 'low';
};

/**
 * Propagates traffic from high-congestion nodes to neighbours.
 * Each node's new traffic = weighted average of self + connected nodes.
 * High-traffic nodes spread ~60% influence to each direct neighbour.
 */
export function propagateTraffic(nodes: NodeType[]): NodeType[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return nodes.map((node) => {
    const selfWeight = TRAFFIC_WEIGHT[node.traffic];
    const neighbours = node.connections
      .map((id) => nodeMap.get(id))
      .filter(Boolean) as NodeType[];

    if (neighbours.length === 0) return node;

    // Influence: if a neighbour is HIGH it strongly pulls this node up
    const neighbourInfluence = neighbours.reduce((acc, n) => {
      const w = TRAFFIC_WEIGHT[n.traffic];
      return acc + w;
    }, 0) / neighbours.length;

    // Weighted blend: 50% own traffic + 50% average neighbour influence
    const blended = selfWeight * 0.5 + neighbourInfluence * 0.5;
    const newTraffic = WEIGHT_TO_LEVEL(blended);

    return { ...node, traffic: newTraffic };
  });
}

/**
 * Randomise traffic across all nodes (simulate a new time window).
 */
export function randomiseTraffic(nodes: NodeType[]): NodeType[] {
  const levels: TrafficLevel[] = ['low', 'medium', 'high'];
  // Realistic distribution: 50% low, 30% medium, 20% high
  const weighted: TrafficLevel[] = [
    'low', 'low', 'low', 'low', 'low',
    'medium', 'medium', 'medium',
    'high', 'high',
  ];

  return nodes.map((node) => ({
    ...node,
    traffic: weighted[Math.floor(Math.random() * weighted.length)],
  }));
}

/**
 * What-if scenario: force a node to high and propagate one hop.
 */
export function whatIfScenario(
  nodes: NodeType[],
  targetId: number
): NodeType[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Step 1: force the target to high
  const withTarget = nodes.map((n) =>
    n.id === targetId ? { ...n, traffic: 'high' as TrafficLevel } : n
  );
  nodeMap.set(targetId, { ...nodeMap.get(targetId)!, traffic: 'high' });

  // Step 2: propagate one hop out from the target
  const target = nodeMap.get(targetId)!;
  return withTarget.map((node) => {
    if (target.connections.includes(node.id)) {
      const current = TRAFFIC_WEIGHT[node.traffic];
      // Neighbours jump at least to medium
      const bumped = Math.max(current, 2);
      return { ...node, traffic: WEIGHT_TO_LEVEL(bumped) };
    }
    return node;
  });
}

/**
 * Reset all nodes to initial traffic state.
 */
export function resetTraffic(
  nodes: NodeType[],
  initial: NodeType[]
): NodeType[] {
  const initMap = new Map(initial.map((n) => [n.id, n.traffic]));
  return nodes.map((n) => ({ ...n, traffic: initMap.get(n.id) ?? n.traffic }));
}

// ---- METRICS ----

export type TrafficMetrics = {
  totalNodes: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  congestionRatio: number; // % high nodes
  busiestNode: NodeType | null;
  averageLevel: string;
};

export function computeMetrics(nodes: NodeType[]): TrafficMetrics {
  const high = nodes.filter((n) => n.traffic === 'high');
  const medium = nodes.filter((n) => n.traffic === 'medium');
  const low = nodes.filter((n) => n.traffic === 'low');

  const avgWeight =
    nodes.reduce((s, n) => s + TRAFFIC_WEIGHT[n.traffic], 0) / nodes.length;

  return {
    totalNodes: nodes.length,
    highCount: high.length,
    mediumCount: medium.length,
    lowCount: low.length,
    congestionRatio: Math.round((high.length / nodes.length) * 100),
    busiestNode: high.length > 0 ? high[0] : medium.length > 0 ? medium[0] : null,
    averageLevel: WEIGHT_TO_LEVEL(avgWeight),
  };
}
