import { create } from 'zustand';
import { NodeType, RouteType, INITIAL_NODES, ROUTES, PeakHour } from '../data/nodes';
import {
  simulationTick, whatIfScenario, resetNodes,
  computeMetrics, TrafficMetrics, EngineEvent,
} from '../simulation/engine';
import {
  predictNextState, PredictionResult,
  estimateETA, ETAResult,
  suggestRoutes, RouteOption,
  applyPeakPattern, getCurrentPeakHour,
  buildHeatmap, HeatmapPoint,
} from '../ml/predictor';

export type SimSpeed = 'slow' | 'normal' | 'fast';

export const SIM_INTERVALS: Record<SimSpeed, number> = {
  slow: 3000,
  normal: 1800,
  fast: 700,
};

export type WhatIfMeta = {
  targetId: number;
  affectedIds: number[];
  active: boolean;
};

type RaahStore = {
  nodes: NodeType[];
  routes: RouteType[];
  metrics: TrafficMetrics;
  prevAvgScore: number;

  tick: number;
  isSimulating: boolean;
  simSpeed: SimSpeed;
  peakHour: PeakHour;
  intervalRef: ReturnType<typeof setInterval> | null;

  selectedNode: NodeType | null;
  routeFrom: number | null;
  routeTo: number | null;

  predictions: PredictionResult[];
  eta: ETAResult | null;
  routeOptions: RouteOption[];
  heatmap: HeatmapPoint[];
  showHeatmap: boolean;
  showPredictions: boolean;

  whatIfMeta: WhatIfMeta | null;
  events: EngineEvent[];

  tick_step: () => void;
  startSimulation: () => void;
  stopSimulation: () => void;
  setSimSpeed: (s: SimSpeed) => void;
  setPeakHour: (p: PeakHour) => void;
  applyPeak: (p: PeakHour) => void;
  runWhatIf: (nodeId: number) => void;
  clearWhatIf: () => void;
  reset: () => void;
  selectNode: (n: NodeType | null) => void;
  setRouteFrom: (id: number | null) => void;
  setRouteTo: (id: number | null) => void;
  computeRoute: () => void;
  runPrediction: () => void;
  toggleHeatmap: () => void;
  togglePredictions: () => void;
};

const cloneNodes = (nodes: NodeType[]): NodeType[] =>
  nodes.map((n) => ({ ...n, historicalTraffic: [...n.historicalTraffic] }));

// 🔥 FIX: normalize severity type
const normalizeEvents = (events: EngineEvent[]): EngineEvent[] =>
  events.map((e) => ({
    ...e,
    severity: e.severity as 'info' | 'warning' | 'critical',
  }));

