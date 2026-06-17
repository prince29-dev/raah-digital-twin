/**
 * Raah Simulation Engine — Day 4
 * Graph-based tick system with:
 *  - Probability-weighted propagation
 *  - Decay (traffic reduces over time)
 *  - 2+ high-neighbour rule
 *  - Detailed event log generation
 *  - Peak-hour modifiers
 *  - What-if cascade analysis
 */

import { NodeType, TrafficLevel, PeakHour, INITIAL_NODES } from '../data/nodes';

// ─── Weights ─────────────────────────────────────────────────────────────────

export const TRAFFIC_WEIGHT: Record<TrafficLevel, number> = {
  low: 1, medium: 2, high: 3,
};

export function scoreToLevel(score: number): TrafficLevel {
  if (score >= 65) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

export function levelToScore(level: TrafficLevel): number {
  return level === 'high' ? 80 : level === 'medium' ? 50 : 20;
}

// ─── Log entry ───────────────────────────────────────────────────────────────

export type EngineEvent = {
  id: string;
  tick: number;
  timestamp: string;
  action: string;
  detail?: string;
  severity: 'info' | 'warning' | 'critical';
  nodeId?: number;
};

function makeEvent(
  tick: number,
  action: string,
  detail?: string,
  severity: EngineEvent['severity'] = 'info',
  nodeId?: number,
): EngineEvent {
  return {
    id: Math.random().toString(36).slice(2, 9),
    tick,
    timestamp: new Date().toLocaleTimeString(),
    action,
    detail,
    severity,
    nodeId,
  };
}

// ─── Propagation ─────────────────────────────────────────────────────────────

/**
 * Single simulation tick.
 * Returns updated nodes + events generated this tick.
 */
export function simulationTick(
  nodes: NodeType[],
  tick: number,
  peakHour: PeakHour,
  spreadProbability = 0.65,   // chance a HIGH neighbour raises this node
  decayRate = 4,              // points dropped per tick when isolated
): { nodes: NodeType[]; events: EngineEvent[] } {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const events: EngineEvent[] = [];

  const peakMultiplier = (node: NodeType): number => {
    if (peakHour === 'night') return 0.5;         // night → decay faster
    if (peakHour === 'off')   return 0.8;
    return node.peakSensitivity.includes(peakHour) ? 1.3 : 0.9;
  };

  const updated = nodes.map((node) => {
    const neighbours = node.connections
      .map((id) => nodeMap.get(id))
      .filter(Boolean) as NodeType[];

    const highNeighbours  = neighbours.filter((n) => n.traffic === 'high');
    const medNeighbours   = neighbours.filter((n) => n.traffic === 'medium');

    let newScore = node.congestionScore;

    // Rule 1: 2+ high neighbours → force pressure spike
    if (highNeighbours.length >= 2) {
      const spike = 18 * peakMultiplier(node);
      newScore += spike;
      if (node.traffic !== 'high' && newScore >= 65) {
        events.push(makeEvent(
          tick,
          `Congestion spread to ${node.name}`,
          `${highNeighbours.length} high-traffic neighbours triggered cascade`,
          'critical', node.id,
        ));
      }
    }

    // Rule 2: probability-based spread from any HIGH neighbour
    for (const hn of highNeighbours) {
      if (Math.random() < spreadProbability) {
        newScore += 10 * peakMultiplier(node);
        if (node.traffic === 'low' && scoreToLevel(newScore) !== 'low') {
          events.push(makeEvent(
            tick,
            `Traffic rising at ${node.name}`,
            `Spillover from ${hn.name}`,
            'warning', node.id,
          ));
        }
      }
    }

    // Rule 3: medium neighbour exerts mild pressure
    for (const mn of medNeighbours) {
      if (Math.random() < 0.25) {
        newScore += 4 * peakMultiplier(node);
      }
      void mn;
    }

    // Rule 4: decay — isolated or low-pressure node recovers
    const highPressure = highNeighbours.length >= 1 || node.congestionScore > 70;
    if (!highPressure) {
      const decay = decayRate * (peakHour === 'night' ? 2 : 1);
      newScore -= decay;
      if (node.traffic !== 'low' && scoreToLevel(newScore) === 'low') {
        events.push(makeEvent(
          tick,
          `Traffic reduced at ${node.name}`,
          'Congestion dissipated',
          'info', node.id,
        ));
      }
    }

    // Clamp 0-100
    newScore = Math.max(0, Math.min(100, newScore));

    // Update historical ring buffer (last 6 states)
    const newHistory: TrafficLevel[] = [
      node.traffic,
      ...node.historicalTraffic.slice(0, 5),
    ];

    const newLevel = scoreToLevel(newScore);

    return {
      ...node,
      congestionScore: Math.round(newScore),
      traffic: newLevel,
      historicalTraffic: newHistory,
    };
  });

  return { nodes: updated, events };
}

// ─── What-if cascade ─────────────────────────────────────────────────────────

export type WhatIfResult = {
  nodes: NodeType[];
  affectedIds: number[];
  events: EngineEvent[];
};

export function whatIfScenario(
  nodes: NodeType[],
  targetId: number,
  tick: number,
): WhatIfResult {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const events: EngineEvent[] = [];
  const affectedIds: number[] = [targetId];

  // Force target to HIGH
  const target = nodeMap.get(targetId)!;
  events.push(makeEvent(tick, `What-if: ${target.name} → HIGH`, 'Scenario injected', 'critical', targetId));

  // Hop 1: direct neighbours
  const hop1 = nodes.map((node) => {
    if (node.id === targetId) {
      return { ...node, traffic: 'high' as TrafficLevel, congestionScore: 90 };
    }
    if (target.connections.includes(node.id)) {
      const bumped = Math.min(100, node.congestionScore + 30);
      const newLevel = scoreToLevel(bumped);
      if (newLevel !== node.traffic) {
        affectedIds.push(node.id);
        events.push(makeEvent(tick, `Impact: ${node.name} → ${newLevel.toUpperCase()}`, `Direct neighbour of ${target.name}`, 'warning', node.id));
      }
      return { ...node, congestionScore: bumped, traffic: newLevel };
    }
    return node;
  });

  // Hop 2: second-degree neighbours (lighter impact)
  const hop1Map = new Map(hop1.map((n) => [n.id, n]));
  const finalNodes = hop1.map((node) => {
    if (affectedIds.includes(node.id)) return node;
    const neighbours = node.connections.map((id) => hop1Map.get(id)!).filter(Boolean);
    const highNeighbours = neighbours.filter((n) => n.traffic === 'high').length;
    if (highNeighbours >= 1) {
      const bumped = Math.min(100, node.congestionScore + 12);
      const newLevel = scoreToLevel(bumped);
      if (newLevel !== node.traffic) {
        affectedIds.push(node.id);
        events.push(makeEvent(tick, `Secondary impact: ${node.name}`, '2nd-degree propagation', 'info', node.id));
      }
      return { ...node, congestionScore: bumped, traffic: newLevel };
    }
    return node;
  });

  return { nodes: finalNodes, affectedIds, events };
}

// ─── Reset ───────────────────────────────────────────────────────────────────

export function resetNodes(): NodeType[] {
  // Deep clone of initial state
  return INITIAL_NODES.map((n) => ({ ...n, historicalTraffic: [...n.historicalTraffic] }));
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

export type TrafficMetrics = {
  totalNodes: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  congestionRatio: number;
  busiestNode: NodeType | null;
  avgCongestionScore: number;
  trend: 'rising' | 'stable' | 'falling';
};

export function computeMetrics(
  nodes: NodeType[],
  prevScore?: number,
): TrafficMetrics {
  const high   = nodes.filter((n) => n.traffic === 'high');
  const medium = nodes.filter((n) => n.traffic === 'medium');
  const low    = nodes.filter((n) => n.traffic === 'low');
  const avgScore = Math.round(nodes.reduce((s, n) => s + n.congestionScore, 0) / nodes.length);

  let trend: TrafficMetrics['trend'] = 'stable';
  if (prevScore !== undefined) {
    if (avgScore > prevScore + 2) trend = 'rising';
    else if (avgScore < prevScore - 2) trend = 'falling';
  }

  const busiest = [...nodes].sort((a, b) => b.congestionScore - a.congestionScore)[0] ?? null;

  return {
    totalNodes: nodes.length,
    highCount: high.length,
    mediumCount: medium.length,
    lowCount: low.length,
    congestionRatio: Math.round((high.length / nodes.length) * 100),
    busiestNode: busiest,
    avgCongestionScore: avgScore,
    trend,
  };
}
