// The app's data (JSON in its own store: encrypted, synced, with Undo), the note's summary line, and
// the device (opening a manual's web page or a phone number, once the person agrees).
export { useStore, useAppData, useCollection, useSettings, useImported, batch, setSummary, device } from "amber"