export const useRaahStore = create<RaahStore>((set, get) => ({
  nodes: cloneNodes(INITIAL_NODES),
  routes: ROUTES,
  metrics: computeMetrics(cloneNodes(INITIAL_NODES)),
  prevAvgScore: 35,

  tick: 0,
  isSimulating: false,
  simSpeed: 'normal',
  peakHour: getCurrentPeakHour(),
  intervalRef: null,

  selectedNode: null,
  routeFrom: null,
  routeTo: null,

  predictions: [],
  eta: null,
  routeOptions: [],
  heatmap: [],
  showHeatmap: false,
  showPredictions: false,

  whatIfMeta: null,

  events: [
    {
      id: 'init',
      tick: 0,
      timestamp: new Date().toLocaleTimeString(),
      action: 'Digital Twin initialised',
      detail: `${INITIAL_NODES.length} nodes · ${ROUTES.length} routes loaded`,
      severity: 'info',
    },
  ],

  // 🔁 TICK
  tick_step: () => {
    const { nodes, tick, peakHour, events, metrics } = get();

    const { nodes: updated, events: newEvts } = simulationTick(
      nodes,
      tick + 1,
      peakHour
    );

    const newMetrics = computeMetrics(updated, metrics.avgCongestionScore);

    set({
      nodes: updated,
      tick: tick + 1,
      metrics: newMetrics,
      prevAvgScore: metrics.avgCongestionScore,

      events: [...normalizeEvents(newEvts), ...events].slice(0, 50),

      heatmap: get().showHeatmap ? buildHeatmap(updated) : get().heatmap,
      predictions: get().showPredictions
        ? predictNextState(updated, peakHour)
        : get().predictions,
    });
  },

  // ▶️ START
  startSimulation: () => {
    const { isSimulating, simSpeed } = get();
    if (isSimulating) return;

    const ref = setInterval(() => {
      useRaahStore.getState().tick_step();
    }, SIM_INTERVALS[simSpeed]);

    set({ isSimulating: true, intervalRef: ref });
  },

  // ⏹ STOP
  stopSimulation: () => {
    const { intervalRef } = get();
    if (intervalRef) clearInterval(intervalRef);

    set({ isSimulating: false, intervalRef: null });
  },

  setSimSpeed: (s) => {
    const { isSimulating, intervalRef } = get();

    if (intervalRef) clearInterval(intervalRef);

    if (isSimulating) {
      const ref = setInterval(() => {
        useRaahStore.getState().tick_step();
      }, SIM_INTERVALS[s]);

      set({ simSpeed: s, intervalRef: ref });
    } else {
      set({ simSpeed: s });
    }
  },

  setPeakHour: (p) => set({ peakHour: p }),

  applyPeak: (p: PeakHour) => {
    const { nodes, events, tick } = get();

    const updated = applyPeakPattern(nodes, p);
    const newMetrics = computeMetrics(updated);

    set({
      nodes: updated,
      peakHour: p,
      metrics: newMetrics,
      events: [
        {
          id: Math.random().toString(36).slice(2),
          tick,
          timestamp: new Date().toLocaleTimeString(),
          action: `Peak pattern: ${p.toUpperCase()}`,
          detail: 'Traffic recalibrated',
          severity: 'info' as const,
        },
        ...events,
      ].slice(0, 50),
    });
  },

  runWhatIf: (nodeId) => {
    const { nodes, events, tick } = get();

    const { nodes: updated, affectedIds, events: newEvts } =
      whatIfScenario(nodes, nodeId, tick);

    const newMetrics = computeMetrics(updated);

    set({
      nodes: updated,
      metrics: newMetrics,
      whatIfMeta: { targetId: nodeId, affectedIds, active: true },
      events: [...normalizeEvents(newEvts), ...events].slice(0, 50),
      tick: tick + 1,
    });
  },

  clearWhatIf: () => set({ whatIfMeta: null }),

  reset: () => {
    const { intervalRef } = get();
    if (intervalRef) clearInterval(intervalRef);

    const fresh = resetNodes();

    set({
      nodes: fresh,
      metrics: computeMetrics(fresh),
      tick: 0,
      isSimulating: false,
      intervalRef: null,
      selectedNode: null,
      whatIfMeta: null,
      predictions: [],
      eta: null,
      routeOptions: [],
      heatmap: [],
      routeFrom: null,
      routeTo: null,
      peakHour: getCurrentPeakHour(),

      events: [
        {
          id: 'reset',
          tick: 0,
          timestamp: new Date().toLocaleTimeString(),
          action: 'System reset',
          detail: 'Restored initial state',
          severity: 'info',
        },
      ],
    });
  },

  selectNode: (n) => set({ selectedNode: n }),

  setRouteFrom: (id) => set({ routeFrom: id, eta: null, routeOptions: [] }),
  setRouteTo: (id) => set({ routeTo: id, eta: null, routeOptions: [] }),

  computeRoute: () => {
    const { nodes, routes, routeFrom, routeTo } = get();

    if (routeFrom === null || routeTo === null) return;

    const eta = estimateETA(nodes, routes, routeFrom, routeTo);
    const options = suggestRoutes(nodes, routes, routeFrom, routeTo);

    set({ eta, routeOptions: options });
  },

  runPrediction: () => {
    const { nodes, peakHour } = get();

    const predictions = predictNextState(nodes, peakHour);

    set({ predictions, showPredictions: true });
  },

  toggleHeatmap: () => {
    const { showHeatmap, nodes } = get();

    set({
      showHeatmap: !showHeatmap,
      heatmap: !showHeatmap ? buildHeatmap(nodes) : [],
    });
  },

  togglePredictions: () => {
    const { showPredictions, nodes, peakHour } = get();

    set({
      showPredictions: !showPredictions,
      predictions: !showPredictions
        ? predictNextState(nodes, peakHour)
        : [],
    });
  },
}));
