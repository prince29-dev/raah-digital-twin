'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import { useRaahStore } from '../utils/store';
import { TRAFFIC_COLORS, TRAFFIC_BG, buildLeafletIcon } from '../utils/colors';
import { TrafficLevel, NodeType } from '../data/nodes';

// Fix leaflet default icon bug in Next.js
function FixLeafletIcons() {
  useEffect(() => {
    // @ts-expect-error leaflet private
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);
  return null;
}

function NodeMarker({ node, isSelected }: { node: NodeType; isSelected: boolean }) {
  const { selectNode, whatIf } = useRaahStore();
  const color = TRAFFIC_COLORS[node.traffic as TrafficLevel];

  const icon = L.divIcon({
    className: '',
    html: buildLeafletIcon(node.traffic as TrafficLevel, isSelected),
    iconSize: isSelected ? [22, 22] : [16, 16],
    iconAnchor: isSelected ? [11, 11] : [8, 8],
  });

  return (
    <Marker
      position={node.position}
      icon={icon}
      eventHandlers={{
        click: () => selectNode(isSelected ? null : node),
      }}
    >
      <Popup
        closeButton={false}
        className="raah-popup"
      >
        <div
          style={{
            background: '#0f1117',
            border: `1px solid ${color}44`,
            borderRadius: 12,
            padding: '12px 16px',
            minWidth: 200,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: color,
                boxShadow: `0 0 8px ${color}`,
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{node.name}</span>
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
            {node.description}
          </div>
          <div
            style={{
              display: 'inline-block',
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 20,
              background: TRAFFIC_BG[node.traffic as TrafficLevel],
              color: color,
              border: `1px solid ${color}44`,
              marginBottom: 8,
            }}
          >
            {node.traffic.toUpperCase()} TRAFFIC
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>
            Connections: {node.connections.length} nodes
          </div>
          <button
            onClick={() => whatIf(node.id)}
            style={{
              width: '100%',
              padding: '6px',
              borderRadius: 8,
              background: 'rgba(239,68,68,0.15)',
              color: '#fca5a5',
              border: '1px solid rgba(239,68,68,0.3)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ⚠️ What-if Scenario
          </button>
        </div>
      </Popup>
    </Marker>
  );
}

function RouteLines() {
  const { nodes, routes } = useRaahStore();
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <>
      {routes.map((route) => {
        const from = nodeMap.get(route.from);
        const to = nodeMap.get(route.to);
        if (!from || !to) return null;

        // Color the route by the worse end
        const fromWeight = from.traffic === 'high' ? 3 : from.traffic === 'medium' ? 2 : 1;
        const toWeight = to.traffic === 'high' ? 3 : to.traffic === 'medium' ? 2 : 1;
        const worse = Math.max(fromWeight, toWeight);
        const routeColor =
          worse === 3 ? '#ef444480' : worse === 2 ? '#f59e0b80' : '#22c55e50';
        const weight = worse === 3 ? 3 : worse === 2 ? 2 : 1.5;

        return (
          <Polyline
            key={route.id}
            positions={[from.position, to.position]}
            color={routeColor}
            weight={weight}
            dashArray={route.busRoute ? undefined : '6 4'}
          >
            <Popup closeButton={false}>
              <div style={{ background: '#0f1117', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#e2e8f0' }}>
                <b>{route.name}</b>
                {route.busRoute && (
                  <div style={{ color: '#818cf8', marginTop: 4 }}>🚌 {route.busRoute}</div>
                )}
              </div>
            </Popup>
          </Polyline>
        );
      })}
    </>
  );
}

// Dark Carto tile layer for the smart-city aesthetic
const DARK_TILE = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const DARK_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

export default function RaahMap() {
  const { nodes, selectedNode } = useRaahStore();
  const CENTER: [number, number] = [24.5854, 73.7125];

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <MapContainer
        center={CENTER}
        zoom={13}
        style={{ height: '100%', width: '100%', background: '#0a0c14' }}
        zoomControl={false}
      >
        <FixLeafletIcons />
        <TileLayer url={DARK_TILE} attribution={DARK_ATTR} />
        <RouteLines />
        {nodes.map((node) => (
          <NodeMarker
            key={`${node.id}-${node.traffic}`}
            node={node}
            isSelected={selectedNode?.id === node.id}
          />
        ))}
      </MapContainer>

      {/* Map legend */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          right: 16,
          background: 'rgba(10,12,20,0.9)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: '10px 14px',
          backdropFilter: 'blur(12px)',
          zIndex: 1000,
        }}
      >
        <p style={{ fontSize: 10, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Traffic Level
        </p>
        {(['low', 'medium', 'high'] as TrafficLevel[]).map((level) => (
          <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span
              style={{
                width: 10, height: 10, borderRadius: '50%',
                background: TRAFFIC_COLORS[level],
                boxShadow: `0 0 6px ${TRAFFIC_COLORS[level]}88`,
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' }}>{level}</span>
          </div>
        ))}
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ width: 20, height: 2, background: '#22c55e50', display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Road</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 20, height: 2, background: '#818cf8', display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Bus Route</span>
          </div>
        </div>
      </div>
    </div>
  );
}
