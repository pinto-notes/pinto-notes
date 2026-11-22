import { useState } from "react"
import { inputClass, Pills, Row, Section, Title } from "@/components/kit"
import { money, useGifts } from "@/lib/gifts"
import { cn } from "@/lib/utils"

// The currency amounts show in, and the day Christmas is on (the 24th where it's celebrated on
// Christmas Eve, the 25th elsewhere).
export default function Settings() {
  const { settings, currency, setSettings } = useGifts()
  const [typed, setTyped] = useState<string | null>(null)
  const save = async () => {
    if (typed === null) return
    const v = typed.trim().slice(0, 4)
    setTyped(null)
    if (v !== settings.currency) await setSettings({ currency: v })
  }
  return (
    <div className="max-w-2xl">
      <Title title="Settings" />
      <Section title="Currency" footer={`Prices and budgets show as ${money(1200, typed?.trim() ?? currency)}.`}>
        <Row>
          <label htmlFor="currency" className="flex-1 font-medium">Shown with amounts</label>
          <input id="currency" className={cn(inputClass, "h-10 w-24 text-center")} placeholder="kr, $, €" value={typed ?? currency}
            onInput={(e) => setTyped(e.currentTarget.value)} onBlur={save} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur() }} />
        </Row>
      </Section>
      <Section title="Christmas" footer="Everyone's Christmas is on this day: on Upcoming, and for each person's budget.">
        <div className="p-3">
          <Pills label="Christmas is on" options={["24 December", "25 December"] as const} value={settings.christmas === "12-24" ? "24 December" : "25 December"}
            onChange={(v) => setSettings({ christmas: v === "24 December" ? "12-24" : "12-25" })} />
        </div>
      </Section>
    </div>
  )
}
