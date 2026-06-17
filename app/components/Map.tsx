'use client';

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from 'react-leaflet';
import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { useRaahStore } from '../utils/store';
import { TRAFFIC_COLORS, TRAFFIC_BG, buildLeafletIcon } from '../utils/colors';
import { TrafficLevel, NodeType } from '../data/nodes';

/* ---------------- FIX LEAFLET ICON ---------------- */
function FixLeafletIcons() {
  useEffect(() => {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  return null;
}

/* ---------------- NODE MARKER ---------------- */
function NodeMarker({
  node,
  isSelected,
}: {
  node: NodeType;
  isSelected: boolean;
}) {
  const { selectNode, whatIf } = useRaahStore();

  const color = TRAFFIC_COLORS[node.traffic as TrafficLevel];

  // 🔥 PERFORMANCE: memo icon
  const icon = useMemo(() => {
    return L.divIcon({
      className: '',
      html: buildLeafletIcon(node.traffic as TrafficLevel, isSelected),
      iconSize: isSelected ? [22, 22] : [16, 16],
      iconAnchor: isSelected ? [11, 11] : [8, 8],
    });
  }, [node.traffic, isSelected]);

  return (
    <Marker
      position={node.position}
      icon={icon}
      eventHandlers={{
        click: () => selectNode(isSelected ? null : node),
      }}
    >
      <Popup closeButton={false} className="raah-popup">
        <div
          style={{
            background: '#0f1117',
            border: `1px solid ${color}44`,
            borderRadius: 12,
            padding: '12px',
            minWidth: 200,
          }}
        >
          <b style={{ color: '#fff' }}>{node.name}</b>

          <div style={{ fontSize: 11, color: '#94a3b8' }}>
            {node.description}
          </div>

          <div
            style={{
              marginTop: 6,
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 20,
              background: TRAFFIC_BG[node.traffic],
              color: color,
            }}
          >
            {node.traffic.toUpperCase()}
          </div>

          <button
            onClick={() => whatIf(node.id)}
            style={{
              marginTop: 10,
              width: '100%',
              padding: '6px',
              borderRadius: 8,
              background: '#ef444422',
              color: '#fca5a5',
              fontSize: 12,
            }}
          >
            What-if 🔥
          </button>
        </div>
      </Popup>
    </Marker>
  );
}

/* ---------------- ROUTE LINES ---------------- */
function RouteLines() {
  const { nodes, routes } = useRaahStore();

  const nodeMap = useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes]
  );

  return (
    <>
      {routes.map((route) => {
        const from = nodeMap.get(route.from);
        const to = nodeMap.get(route.to);
        if (!from || !to) return null;

        const level = Math.max(
          from.traffic === 'high' ? 3 : from.traffic === 'medium' ? 2 : 1,
          to.traffic === 'high' ? 3 : to.traffic === 'medium' ? 2 : 1
        );

        const color =
          level === 3
            ? '#ef4444aa'
            : level === 2
            ? '#f59e0baa'
            : '#22c55e88';

        return (
          <Polyline
            key={route.id}
            positions={[from.position, to.position]}
            color={color}
            weight={level}
            smoothFactor={2}
            dashArray={route.busRoute ? undefined : '6 4'}
          />
        );
      })}
    </>
  );
}

/* ---------------- MAIN MAP ---------------- */
const DARK_TILE =
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

export default function RaahMap() {
  const { nodes, selectedNode } = useRaahStore();

  const CENTER: [number, number] = [24.5854, 73.7125];

  return (
    <div className="h-full w-full relative">

      <MapContainer
        center={CENTER}
        zoom={13}
        className="h-full w-full"
        zoomControl={false}
      >
        <FixLeafletIcons />

        <TileLayer url={DARK_TILE} />

        <RouteLines />

        {nodes.map((node) => (
          <NodeMarker
            key={`${node.id}-${node.traffic}`}
            node={node}
            isSelected={selectedNode?.id === node.id}
          />
        ))}
      </MapContainer>

      {/* 🔥 LEGEND (RESPONSIVE) */}
      <div className="absolute bottom-4 right-4 bg-black/80 p-3 rounded-xl text-xs backdrop-blur hidden sm:block">
        <p className="text-gray-400 mb-2">Traffic</p>

        {(['low', 'medium', 'high'] as TrafficLevel[]).map((level) => (
          <div key={level} className="flex items-center gap-2 mb-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: TRAFFIC_COLORS[level] }}
            />
            <span className="text-gray-300 capitalize">{level}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
