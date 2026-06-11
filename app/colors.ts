export function getColor(traffic: string) {
  if (traffic === "high") return "red";
  if (traffic === "medium") return "orange";
  return "green";
}