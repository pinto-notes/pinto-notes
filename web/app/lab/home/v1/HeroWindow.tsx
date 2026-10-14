import h from "../../home-h/h.module.css";

/// The other hero picture: the real Pinto Notes window on the paper desk, as shipped.
export function HeroWindow() {
  return (
    <div className={h.stage} style={{ width: "100%", borderRadius: 24, paddingBottom: 0 }}>
      <img className={h.stageArt} src="/home-d/desk.webp" alt="" width={1254} height={1254} fetchPriority="high" />
      <figure className={h.window}>
        <img src="/home-h/window-lisbon-1100.webp" width={1100} height={688} fetchPriority="high"
          alt="Pinto Notes on a Mac: folders on the left, the note list, and a note called Lisbon with a checklist and places." />
      </figure>
    </div>
  );
}
