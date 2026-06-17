'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { useRaahStore } from '../utils/store';
import { TRAFFIC_COLORS, TRAFFIC_BG, buildLeafletIcon } from '../utils/colors';
import { TrafficLevel, NodeType } from '../data/nodes';

// Fix Leaflet icon paths in Next.js
function FixLeafletIcons() {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);
  return null;
}

// ── Heatmap circles ───────────────────────────────────────────────────────────
function HeatmapLayer() {
  const { nodes, showHeatmap } = useRaahStore();
  if (!showHeatmap) return null;
  return (
    <>
      {nodes.map((node) => {
        const intensity = node.congestionScore / 100;
        const color = node.traffic === 'high' ? '#ef4444' : node.traffic === 'medium' ? '#f59e0b' : '#22c55e';
        return (
          <Circle
            key={`h-${node.id}`}
            center={node.position}
            radius={350 + intensity * 400}
            pathOptions={{
              color: 'none',
              fillColor: color,
              fillOpacity: 0.12 + intensity * 0.2,
            }}
          />
        );
      })}
    </>
  );
}

// ── Route highlight (from route planner) ─────────────────────────────────────
function RouteHighlight() {
  const { routeOptions, nodes } = useRaahStore();
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <>
      {routeOptions.map((opt, idx) => {
        const positions = opt.path
          .map((id) => nodeMap.get(id)?.position)
          .filter(Boolean) as [number, number][];
        const color = idx === 0 ? '#818cf8' : '#4ade80';
        return (
          <Polyline
            key={`route-${opt.label}`}
            positions={positions}
            color={color}
            weight={4}
            opacity={0.85}
            dashArray={idx === 1 ? '8 4' : undefined}
          />
        );
      })}
    </>
  );
}

// ── What-if highlight circles ─────────────────────────────────────────────────
function WhatIfHighlight() {
  const { whatIfMeta, nodes } = useRaahStore();
  if (!whatIfMeta?.active) return null;
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <>
      {whatIfMeta.affectedIds.map((id) => {
        const node = nodeMap.get(id);
        if (!node) return null;
        const isTarget = id === whatIfMeta.targetId;
        return (
          <Circle
            key={`wi-${id}`}
            center={node.position}
            radius={isTarget ? 300 : 200}
            pathOptions={{
              color: isTarget ? '#ef4444' : '#f59e0b',
              fillColor: isTarget ? '#ef4444' : '#f59e0b',
              fillOpacity: 0.12,
              weight: 2,
              dashArray: isTarget ? undefined : '6 4',
            }}
          />
        );
      })}
    </>
  );
}

// ── Prediction arrows overlay ─────────────────────────────────────────────────
function PredictionDots() {
  const { predictions, nodes, showPredictions } = useRaahStore();
  if (!showPredictions || predictions.length === 0) return null;
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <>
      {predictions.filter((p) => p.predictedLevel !== p.currentLevel).map((p) => {
        const node = nodeMap.get(p.nodeId);
        if (!node) return null;
        const color = TRAFFIC_COLORS[p.predictedLevel as TrafficLevel];
        // Offset slightly so it doesn't overlap main marker
        const pos: [number, number] = [node.position[0] + 0.0015, node.position[1] + 0.0015];
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:10px;height:10px;border-radius:50%;background:${color};border:2px dashed #fff;box-shadow:0 0 8px ${color};opacity:0.85;"></div>`,
          iconSize: [10, 10], iconAnchor: [5, 5],
        });
        return <Marker key={`pred-${p.nodeId}`} position={pos} icon={icon} />;
      })}
    </>
  );
}

