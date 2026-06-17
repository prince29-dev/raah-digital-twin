'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import Sidebar from './components/Sidebar';
import ControlPanel from './components/ControlPanel';

const RaahMap = dynamic(() => import('./components/Map'), { ssr: false });

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen bg-[#0a0c14] text-white">

      {/* 🖥️ DESKTOP SIDEBAR */}
      <div className="hidden lg:block w-[300px] border-r border-white/10 z-20">
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* 📱 MOBILE SIDEBAR */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">

          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />

          {/* drawer */}
          <div className="relative w-[280px] bg-[#0a0c14] z-50">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* 📍 MAIN AREA */}
      <div className="flex-1 flex flex-col relative">

        {/* TOP BAR */}
        <div className="z-30">
          <ControlPanel onMenuClick={() => setSidebarOpen(true)} />
        </div>

        {/* MAP AREA */}
        <div className="flex-1 relative z-0">
          <RaahMap />
        </div>

      </div>
    </div>
  );
}