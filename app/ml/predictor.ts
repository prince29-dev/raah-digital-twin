/**
 * Raah ML Layer — Day 5
 * Lightweight in-browser prediction engine.
 * No external library required — uses weighted regression + noise.
 *
 * Algorithms:
 *  1. Traffic prediction   — weighted historical + neighbour state + noise
 *  2. ETA estimation       — Dijkstra on congestion-weighted graph
 *  3. Route suggestion     — least-congested path (Dijkstra variant)
 *  4. Peak-hour patterns   — time-of-day probability tables
 *  5. Heatmap score        — per-node 0-100 intensity
 */

import {
  NodeType, RouteType, TrafficLevel, PeakHour,
  SPEED_BY_TRAFFIC,
} from '../data/nodes';
import { TRAFFIC_WEIGHT, scoreToLevel, levelToScore } from '../simulation/engine';

// ─── 1. Traffic Prediction ───────────────────────────────────────────────────

export type PredictionResult = {
  nodeId: number;
  currentLevel: TrafficLevel;
  predictedLevel: TrafficLevel;
  predictedScore: number;
  confidence: number;      // 0-1
};

/**
 * Predict the next traffic state for every node.
 * Model: 40% own history + 40% neighbour pressure + 20% noise
 */
export function predictNextState(
  nodes: NodeType[],
  peakHour: PeakHour,
): PredictionResult[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const peakBoost: Record<PeakHour, number> = {
    morning: 12, evening: 10, off: 0, night: -8,
  };

  return nodes.map((node) => {
    // Historical average (weighted: most recent counts more)
    const histWeights = [0.5, 0.3, 0.15, 0.05];
    const histScore = node.historicalTraffic
      .slice(0, 4)
      .reduce((acc, lvl, i) => acc + levelToScore(lvl) * (histWeights[i] ?? 0.05), 0);

    // Neighbour pressure
    const neighbours = node.connections
      .map((id) => nodeMap.get(id))
      .filter(Boolean) as NodeType[];
    const neighbourScore = neighbours.length > 0
      ? neighbours.reduce((s, n) => s + n.congestionScore, 0) / neighbours.length
      : node.congestionScore;

    // Peak-hour sensitivity
    const isPeakSensitive = node.peakSensitivity.includes(peakHour);
    const peakDelta = isPeakSensitive ? peakBoost[peakHour] : peakBoost[peakHour] * 0.3;

    // Gaussian noise (±8 points)
    const noise = (Math.random() - 0.5) * 16;

    const predicted = Math.max(0, Math.min(100,
      histScore * 0.4 + neighbourScore * 0.4 + node.congestionScore * 0.2
      + peakDelta + noise,
    ));

    // Confidence: higher when history is consistent
    const histVariance = node.historicalTraffic
      .slice(0, 4)
      .map((l) => TRAFFIC_WEIGHT[l])
      .reduce((acc, w, _, arr) => {
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        return acc + Math.abs(w - mean);
      }, 0) / 4;
    const confidence = Math.max(0.4, 1 - histVariance / 3);

    return {
      nodeId: node.id,
      currentLevel: node.traffic,
      predictedLevel: scoreToLevel(Math.round(predicted)),
      predictedScore: Math.round(predicted),
      confidence: Math.round(confidence * 100) / 100,
    };
  });
}

// ─── 2. ETA Estimation ───────────────────────────────────────────────────────

export type ETAResult = {
  fromId: number;
  toId: number;
  path: number[];
  etaMinutes: number;
  distanceKm: number;
  congestionFactor: number;
};

function buildGraph(nodes: NodeType[], routes: RouteType[]) {
  const graph = new Map<number, { toId: number; distance: number; routeId: string }[]>();
  nodes.forEach((n) => graph.set(n.id, []));
  routes.forEach((r) => {
    graph.get(r.from)?.push({ toId: r.to,   distance: r.distance, routeId: r.id });
    graph.get(r.to)?.push({   toId: r.from, distance: r.distance, routeId: r.id });
  });
  return graph;
}

/**
 * Dijkstra — minimises travel time (distance / speed by traffic)
 */
export function estimateETA(
  nodes: NodeType[],
  routes: RouteType[],
  fromId: number,
  toId: number,
): ETAResult | null {
  if (fromId === toId) return null;
  const nodeMap  = new Map(nodes.map((n) => [n.id, n]));
  const graph    = buildGraph(nodes, routes);

  const dist  = new Map<number, number>(nodes.map((n) => [n.id, Infinity]));
  const prev  = new Map<number, number>();
  const queue = new Set(nodes.map((n) => n.id));

  dist.set(fromId, 0);

  while (queue.size > 0) {
    // Pick unvisited with smallest dist
    let u = -1;
    for (const id of queue) {
      if (u === -1 || (dist.get(id) ?? Infinity) < (dist.get(u) ?? Infinity)) u = id;
    }
    if (u === toId || dist.get(u) === Infinity) break;
    queue.delete(u);

    const uNode = nodeMap.get(u)!;
    const speed = SPEED_BY_TRAFFIC[uNode.traffic];

    for (const edge of (graph.get(u) ?? [])) {
      if (!queue.has(edge.toId)) continue;
      const travelTime = (edge.distance / speed) * 60; // minutes
      const alt = (dist.get(u) ?? 0) + travelTime;
      if (alt < (dist.get(edge.toId) ?? Infinity)) {
        dist.set(edge.toId, alt);
        prev.set(edge.toId, u);
      }
    }
  }

  // Reconstruct path
  const path: number[] = [];
  let cur: number | undefined = toId;
  while (cur !== undefined) {
    path.unshift(cur);
    cur = prev.get(cur);
  }
  if (path[0] !== fromId) return null;

  const totalDist = path.slice(1).reduce((sum, id, i) => {
    const r = routes.find((r) =>
      (r.from === path[i] && r.to === id) || (r.to === path[i] && r.from === id)
    );
    return sum + (r?.distance ?? 0);
  }, 0);

  const freeFlowETA = (totalDist / 40) * 60;
  const congestionFactor = freeFlowETA > 0 ? (dist.get(toId) ?? 0) / freeFlowETA : 1;

  return {
    fromId, toId,
    path,
    etaMinutes: Math.round((dist.get(toId) ?? 0) * 10) / 10,
    distanceKm: Math.round(totalDist * 10) / 10,
    congestionFactor: Math.round(congestionFactor * 100) / 100,
  };
}

