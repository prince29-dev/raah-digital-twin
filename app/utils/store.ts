import { create } from 'zustand';
import { NodeType, INITIAL_NODES, ROUTES, RouteType } from '../data/nodes';
import {
  propagateTraffic,
  randomiseTraffic,
  whatIfScenario,
  resetTraffic,
  computeMetrics,
  TrafficMetrics,
} from '../simulation/engine';

export type SimulationLog = {
  id: string;
  timestamp: string;
  action: string;
  detail?: string;
};

type RaahStore = {
  nodes: NodeType[];
  routes: RouteType[];
  metrics: TrafficMetrics;
  selectedNode: NodeType | null;
  isSimulating: boolean;
  simulationStep: number;
  logs: SimulationLog[];

  // Actions
  simulate: () => void;
  propagate: () => void;
  reset: () => void;
  whatIf: (nodeId: number) => void;
  selectNode: (node: NodeType | null) => void;
  autoSimulate: () => void;
};

const addLog = (
  logs: SimulationLog[],
  action: string,
  detail?: string
): SimulationLog[] => {
  const entry: SimulationLog = {
    id: Math.random().toString(36).slice(2),
    timestamp: new Date().toLocaleTimeString(),
    action,
    detail,
  };
  return [entry, ...logs].slice(0, 20); // keep last 20
};

export const useRaahStore = create<RaahStore>((set, get) => ({
  nodes: INITIAL_NODES,
  routes: ROUTES,
  metrics: computeMetrics(INITIAL_NODES),
  selectedNode: null,
  isSimulating: false,
  simulationStep: 0,
  logs: [
    {
      id: 'init',
      timestamp: new Date().toLocaleTimeString(),
      action: 'System initialised',
      detail: `${INITIAL_NODES.length} nodes loaded`,
    },
  ],

  simulate: () => {
    const { nodes, logs } = get();
    const updated = randomiseTraffic(nodes);
    set({
      nodes: updated,
      metrics: computeMetrics(updated),
      simulationStep: get().simulationStep + 1,
      logs: addLog(logs, 'Traffic simulated', 'Random traffic pattern applied'),
    });
  },

  propagate: () => {
    const { nodes, logs } = get();
    const updated = propagateTraffic(nodes);
    set({
      nodes: updated,
      metrics: computeMetrics(updated),
      simulationStep: get().simulationStep + 1,
      logs: addLog(logs, 'Traffic propagated', 'Congestion spread to neighbours'),
    });
  },

  reset: () => {
    const { nodes, logs } = get();
    const updated = resetTraffic(nodes, INITIAL_NODES);
    set({
      nodes: updated,
      metrics: computeMetrics(updated),
      simulationStep: 0,
      selectedNode: null,
      logs: addLog(logs, 'System reset', 'Restored initial state'),
    });
  },

  whatIf: (nodeId: number) => {
    const { nodes, logs } = get();
    const target = nodes.find((n) => n.id === nodeId);
    if (!target) return;
    const updated = whatIfScenario(nodes, nodeId);
    set({
      nodes: updated,
      metrics: computeMetrics(updated),
      simulationStep: get().simulationStep + 1,
      logs: addLog(
        logs,
        `What-if: ${target.name} → HIGH`,
        'Congestion propagated to adjacent nodes'
      ),
    });
  },

  selectNode: (node) => set({ selectedNode: node }),

  autoSimulate: () => {
    const { isSimulating } = get();
    if (isSimulating) {
      set({ isSimulating: false });
      return;
    }
    set({ isSimulating: true });
    const interval = setInterval(() => {
      const { isSimulating: still } = useRaahStore.getState();
      if (!still) {
        clearInterval(interval);
        return;
      }
      useRaahStore.getState().propagate();
    }, 2000);
  },
}));
