import { useState } from "react"
import { Plus } from "lucide-react"
import { Section, TintButton, Title } from "@/components/kit"
import { EventRow, openEvent, TotalCard } from "@/components/events"
import { IdeaSheet } from "@/components/idea-sheet"
import { useGifts } from "@/lib/gifts"

// The next occasions by date: each with its day, how many days are left, whether the gift is
// bought and the budget. A shared one (Christmas) is one row for everyone, and its total across
// everyone is the card at the top (beside the list on a wide note).
export default function Upcoming() {
  const { upcoming, people, fmt } = useGifts()
  const [adding, setAdding] = useState(false)
  const shared = upcoming.filter((e) => e.shared)
  const next = upcoming[0]
  return (
    <>
      <Title title="Upcoming" subtitle={next ? `${people.length} ${people.length === 1 ? "person" : "people"}` : undefined}
        action={people.length > 0 && <TintButton onClick={() => setAdding(true)}><Plus /> Idea</TintButton>} />
      <div className="min-[1000px]:grid min-[1000px]:grid-cols-[minmax(0,1fr)_340px] min-[1000px]:items-start min-[1000px]:gap-8">
        <div className="min-[1000px]:order-2">
          {shared.map((e) => <TotalCard key={e.key} e={e} fmt={fmt} onOpen={() => openEvent(e)} />)}
        </div>
        <Section title="Next up" footer={upcoming.length ? "Choose one to see the ideas, or everyone's for Christmas." : undefined}>
          {!upcoming.length && <p className="px-4 py-6 text-center text-muted-foreground">No dates yet. Add a birthday or Christmas to someone under People.</p>}
          {upcoming.map((e) => <EventRow key={e.key} e={e} fmt={fmt} />)}
        </Section>
      </div>
      <IdeaSheet editing={adding ? "new" : null} onClose={() => setAdding(false)} />
    </>
  )
}
