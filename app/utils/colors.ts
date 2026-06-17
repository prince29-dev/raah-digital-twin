import { TrafficLevel } from '../data/nodes';

export const TRAFFIC_COLORS: Record<TrafficLevel, string> = {
  low:    '#22c55e',
  medium: '#f59e0b',
  high:   '#ef4444',
};

export const TRAFFIC_GLOW: Record<TrafficLevel, string> = {
  low:    '0 0 10px #22c55e88',
  medium: '0 0 10px #f59e0b88',
  high:   '0 0 14px #ef444488',
};

export const TRAFFIC_BG: Record<TrafficLevel, string> = {
  low:    'rgba(34,197,94,0.14)',
  medium: 'rgba(245,158,11,0.14)',
  high:   'rgba(239,68,68,0.14)',
};

export const TRAFFIC_LABELS: Record<TrafficLevel, string> = {
  low: 'Low', medium: 'Medium', high: 'High',
};

export const NODE_TYPE_ICONS: Record<string, string> = {
  intersection: '🔀',
  bus_stop:     '🚌',
  landmark:     '📍',
};

export function buildLeafletIcon(level: TrafficLevel, selected = false): string {
  const color  = TRAFFIC_COLORS[level];
  const glow   = TRAFFIC_GLOW[level];
  const size   = selected ? 20 : 14;
  const border = selected ? '3px solid #fff' : '2px solid rgba(255,255,255,0.55)';
  return `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:${border};box-shadow:${glow};transition:all 0.25s ease;"></div>`;
}
