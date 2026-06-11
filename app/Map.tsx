'use client';


import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useState } from 'react';
import L from 'leaflet';
import { nodes } from './nodes';
import { getColor } from './colors';

type NodeType = {
  id: number;
  name: string;
  position: [number, number];
  traffic: string;
};

export default function Map() {
  const center: [number, number] = [24.5854, 73.7125];

  const [nodeData, setNodeData] = useState<NodeType[]>(nodes);

  // 🔥 TASK 1: Random Traffic
  const randomTraffic = () => {
    const levels = ['low', 'medium', 'high'];

    const updated = nodeData.map((node) => ({
      ...node,
      traffic: levels[Math.floor(Math.random() * 3)],
    }));

    setNodeData(updated);
  };

  // 🔥 TASK 2: Traffic Propagation Logic
  const simulatePropagation = () => {
    let updated = nodeData.map((node) => {
      // Surajpole high → Udaipole high
      if (node.name === 'Udaipole') {
        const suraj = nodeData.find((n) => n.name === 'Surajpole');
        if (suraj?.traffic === 'high') {
          return { ...node, traffic: 'high' };
        }
      }

      return node;
    });

    setNodeData(updated);
  };

  return (
    <div style={{ position: 'relative' }}>
      
      {/* 🔥 BUTTON 1 */}
      <button
        onClick={randomTraffic}
        style={{
          position: 'absolute',
          top: 80,
          left: 10,
          zIndex: 1000,
          background: 'black',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
        }}
      >
        Simulate Traffic 🚦
      </button>

      {/* 🔥 BUTTON 2 */}
      <button
        onClick={simulatePropagation}
        style={{
          position: 'absolute',
          top: 140,
          left: 10,
          zIndex: 1000,
          background: 'blue',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
        }}
      >
        Propagate Traffic 🔥
      </button>

      {/* 🔥 SIDEBAR */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          right: 10,
          zIndex: 1000,
          background: 'white',
          padding: '10px',
          width: '200px',
          borderRadius: '5px',
        }}
      >
        <h3>Traffic Status</h3>
        {nodeData.map((node) => (
          <div key={node.id}>
            {node.name}: {node.traffic}
          </div>
        ))}
      </div>

      {/* 🔥 MAP */}
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100vh', width: '100%' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {nodeData.map((node) => {
          const icon = L.divIcon({
            className: 'custom-icon',
            html: `<div style="
              background:${getColor(node.traffic)};
              width:15px;
              height:15px;
              border-radius:50%;
              border:2px solid white;
            "></div>`,
          });

          return (
            <Marker
              key={node.id}
              position={node.position}
              icon={icon}
            >
              <Popup>
                <b>{node.name}</b><br />
                Traffic: {node.traffic}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}