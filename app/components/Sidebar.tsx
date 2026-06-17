'use client';

import { useMemo, useState } from 'react';
import { useRaahStore } from '../utils/store';
import { TRAFFIC_COLORS, TRAFFIC_BG, TRAFFIC_LABELS, NODE_TYPE_ICONS } from '../utils/colors';
import { TrafficLevel } from '../data/nodes';
import { PEAK_PROFILES } from '../ml/predictor';

type Tab = 'nodes' | 'routes' | 'ml' | 'log';

// ── Tiny helpers ──────────────────────────────────────────────────────────────
function Badge({ level }: { level: TrafficLevel }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 20, flexShrink: 0,
      background: TRAFFIC_BG[level], color: TRAFFIC_COLORS[level],
      border: `1px solid ${TRAFFIC_COLORS[level]}44`,
    }}>{TRAFFIC_LABELS[level].toUpperCase()}</span>
  );
}

function Dot({ level, score }: { level: TrafficLevel; score?: number }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
        background: TRAFFIC_COLORS[level],
        boxShadow: `0 0 5px ${TRAFFIC_COLORS[level]}88`,
      }} />
      {score !== undefined && (
        <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>{score}</span>
      )}
    </span>
  );
}

function MetricCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent: string }) {
  return (
    <div style={{
      borderRadius: 10, padding: '9px 12px', display: 'flex', flexDirection: 'column', gap: 2,
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
    }}>
      <span style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      <span style={{ fontSize: 20, fontWeight: 800, color: accent, lineHeight: 1.2 }}>{value}</span>
      {sub && <span style={{ fontSize: 9, color: '#334155' }}>{sub}</span>}
    </div>
  );
}

// ── Tab button ────────────────────────────────────────────────────────────────
function TabBtn({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '7px 4px', fontSize: 10, fontWeight: 700, cursor: 'pointer',
      borderRadius: 7, transition: 'all 0.15s',
      background: active ? 'rgba(99,102,241,0.18)' : 'transparent',
      color: active ? '#a5b4fc' : '#475569',
      border: active ? '1px solid rgba(99,102,241,0.35)' : '1px solid transparent',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
    }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      {label}
    </button>
  );
}

// ── Congestion bar ────────────────────────────────────────────────────────────
function CongestionBar({ score }: { score: number }) {
  const color = score >= 65 ? '#ef4444' : score >= 35 ? '#f59e0b' : '#22c55e';
  return (
    <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginTop: 5 }}>
      <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.4s ease' }} />
    </div>
  );
}

