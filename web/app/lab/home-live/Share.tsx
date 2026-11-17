// Placeholder: the Together section's art (`?share=1..4`), being made by a design agent.
export type ShareV = "1" | "2" | "3" | "4";
export function ShareArt({ v }: { v: ShareV }) {
  return <div data-share-v={v} />;
}
