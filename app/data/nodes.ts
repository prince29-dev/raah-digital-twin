export type TrafficLevel = 'low' | 'medium' | 'high';

export type NodeType = {
  id: number;
  name: string;
  position: [number, number]; // [lat, lng]
  traffic: TrafficLevel;
  type: 'intersection' | 'bus_stop' | 'landmark';
  description?: string;
  connections: number[]; // ids of adjacent nodes
};

export type RouteType = {
  id: string;
  from: number;
  to: number;
  name: string;
  busRoute?: string;
};

export const INITIAL_NODES: NodeType[] = [
  {
    id: 1,
    name: 'Surajpole',
    position: [24.579, 73.701],
    traffic: 'high',
    type: 'intersection',
    description: 'Major city-entry intersection, heavy morning traffic',
    connections: [2, 5],
  },
  {
    id: 2,
    name: 'Udaipole',
    position: [24.571, 73.701],
    traffic: 'medium',
    type: 'intersection',
    description: 'Historic gate area near old city',
    connections: [1, 3, 6],
  },
  {
    id: 3,
    name: 'Chetak Circle',
    position: [24.600, 73.724],
    traffic: 'low',
    type: 'landmark',
    description: 'Central roundabout, major transit hub',
    connections: [2, 4, 7],
  },
  {
    id: 4,
    name: 'Fatehsagar Lake',
    position: [24.610, 73.683],
    traffic: 'medium',
    type: 'landmark',
    description: 'Tourist hotspot, weekend peak traffic',
    connections: [3, 8],
  },
  {
    id: 5,
    name: 'Hiran Magri Sector 11',
    position: [24.591, 73.698],
    traffic: 'low',
    type: 'bus_stop',
    description: 'Residential bus stop, morning rush',
    connections: [1, 6],
  },
  {
    id: 6,
    name: 'Bapu Bazaar',
    position: [24.577, 73.712],
    traffic: 'high',
    type: 'bus_stop',
    description: 'Commercial hub, all-day congestion',
    connections: [2, 5, 7],
  },
  {
    id: 7,
    name: 'Delhi Gate',
    position: [24.585, 73.720],
    traffic: 'medium',
    type: 'intersection',
    description: 'Old city perimeter, bottleneck zone',
    connections: [3, 6, 9],
  },
  {
    id: 8,
    name: 'Ambamata Bus Stop',
    position: [24.618, 73.690],
    traffic: 'low',
    type: 'bus_stop',
    description: 'Northern corridor stop',
    connections: [4, 9],
  },
  {
    id: 9,
    name: 'RNT Marg',
    position: [24.594, 73.710],
    traffic: 'medium',
    type: 'intersection',
    description: 'Key arterial road, hospital zone',
    connections: [7, 8, 10],
  },
  {
    id: 10,
    name: 'Collectorate Circle',
    position: [24.602, 73.718],
    traffic: 'low',
    type: 'landmark',
    description: 'Administrative hub',
    connections: [9, 3],
  },
];

export const ROUTES: RouteType[] = [
  { id: 'r1', from: 1, to: 2, name: 'Surajpole–Udaipole', busRoute: 'Bus 7' },
  { id: 'r2', from: 2, to: 3, name: 'Udaipole–Chetak', busRoute: 'Bus 3' },
  { id: 'r3', from: 3, to: 4, name: 'Chetak–Fatehsagar' },
  { id: 'r4', from: 1, to: 5, name: 'Surajpole–Hiran Magri', busRoute: 'Bus 11' },
  { id: 'r5', from: 5, to: 6, name: 'Hiran Magri–Bapu Bazaar', busRoute: 'Bus 11' },
  { id: 'r6', from: 2, to: 6, name: 'Udaipole–Bapu Bazaar' },
  { id: 'r7', from: 6, to: 7, name: 'Bapu Bazaar–Delhi Gate' },
  { id: 'r8', from: 3, to: 7, name: 'Chetak–Delhi Gate' },
  { id: 'r9', from: 4, to: 8, name: 'Fatehsagar–Ambamata', busRoute: 'Bus 2' },
  { id: 'r10', from: 7, to: 9, name: 'Delhi Gate–RNT Marg', busRoute: 'Bus 5' },
  { id: 'r11', from: 8, to: 9, name: 'Ambamata–RNT Marg' },
  { id: 'r12', from: 9, to: 10, name: 'RNT Marg–Collectorate' },
  { id: 'r13', from: 10, to: 3, name: 'Collectorate–Chetak Circle' },
];
