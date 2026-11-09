import { Section } from "@/components/kit"
import { LEVELS, type Card } from "@/lib/cards"

// Where the cards are: how many at each level, New to Solid (a card's box, 1 to 5, by its plain
// name). Under the list of cards, where it reads as a count of them; on the first screen it was a
// chart about cards before any card had been shown.
export function Levels({ cards }: { cards: Card[] }) {
  const boxes = [1, 2, 3, 4, 5].map((b) => cards.filter((c) => (c.box || 1) === b).length)
  const most = Math.max(1, ...boxes)
  return (
    <Section title="How well you know them" footer="A card moves right each time you know it. Solid ones come back in weeks.">
      <div className="flex h-40 items-end gap-3 px-5 pb-3 pt-5" aria-label={`Cards by how well you know them: ${boxes.map((n, i) => `${LEVELS[i]} ${n}`).join(", ")}`} role="img">
        {boxes.map((n, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-[0.8125rem] font-semibold tabular-nums">{n}</span>
            <div className="w-full rounded-md bg-[var(--amber-accent)] transition-[height] duration-500 motion-reduce:transition-none" style={{ height: `${Math.max(4, (n / most) * 80)}px`, opacity: 0.45 + i * 0.14 }} />
            <span className="text-[0.75rem] text-muted-foreground">{LEVELS[i]}</span>
          </div>
        ))}
      </div>
    </Section>
  )
}
