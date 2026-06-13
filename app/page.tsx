'use client';

import dynamic from 'next/dynamic';
import Sidebar from './components/Sidebar';
import ControlPanel from './components/ControlPanel';

const RaahMap = dynamic(() => import('./components/Map'), { ssr: false });

export default function Home() {
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: '#0a0c14',
        color: '#e2e8f0',
      }}
    >
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <ControlPanel />
        <RaahMap />
      </div>
    </div>
  );
}
