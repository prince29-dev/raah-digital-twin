type NodeType = {
  id: number;
  name: string;
  position: [number, number];
  traffic: string;
};

export const nodes: NodeType[] = [
  { id: 1, name: "Surajpole", position: [24.579, 73.701], traffic: "high" },
  { id: 2, name: "Udaipole", position: [24.571, 73.701], traffic: "medium" },
  { id: 3, name: "Chetak Circle", position: [24.600, 73.724], traffic: "low" },
  { id: 4, name: "Fatehsagar", position: [24.610, 73.683], traffic: "medium" },
];