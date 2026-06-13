'use client';
type SidebarProps = {
  onClose?: () => void;
};

import { useRaahStore } from '../utils/store';
import { TRAFFIC_COLORS, TRAFFIC_BG, TRAFFIC_LABELS, NODE_TYPE_ICONS } from '../utils/colors';
import { TrafficLevel } from '../data/nodes';

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}) {
  return (
    <div
      className="rounded-xl p-3 flex flex-col gap-1"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="text-2xl font-bold" style={{ color: accent }}>{value}</span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  );
}

function TrafficBadge({ level }: { level: TrafficLevel }) {
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{
        background: TRAFFIC_BG[level],
        color: TRAFFIC_COLORS[level],
        border: `1px solid ${TRAFFIC_COLORS[level]}44`,
      }}
    >
      {TRAFFIC_LABELS[level]}
    </span>
  );
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { nodes, metrics, selectedNode, selectNode, whatIf, logs } = useRaahStore();

  return (
    <aside
      className="flex flex-col h-full overflow-hidden"
      style={{
        width: 300,
        background: 'rgba(10,12,20,0.95)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Header */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🗺️</span>
          <span className="font-bold text-white text-base tracking-tight">RAAH</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-mono"
            style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8', border: '1px solid #4f46e540' }}
          >
            DIGITAL TWIN
          </span>
        </div>
        <p className="text-xs text-gray-500">Udaipur Smart Mobility System</p>
      </div>

      {/* Metrics */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">System Metrics</p>
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            label="Congestion"
            value={`${metrics.congestionRatio}%`}
            sub={`${metrics.highCount} high-traffic nodes`}
            accent="#ef4444"
          />
          <MetricCard
            label="Avg. Level"
            value={metrics.averageLevel.toUpperCase()}
            sub={`${metrics.totalNodes} total nodes`}
            accent="#818cf8"
          />
          <MetricCard
            label="High"
            value={metrics.highCount}
            accent="#ef4444"
          />
          <MetricCard
            label="Medium"
            value={metrics.mediumCount}
            accent="#f59e0b"
          />
        </div>
        {metrics.busiestNode && (
          <div
            className="mt-2 rounded-lg px-3 py-2 flex items-center gap-2"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <span className="text-red-400 text-sm">🔥</span>
            <div>
              <p className="text-xs text-gray-400">Busiest Node</p>
              <p className="text-sm font-semibold text-white">{metrics.busiestNode.name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Node List */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
          Nodes ({nodes.length})
        </p>
        <div className="flex flex-col gap-1.5">
          {nodes.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            return (
              <button
                key={node.id}
                onClick={() => selectNode(isSelected ? null : node)}
                className="w-full text-left rounded-lg px-3 py-2.5 transition-all duration-200"
                style={{
                  background: isSelected
                    ? 'rgba(99,102,241,0.15)'
                    : 'rgba(255,255,255,0.03)',
                  border: isSelected
                    ? '1px solid rgba(99,102,241,0.4)'
                    : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{
                        background: TRAFFIC_COLORS[node.traffic as TrafficLevel],
                        boxShadow: `0 0 6px ${TRAFFIC_COLORS[node.traffic as TrafficLevel]}88`,
                      }}
                    />
                    <span className="text-sm text-white truncate font-medium">
                      {NODE_TYPE_ICONS[node.type]} {node.name}
                    </span>
                  </div>
                  <TrafficBadge level={node.traffic as TrafficLevel} />
                </div>
                {isSelected && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-400">{node.description}</p>
                    <p className="text-xs text-gray-500">{node.connections.length} connections</p>
                    <button
                      className="mt-1.5 w-full text-xs py-1 rounded-md font-semibold transition-colors"
                      style={{
                        background: 'rgba(239,68,68,0.2)',
                        color: '#fca5a5',
                        border: '1px solid rgba(239,68,68,0.3)',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        whatIf(node.id);
                      }}
                    >
                      ⚠️ What-if: Make High
                    </button>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Activity Log */}
      <div
        className="px-4 py-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', maxHeight: 160, overflowY: 'auto' }}
      >
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Activity Log</p>
        <div className="flex flex-col gap-1">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-2">
              <span className="text-xs text-gray-600 flex-shrink-0 font-mono">{log.timestamp}</span>
              <div>
                <span className="text-xs text-gray-300">{log.action}</span>
                {log.detail && (
                  <span className="text-xs text-gray-500 block">{log.detail}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
