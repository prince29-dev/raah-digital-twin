'use client';

import dynamic from 'next/dynamic';

const Map = dynamic(() => import('./Map'), {
  ssr: false,
});

export default function Home() {
  return (
    <main>
      <h1 className="text-center text-2xl font-bold p-4">
        Raah Digital Twin 🌍
      </h1>
      <Map />
    </main>
  );
}