// ── Route polylines ───────────────────────────────────────────────────────────
function RouteLines() {
  const { nodes, routes } = useRaahStore();
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return useMemo(() => (
    <>
      {routes.map((route) => {
        const from = nodeMap.get(route.from);
        const to   = nodeMap.get(route.to);
        if (!from || !to) return null;
        const w = Math.max(
          from.traffic === 'high' ? 3 : from.traffic === 'medium' ? 2 : 1,
          to.traffic   === 'high' ? 3 : to.traffic   === 'medium' ? 2 : 1,
        );
        const color = w === 3 ? '#ef444470' : w === 2 ? '#f59e0b70' : '#22c55e45';
        return (
          <Polyline key={route.id}
            positions={[from.position, to.position]}
            color={color} weight={w === 3 ? 2.5 : w === 2 ? 2 : 1.5}
            dashArray={route.busRoute ? undefined : '6 4'}
          >
            <Popup closeButton={false}>
              <div style={{ background:'#0f1117', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#e2e8f0', minWidth:120 }}>
                <b>{route.name}</b>
                <p style={{ margin:'4px 0 0', color:'#64748b', fontSize:10 }}>{route.distance} km</p>
                {route.busRoute && <p style={{ margin:'2px 0 0', color:'#818cf8', fontSize:11 }}>🚌 {route.busRoute}</p>}
              </div>
            </Popup>
          </Polyline>
        );
      })}
    </>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [nodes, routes]);
}

// ── Node marker ───────────────────────────────────────────────────────────────
function NodeMarker({ node, isSelected }: { node: NodeType; isSelected: boolean }) {
  const { selectNode, runWhatIf } = useRaahStore();
  const color = TRAFFIC_COLORS[node.traffic as TrafficLevel];

  const icon = L.divIcon({
    className: '',
    html: buildLeafletIcon(node.traffic as TrafficLevel, isSelected),
    iconSize:   isSelected ? [22, 22] : [15, 15],
    iconAnchor: isSelected ? [11, 11] : [7, 7],
  });

  return (
    <Marker position={node.position} icon={icon}
      eventHandlers={{ click: () => selectNode(isSelected ? null : node) }}
    >
      <Popup closeButton={false}>
        <div style={{
          background:'#0f1117', border:`1px solid ${color}44`,
          borderRadius:12, padding:'12px 14px', minWidth:190, maxWidth:'85vw',
          fontFamily:'system-ui,sans-serif',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <span style={{ width:9,height:9,borderRadius:'50%',background:color,boxShadow:`0 0 8px ${color}`,display:'inline-block',flexShrink:0 }} />
            <span style={{ color:'#fff',fontWeight:700,fontSize:13 }}>{node.name}</span>
          </div>
          <p style={{ fontSize:10,color:'#94a3b8',margin:'0 0 6px' }}>{node.description}</p>
          <div style={{ display:'flex',gap:8,marginBottom:10,alignItems:'center' }}>
            <span style={{
              fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,
              background:TRAFFIC_BG[node.traffic as TrafficLevel],color,border:`1px solid ${color}44`,
            }}>{node.traffic.toUpperCase()}</span>
            <span style={{ fontSize:10,color:'#475569',fontFamily:'monospace' }}>Score: {node.congestionScore}</span>
          </div>
          <button onClick={() => runWhatIf(node.id)} style={{
            display:'block',width:'100%',padding:'7px',borderRadius:8,cursor:'pointer',
            background:'rgba(239,68,68,0.14)',color:'#fca5a5',
            border:'1px solid rgba(239,68,68,0.28)',fontSize:11,fontWeight:700,
          }}>⚠️ What-if Scenario</button>
        </div>
      </Popup>
    </Marker>
  );
}

// ── Main map ──────────────────────────────────────────────────────────────────
const DARK_TILE = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const DARK_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

export default function RaahMap() {
  const { nodes, selectedNode, showHeatmap, showPredictions } = useRaahStore();
  const CENTER: [number, number] = [24.5854, 73.7125];

  return (
    <div style={{ width:'100%', height:'100%', position:'relative' }}>
      <MapContainer center={CENTER} zoom={13}
        style={{ height:'100%', width:'100%', background:'#0a0c14' }}
        zoomControl={false}
      >
        <FixLeafletIcons />
        <TileLayer url={DARK_TILE} attribution={DARK_ATTR} />

        <HeatmapLayer />
        <WhatIfHighlight />
        <RouteLines />
        <RouteHighlight />
        <PredictionDots />

        {nodes.map((node) => (
          <NodeMarker
            key={`${node.id}-${node.traffic}-${node.congestionScore}`}
            node={node}
            isSelected={selectedNode?.id === node.id}
          />
        ))}
      </MapContainer>

      {/* Legend */}
      <div style={{
        position:'absolute', bottom:14, right:12, zIndex:1000,
        background:'rgba(8,10,18,0.92)', backdropFilter:'blur(12px)',
        border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'9px 12px',
      }}>
        <p style={{ fontSize:9,color:'#334155',margin:'0 0 5px',textTransform:'uppercase',letterSpacing:'0.08em' }}>Legend</p>
        {(['low','medium','high'] as TrafficLevel[]).map((lvl) => (
          <div key={lvl} style={{ display:'flex',alignItems:'center',gap:6,marginBottom:3 }}>
            <span style={{ width:8,height:8,borderRadius:'50%',background:TRAFFIC_COLORS[lvl],boxShadow:`0 0 5px ${TRAFFIC_COLORS[lvl]}88`,display:'inline-block' }} />
            <span style={{ fontSize:10,color:'#64748b',textTransform:'capitalize' }}>{lvl}</span>
          </div>
        ))}
        {showHeatmap && (
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)',marginTop:5,paddingTop:5 }}>
            <span style={{ fontSize:9,color:'#f43f5e' }}>🌡️ Heatmap on</span>
          </div>
        )}
        {showPredictions && (
          <div style={{ marginTop:3 }}>
            <span style={{ fontSize:9,color:'#a78bfa' }}>🤖 Predictions on</span>
          </div>
        )}
      </div>
    </div>
  );
}
