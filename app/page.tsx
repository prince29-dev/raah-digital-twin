'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import Sidebar from './components/Sidebar';
import ControlPanel from './components/ControlPanel';

const RaahMap = dynamic(() => import('./components/Map'), { ssr: false });

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{
      display: 'flex', height: '100dvh', width: '100vw',
      overflow: 'hidden', background: '#080a12', color: '#e2e8f0', position: 'relative',
    }}>

      {/* Desktop sidebar */}
      <div className="lg-flex" style={{ width: 296, flexShrink: 0, height: '100%', display: 'none' }}>
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSidebarOpen(false)}
          />
          <div style={{
            position: 'relative', zIndex: 1,
            width: 'min(296px, 88vw)', height: '100%',
            animation: 'slideInLeft 0.22s ease',
          }}>
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <ControlPanel onMenuClick={() => setSidebarOpen(true)} />
        <div style={{ flex: 1, position: 'relative' }}>
          <RaahMap />
        </div>
      </div>

      <style>{`
        @keyframes slideInLeft{from{transform:translateX(-100%);opacity:0}to{transform:translateX(0);opacity:1}}
      `}</style>
    </div>
  );
}
