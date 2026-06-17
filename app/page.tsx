'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import Sidebar from './components/Sidebar';
import ControlPanel from './components/ControlPanel';

const RaahMap = dynamic(() => import('./components/Map'), { ssr: false });

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen overflow-hidden bg-[#0a0c14] text-white">

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-[300px] h-full flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Control Panel */}
        <ControlPanel onMenuClick={() => setSidebarOpen(true)} />

        {/* Map */}
        <div className="flex-1 relative h-full">
          <RaahMap />
        </div>

        {/* Mobile Bottom Panel */}
        <div className="lg:hidden h-[35%] overflow-y-auto border-t border-white/10">
          <Sidebar />
        </div>
      </div>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">

          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />

          <div className="relative z-10 w-[80%] max-w-[280px] bg-[#0a0c14] h-full">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