// ── Main Sidebar ──────────────────────────────────────────────────────────────
export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const {
    nodes, routes, metrics, events, peakHour,
    selectedNode, selectNode, runWhatIf, clearWhatIf, whatIfMeta,
    predictions, eta, routeOptions, routeFrom, routeTo,
    setRouteFrom, setRouteTo, computeRoute,
  } = useRaahStore();

  const [tab, setTab] = useState<Tab>('nodes');

  const sortedNodes = useMemo(
    () => [...nodes].sort((a, b) => b.congestionScore - a.congestionScore),
    [nodes],
  );

  const trendIcon = metrics.trend === 'rising' ? '↑' : metrics.trend === 'falling' ? '↓' : '→';
  const trendColor = metrics.trend === 'rising' ? '#ef4444' : metrics.trend === 'falling' ? '#22c55e' : '#94a3b8';

  return (
    <aside style={{
      display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
      background: 'rgba(8,10,18,0.98)', backdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden',
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '12px 16px', flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
            <span style={{ fontSize: 16 }}>🗺️</span>
            <span style={{ fontWeight: 800, color: '#fff', fontSize: 14, letterSpacing: '-0.02em' }}>RAAH</span>
            <span style={{
              fontSize: 9, padding: '2px 7px', borderRadius: 20, fontFamily: 'monospace', fontWeight: 800,
              background: 'rgba(99,102,241,0.18)', color: '#818cf8', border: '1px solid #4f46e530',
            }}>DIGITAL TWIN</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 9, color: '#475569' }}>Udaipur Smart Mobility</span>
            <span style={{ fontSize: 9, color: trendColor, fontWeight: 700 }}>
              {PEAK_PROFILES[peakHour].icon} {PEAK_PROFILES[peakHour].label} {trendIcon}
            </span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(255,255,255,0.09)',
            background: 'rgba(255,255,255,0.04)', color: '#64748b', cursor: 'pointer', fontSize: 14,
          }}>✕</button>
        )}
      </div>

      {/* ── Metric strip ── */}
      <div style={{
        padding: '10px 14px', flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
          <MetricCard label="Congestion" value={`${metrics.congestionRatio}%`}
            sub={`${metrics.highCount} critical nodes`} accent="#ef4444" />
          <MetricCard label="Avg Score" value={metrics.avgCongestionScore}
            sub={`trend ${trendIcon}`} accent={trendColor} />
          <MetricCard label="High" value={metrics.highCount} accent="#ef4444" />
          <MetricCard label="Low" value={metrics.lowCount} accent="#22c55e" />
        </div>
        {metrics.busiestNode && (
          <div style={{
            borderRadius: 8, padding: '7px 10px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 13 }}>🔥</span>
              <div>
                <p style={{ fontSize: 9, color: '#64748b', margin: 0 }}>Busiest</p>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: 0 }}>
                  {metrics.busiestNode.name}
                </p>
              </div>
            </div>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#ef4444', fontWeight: 700 }}>
              {metrics.busiestNode.congestionScore}
            </span>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex', gap: 4, padding: '8px 12px', flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <TabBtn label="Nodes"   icon="📍" active={tab === 'nodes'}  onClick={() => setTab('nodes')} />
        <TabBtn label="Routes"  icon="🗺️" active={tab === 'routes'} onClick={() => setTab('routes')} />
        <TabBtn label="ML"      icon="🤖" active={tab === 'ml'}     onClick={() => setTab('ml')} />
        <TabBtn label="Log"     icon="📋" active={tab === 'log'}    onClick={() => setTab('log')} />
      </div>

      {/* ── Tab content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>

        {/* NODES */}
        {tab === 'nodes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {sortedNodes.map((node) => {
              const isSel = selectedNode?.id === node.id;
              const isAffected = whatIfMeta?.affectedIds.includes(node.id);
              const isTarget = whatIfMeta?.targetId === node.id;
              return (
                <button key={node.id}
                  onClick={() => selectNode(isSel ? null : node)}
                  style={{
                    width: '100%', textAlign: 'left', borderRadius: 9, padding: '9px 11px',
                    cursor: 'pointer', transition: 'all 0.15s',
                    background: isTarget ? 'rgba(239,68,68,0.12)' :
                                isAffected ? 'rgba(245,158,11,0.09)' :
                                isSel ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                    border: isTarget ? '1px solid rgba(239,68,68,0.4)' :
                            isAffected ? '1px solid rgba(245,158,11,0.3)' :
                            isSel ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(255,255,255,0.06)',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                      <Dot level={node.traffic as TrafficLevel} score={node.congestionScore} />
                      <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {NODE_TYPE_ICONS[node.type]} {node.name}
                      </span>
                    </div>
                    <Badge level={node.traffic as TrafficLevel} />
                  </div>
                  <CongestionBar score={node.congestionScore} />

                  {isSel && (
                    <div style={{ marginTop: 9, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <p style={{ fontSize: 10, color: '#64748b', margin: '0 0 3px' }}>{node.description}</p>
                      <p style={{ fontSize: 9, color: '#334155', margin: '0 0 8px', fontFamily: 'monospace' }}>
                        {node.connections.length} links · {node.position[0].toFixed(3)},{node.position[1].toFixed(3)}
                      </p>
                      {/* History pills */}
                      <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
                        {node.historicalTraffic.slice(0, 5).map((lvl, i) => (
                          <span key={i} style={{
                            width: 16, height: 16, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: TRAFFIC_BG[lvl as TrafficLevel], fontSize: 7, color: TRAFFIC_COLORS[lvl as TrafficLevel], fontWeight: 800,
                          }}>{lvl[0].toUpperCase()}</span>
                        ))}
                        <span style={{ fontSize: 9, color: '#334155', alignSelf: 'center', marginLeft: 2 }}>history</span>
                      </div>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button onClick={(e) => { e.stopPropagation(); runWhatIf(node.id); }} style={{
                          flex: 1, padding: '6px', borderRadius: 7, cursor: 'pointer',
                          background: 'rgba(239,68,68,0.14)', color: '#fca5a5',
                          border: '1px solid rgba(239,68,68,0.28)', fontSize: 11, fontWeight: 700,
                        }}>⚠️ What-if</button>
                        {whatIfMeta?.active && (
                          <button onClick={(e) => { e.stopPropagation(); clearWhatIf(); }} style={{
                            padding: '6px 10px', borderRadius: 7, cursor: 'pointer',
                            background: 'rgba(255,255,255,0.05)', color: '#64748b',
                            border: '1px solid rgba(255,255,255,0.09)', fontSize: 11, fontWeight: 700,
                          }}>Clear</button>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ROUTES / ETA */}
        {tab === 'routes' && (
          <div>
            <p style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Smart Route Planner</p>

            {/* From / To selectors */}
            {['From', 'To'].map((label, li) => {
              const val = li === 0 ? routeFrom : routeTo;
              const setter = li === 0 ? setRouteFrom : setRouteTo;
              return (
                <div key={label} style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>{label}</p>
                  <select
                    value={val ?? ''}
                    onChange={(e) => setter(e.target.value ? Number(e.target.value) : null)}
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 8, fontSize: 12,
                      background: 'rgba(255,255,255,0.05)', color: '#e2e8f0',
                      border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
                    }}
                  >
                    <option value="">— select node —</option>
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>{NODE_TYPE_ICONS[n.type]} {n.name}</option>
                    ))}
                  </select>
                </div>
              );
            })}

            <button
              onClick={computeRoute}
              disabled={routeFrom === null || routeTo === null}
              style={{
                width: '100%', padding: '9px', borderRadius: 9, fontSize: 12, fontWeight: 700,
                cursor: routeFrom !== null && routeTo !== null ? 'pointer' : 'not-allowed',
                background: 'rgba(99,102,241,0.22)', color: '#a5b4fc',
                border: '1px solid rgba(99,102,241,0.4)',
                opacity: routeFrom !== null && routeTo !== null ? 1 : 0.45,
                marginBottom: 12,
              }}
            >
              🔍 Find Routes
            </button>

            {/* ETA result */}
            {eta && (
              <div style={{
                borderRadius: 10, padding: '10px 12px', marginBottom: 10,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              }}>
                <p style={{ fontSize: 10, color: '#64748b', margin: '0 0 6px' }}>Fastest Route ETA</p>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 22, fontWeight: 800, color: '#818cf8', margin: 0 }}>{eta.etaMinutes} <span style={{ fontSize: 12 }}>min</span></p>
                    <p style={{ fontSize: 9, color: '#475569', margin: 0 }}>{eta.distanceKm} km</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 18, fontWeight: 800, color: eta.congestionFactor > 2 ? '#ef4444' : '#f59e0b', margin: 0 }}>
                      {eta.congestionFactor}×
                    </p>
                    <p style={{ fontSize: 9, color: '#475569', margin: 0 }}>congestion</p>
                  </div>
                </div>
                <p style={{ fontSize: 10, color: '#334155', margin: '6px 0 0', fontFamily: 'monospace' }}>
                  {eta.path.map((id) => nodes.find((n) => n.id === id)?.name ?? id).join(' → ')}
                </p>
              </div>
            )}

            {/* Route options */}
            {routeOptions.map((opt) => (
              <div key={opt.label} style={{
                borderRadius: 9, padding: '9px 12px', marginBottom: 6,
                background: opt.label === 'least_congested' ? 'rgba(34,197,94,0.07)' : 'rgba(255,255,255,0.03)',
                border: opt.label === 'least_congested' ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: opt.label === 'least_congested' ? '#4ade80' : '#818cf8' }}>
                    {opt.label === 'fastest' ? '⚡ Fastest' : '🌿 Least Congested'}
                  </span>
                  <Badge level={opt.avgCongestion} />
                </div>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                  {opt.etaMinutes} min · {opt.distanceKm} km
                </p>
                <p style={{ fontSize: 9, color: '#334155', margin: '3px 0 0', fontFamily: 'monospace' }}>
                  {opt.path.map((id) => nodes.find((n) => n.id === id)?.name?.split(' ')[0]).join(' › ')}
                </p>
              </div>
            ))}

            {/* Route list */}
            <p style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '14px 0 8px' }}>All Routes</p>
            {routes.map((r) => {
              const fn = nodes.find((n) => n.id === r.from);
              const tn = nodes.find((n) => n.id === r.to);
              const worse = fn && tn ? (
                [fn.traffic, tn.traffic].includes('high') ? 'high' :
                [fn.traffic, tn.traffic].includes('medium') ? 'medium' : 'low'
              ) as TrafficLevel : 'low';
              return (
                <div key={r.id} style={{
                  borderRadius: 7, padding: '7px 10px', marginBottom: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <div>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, fontWeight: 600 }}>{r.name}</p>
                    {r.busRoute && <p style={{ fontSize: 9, color: '#818cf8', margin: 0 }}>🚌 {r.busRoute}</p>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 9, color: '#475569' }}>{r.distance}km</span>
                    <Dot level={worse} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ML PREDICTIONS */}
        {tab === 'ml' && (
          <div>
            <p style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              ML Predictions
            </p>
            {predictions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#334155' }}>
                <p style={{ fontSize: 28, marginBottom: 8 }}>🤖</p>
                <p style={{ fontSize: 12, color: '#475569' }}>Click Predict in the toolbar</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {predictions.map((p) => {
                  const node = nodes.find((n) => n.id === p.nodeId);
                  if (!node) return null;
                  const changed = p.predictedLevel !== p.currentLevel;
                  return (
                    <div key={p.nodeId} style={{
                      borderRadius: 8, padding: '8px 11px',
                      background: changed ? 'rgba(167,139,250,0.07)' : 'rgba(255,255,255,0.02)',
                      border: changed ? '1px solid rgba(167,139,250,0.25)' : '1px solid rgba(255,255,255,0.05)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: '#e2e8f0', fontWeight: 600 }}>{node.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Badge level={p.currentLevel} />
                          {changed && <span style={{ fontSize: 10, color: '#a78bfa' }}>→</span>}
                          {changed && <Badge level={p.predictedLevel} />}
                        </div>
                      </div>
                      {/* Confidence bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                          <div style={{ width: `${p.confidence * 100}%`, height: '100%', background: '#a78bfa', borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 9, color: '#475569', fontFamily: 'monospace', flexShrink: 0 }}>
                          {Math.round(p.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* LOG */}
        {tab === 'log' && (
          <div>
            <p style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Activity Log ({events.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {events.map((evt) => {
                const c = evt.severity === 'critical' ? '#ef4444' : evt.severity === 'warning' ? '#f59e0b' : '#64748b';
                return (
                  <div key={evt.id} style={{
                    borderRadius: 7, padding: '6px 9px',
                    background: evt.severity === 'critical' ? 'rgba(239,68,68,0.06)' :
                                evt.severity === 'warning'  ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${c}22`,
                  }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 10, color: c, flexShrink: 0, fontWeight: 700 }}>
                        T{evt.tick}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 11, color: '#cbd5e1', margin: 0, fontWeight: 600 }}>{evt.action}</p>
                        {evt.detail && <p style={{ fontSize: 9, color: '#475569', margin: '2px 0 0' }}>{evt.detail}</p>}
                      </div>
                      <span style={{ fontSize: 9, color: '#1e293b', fontFamily: 'monospace', flexShrink: 0, marginLeft: 'auto' }}>
                        {evt.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