// ─── 3. Smart Route Suggestion ───────────────────────────────────────────────

export type RouteOption = {
  path: number[];
  etaMinutes: number;
  distanceKm: number;
  label: 'fastest' | 'least_congested' | 'shortest';
  avgCongestion: TrafficLevel;
};

export function suggestRoutes(
  nodes: NodeType[],
  routes: RouteType[],
  fromId: number,
  toId: number,
): RouteOption[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Build congestion-weighted graph
  const congestionRoutes = routes.map((r) => ({
    ...r,
    // penalise high-traffic nodes heavily
    distance: r.distance * (
      nodeMap.get(r.to)?.traffic === 'high'   ? 4   :
      nodeMap.get(r.to)?.traffic === 'medium' ? 1.8 : 1
    ),
  }));

  const fastestETA    = estimateETA(nodes, routes,            fromId, toId);
  const leastCong     = estimateETA(nodes, congestionRoutes,  fromId, toId);

  const results: RouteOption[] = [];

  if (fastestETA) {
    const avgScore = fastestETA.path.reduce((s, id) => s + (nodeMap.get(id)?.congestionScore ?? 0), 0) / fastestETA.path.length;
    results.push({
      path: fastestETA.path,
      etaMinutes: fastestETA.etaMinutes,
      distanceKm: fastestETA.distanceKm,
      label: 'fastest',
      avgCongestion: scoreToLevel(avgScore),
    });
  }

  if (leastCong && JSON.stringify(leastCong.path) !== JSON.stringify(fastestETA?.path)) {
    const avgScore = leastCong.path.reduce((s, id) => s + (nodeMap.get(id)?.congestionScore ?? 0), 0) / leastCong.path.length;
    results.push({
      path: leastCong.path,
      etaMinutes: leastCong.etaMinutes,
      distanceKm: leastCong.distanceKm,
      label: 'least_congested',
      avgCongestion: scoreToLevel(avgScore),
    });
  }

  return results;
}

// ─── 4. Peak Hour Patterns ───────────────────────────────────────────────────

export function getCurrentPeakHour(): PeakHour {
  const h = new Date().getHours();
  if (h >= 7  && h <= 10) return 'morning';
  if (h >= 17 && h <= 20) return 'evening';
  if (h >= 22 || h <= 5)  return 'night';
  return 'off';
}

export type PeakProfile = {
  label: string;
  icon: string;
  description: string;
  trafficMultiplier: number;
};

export const PEAK_PROFILES: Record<PeakHour, PeakProfile> = {
  morning: { label: 'Morning Rush',  icon: '🌅', description: '7–10 AM: Office + school commute', trafficMultiplier: 1.4 },
  evening: { label: 'Evening Rush',  icon: '🌆', description: '5–8 PM: Return commute + market', trafficMultiplier: 1.3 },
  night:   { label: 'Night',         icon: '🌙', description: '10 PM–5 AM: Low traffic',          trafficMultiplier: 0.5 },
  off:     { label: 'Off-Peak',      icon: '☀️',  description: 'Daytime — moderate flow',         trafficMultiplier: 0.9 },
};

/**
 * Apply peak-hour traffic pattern to all nodes.
 */
export function applyPeakPattern(nodes: NodeType[], peak: PeakHour): NodeType[] {
  const profile = PEAK_PROFILES[peak];
  return nodes.map((node) => {
    const sensitive = node.peakSensitivity.includes(peak);
    const mult = sensitive ? profile.trafficMultiplier : (profile.trafficMultiplier * 0.6 + 0.4);
    const newScore = Math.max(0, Math.min(100, node.congestionScore * mult));
    return { ...node, congestionScore: Math.round(newScore), traffic: scoreToLevel(newScore) };
  });
}

// ─── 5. Heatmap ──────────────────────────────────────────────────────────────

export type HeatmapPoint = {
  lat: number;
  lng: number;
  intensity: number; // 0-1
};

export function buildHeatmap(nodes: NodeType[]): HeatmapPoint[] {
  const maxScore = Math.max(...nodes.map((n) => n.congestionScore), 1);
  return nodes.map((node) => ({
    lat: node.position[0],
    lng: node.position[1],
    intensity: node.congestionScore / maxScore,
  }));
}
