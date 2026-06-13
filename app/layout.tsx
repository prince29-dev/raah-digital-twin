import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Raah Digital Twin — Udaipur Smart Mobility',
  description: 'A traffic-aware digital twin for Udaipur Tier-2 smart city research',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
      </head>
      <body style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  );
}
