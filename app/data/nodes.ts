// ─── Types ───────────────────────────────────────────────────────────────────

export type TrafficLevel = 'low' | 'medium' | 'high';
export type PeakHour     = 'morning' | 'evening' | 'night' | 'off';

export type NodeType = {
  id: number;
  name: string;
  position: [number, number];         // [lat, lng]
  traffic: TrafficLevel;
  type: 'intersection' | 'bus_stop' | 'landmark';
  description?: string;
  connections: number[];
  // ML / simulation fields
  congestionScore: number;            // 0-100 continuous score
  historicalTraffic: TrafficLevel[];  // last N states
  peakSensitivity: PeakHour[];        // which peak hours affect this node
};

export type RouteType = {
  id: string;
  from: number;
  to: number;
  name: string;
  busRoute?: string;
  distance: number;                   // km (for ETA)
};

export type SimSpeed = 'slow' | 'normal' | 'fast';

// ─── Initial graph ───────────────────────────────────────────────────────────

export const INITIAL_NODES: NodeType[] = [
  {
    id: 1, name: 'Surajpole',
    position: [24.579, 73.701], traffic: 'high',
    type: 'intersection',
    description: 'Major city-entry intersection, heavy morning traffic',
    connections: [2, 5],
    congestionScore: 80, historicalTraffic: ['high','high','medium'],
    peakSensitivity: ['morning'],
  },
  {
    id: 2, name: 'Udaipole',
    position: [24.571, 73.701], traffic: 'medium',
    type: 'intersection',
    description: 'Historic gate area near old city',
    connections: [1, 3, 6],
    congestionScore: 50, historicalTraffic: ['medium','medium','low'],
    peakSensitivity: ['morning','evening'],
  },
  {
    id: 3, name: 'Chetak Circle',
    position: [24.600, 73.724], traffic: 'low',
    type: 'landmark',
    description: 'Central roundabout, major transit hub',
    connections: [2, 4, 7, 10],
    congestionScore: 30, historicalTraffic: ['low','medium','low'],
    peakSensitivity: ['morning','evening'],
  },
  {
    id: 4, name: 'Fatehsagar Lake',
    position: [24.610, 73.683], traffic: 'medium',
    type: 'landmark',
    description: 'Tourist hotspot, weekend peak traffic',
    connections: [3, 8],
    congestionScore: 45, historicalTraffic: ['medium','low','low'],
    peakSensitivity: ['evening'],
  },
  {
    id: 5, name: 'Hiran Magri Sec 11',
    position: [24.591, 73.698], traffic: 'low',
    type: 'bus_stop',
    description: 'Residential bus stop, morning rush',
    connections: [1, 6],
    congestionScore: 20, historicalTraffic: ['low','low','medium'],
    peakSensitivity: ['morning'],
  },
  {
    id: 6, name: 'Bapu Bazaar',
    position: [24.577, 73.712], traffic: 'high',
    type: 'bus_stop',
    description: 'Commercial hub, all-day congestion',
    connections: [2, 5, 7],
    congestionScore: 85, historicalTraffic: ['high','high','high'],
    peakSensitivity: ['morning','evening'],
  },
  {
    id: 7, name: 'Delhi Gate',
    position: [24.585, 73.720], traffic: 'medium',
    type: 'intersection',
    description: 'Old city perimeter, bottleneck zone',
    connections: [3, 6, 9],
    congestionScore: 55, historicalTraffic: ['medium','high','medium'],
    peakSensitivity: ['morning','evening'],
  },
  {
    id: 8, name: 'Ambamata Bus Stop',
    position: [24.618, 73.690], traffic: 'low',
    type: 'bus_stop',
    description: 'Northern corridor stop',
    connections: [4, 9],
    congestionScore: 15, historicalTraffic: ['low','low','low'],
    peakSensitivity: ['morning'],
  },
  {
    id: 9, name: 'RNT Marg',
    position: [24.594, 73.710], traffic: 'medium',
    type: 'intersection',
    description: 'Key arterial road, hospital zone',
    connections: [7, 8, 10],
    congestionScore: 50, historicalTraffic: ['medium','medium','high'],
    peakSensitivity: ['morning','evening'],
  },
  {
    id: 10, name: 'Collectorate Circle',
    position: [24.602, 73.718], traffic: 'low',
    type: 'landmark',
    description: 'Administrative hub',
    connections: [9, 3],
    congestionScore: 25, historicalTraffic: ['low','low','medium'],
    peakSensitivity: ['morning'],
  },
];

export const ROUTES: RouteType[] = [
  { id: 'r1',  from: 1,  to: 2,  name: 'Surajpole–Udaipole',       busRoute: 'Bus 7',  distance: 0.9 },
  { id: 'r2',  from: 2,  to: 3,  name: 'Udaipole–Chetak',          busRoute: 'Bus 3',  distance: 1.4 },
  { id: 'r3',  from: 3,  to: 4,  name: 'Chetak–Fatehsagar',                            distance: 1.8 },
  { id: 'r4',  from: 1,  to: 5,  name: 'Surajpole–Hiran Magri',    busRoute: 'Bus 11', distance: 1.2 },
  { id: 'r5',  from: 5,  to: 6,  name: 'Hiran Magri–Bapu Bazaar',  busRoute: 'Bus 11', distance: 1.1 },
  { id: 'r6',  from: 2,  to: 6,  name: 'Udaipole–Bapu Bazaar',                         distance: 0.8 },
  { id: 'r7',  from: 6,  to: 7,  name: 'Bapu Bazaar–Delhi Gate',                        distance: 0.7 },
  { id: 'r8',  from: 3,  to: 7,  name: 'Chetak–Delhi Gate',        busRoute: 'Bus 5',  distance: 1.3 },
  { id: 'r9',  from: 4,  to: 8,  name: 'Fatehsagar–Ambamata',      busRoute: 'Bus 2',  distance: 1.5 },
  { id: 'r10', from: 7,  to: 9,  name: 'Delhi Gate–RNT Marg',      busRoute: 'Bus 5',  distance: 1.0 },
  { id: 'r11', from: 8,  to: 9,  name: 'Ambamata–RNT Marg',                            distance: 1.6 },
  { id: 'r12', from: 9,  to: 10, name: 'RNT Marg–Collectorate',                        distance: 0.9 },
  { id: 'r13', from: 10, to: 3,  name: 'Collectorate–Chetak',                          distance: 1.1 },
];

// Speed lookup (km/h) by traffic level
export const SPEED_BY_TRAFFIC: Record<TrafficLevel, number> = {
  low: 40,
  medium: 22,
  high: 10,
};
