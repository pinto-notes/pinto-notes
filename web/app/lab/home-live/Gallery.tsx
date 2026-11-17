import g from "./gallery.module.css";

// Option C after Build (2026-11-17): a folder seen as a gallery, as the app draws it
// (pinto-recipes/gallery-v3/4-gallery.png): the folders column, then the folder's name and count, and a
// card per note: its cover photo, its icon and title, its first line. Covers, icons and Gallery view are
// built (Settings › Experimental), so nothing here is invented.

const CARDS = [
  { img: "pasta", icon: "🍋", title: "Lemon pasta", first: "20 min. Serves 4." },
  { img: "kanelbullar", icon: "🥐", title: "Mormor's kanelbullar", first: "For Sunday fika. Makes 24." },
  { img: "meatballs", icon: "🍲", title: "Mormor's meatballs", first: "From Greta, 1974." },
  { img: "shakshuka", icon: "🍳", title: "Shakshuka", first: "Eggs in spicy tomato, for two." },
  { img: "tacos", icon: "🌮", title: "Fish tacos", first: "Cod, pickled onion, lime." },
  { img: "sourdough", icon: "🍞", title: "Sourdough loaf", first: "Starter the night before." },
  { img: "cookies", icon: "🍪", title: "Brown butter cookies", first: "Flaky salt on top." },
  { img: "curry", icon: "🍛", title: "Green curry", first: "Thai basil, coconut milk." },
];

export function Gallery() {
  return (
    <div className={g.win} aria-hidden="true">
      <div className={g.side}>
        <span className={g.lights}><i /><i /><i /></span>
        <p className={g.head}><span>Folders</span><span className={g.plus}>+</span></p>
        <p className={g.folder}><svg viewBox="0 0 20 16"><path d="M1.5 3.2c0-.9.7-1.7 1.7-1.7h4l1.8 2h7.8c.9 0 1.7.8 1.7 1.7v7.6c0 .9-.8 1.7-1.7 1.7H3.2c-1 0-1.7-.8-1.7-1.7z" /></svg>Recipes<b>8</b></p>
      </div>
      <div className={g.main}>
        <p className={g.title}>Recipes</p>
        <p className={g.count}>8 notes</p>
        <ul className={g.grid}>
          {CARDS.slice(0, 6).map((c) => (
            <li key={c.title}>
              <img src={`/lab/live/recipes/${c.img}.webp`} alt="" loading="lazy" width={640} height={427} />
              <b><span className={g.icon}>{c.icon}</span>{c.title}</b>
              <span className={g.first}>{c.first}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
