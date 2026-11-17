import n from "./noteReal.module.css";

// Round 31 (Emil: "the UI looks comical … make it more real, remove elements that don't exist in the
// real app, size everything well"). Pinto on a Mac as the App Store captures show it
// (appstore-council/cap13/mac/note.png, cap15/mac/paper.png): with the folders hidden, the notes column
// carries the window's controls (traffic lights, sidebar, calendar, search, More, New Note), then "All
// Notes" and its count, then the notes by day: title, "time · first line", folder. The note column: Back
// and Forward, the folder, the tools capsule (Aa, checklist, table, attach, Share, More). The note: its
// title, a line, a heading, a quote, a heading, a checklist. The note's words are the same size as the
// list's, as in the app. Nothing here the app doesn't draw.

const I = {
  side: <svg viewBox="0 0 20 16"><rect x="1.5" y="1.5" width="17" height="13" rx="3" /><path d="M7.5 1.5v13" /></svg>,
  cal: <svg viewBox="0 0 18 18"><rect x="1.8" y="3" width="14.4" height="13.2" rx="2.6" /><path d="M1.8 7h14.4M5.6 1.4v3M12.4 1.4v3" /></svg>,
  search: <svg viewBox="0 0 18 18"><circle cx="7.6" cy="7.6" r="5.6" /><path d="M11.8 11.8 16 16" /></svg>,
  more: <svg viewBox="0 0 20 6" className={n.fill}><circle cx="3" cy="3" r="1.6" /><circle cx="10" cy="3" r="1.6" /><circle cx="17" cy="3" r="1.6" /></svg>,
  compose: <svg viewBox="0 0 20 20"><path d="M9 3.6H5.2a1.6 1.6 0 0 0-1.6 1.6v9.6a1.6 1.6 0 0 0 1.6 1.6h9.6a1.6 1.6 0 0 0 1.6-1.6V11" /><path d="m14.6 3.2 2.2 2.2-6.6 6.6-2.9.7.7-2.9z" /></svg>,
  back: <svg viewBox="0 0 10 16"><path d="M7.5 2 1.8 8l5.7 6" /></svg>,
  fwd: <svg viewBox="0 0 10 16"><path d="M2.5 2l5.7 6-5.7 6" /></svg>,
  check: <svg viewBox="0 0 22 18"><circle cx="4" cy="5" r="2.4" /><path d="M9 5h11M9 13h11" /><circle cx="4" cy="13" r="2.4" /></svg>,
  table: <svg viewBox="0 0 20 18"><rect x="2" y="2.5" width="16" height="13" rx="2" /><path d="M2 7.2h16M2 11.4h16M7.4 2.5v13" /></svg>,
  clip: <svg viewBox="0 0 20 20"><path d="m15.6 9.4-5.8 5.8a3.6 3.6 0 0 1-5.1-5.1l6.4-6.4a2.4 2.4 0 0 1 3.4 3.4L8.3 13.3a1.2 1.2 0 0 1-1.7-1.7l5.6-5.6" /></svg>,
  share: <svg viewBox="0 0 18 20"><path d="M9 12.4V1.8M5.6 5 9 1.6 12.4 5M6.2 7.6H4.4a1.6 1.6 0 0 0-1.6 1.6v7.4a1.6 1.6 0 0 0 1.6 1.6h9.2a1.6 1.6 0 0 0 1.6-1.6V9.2a1.6 1.6 0 0 0-1.6-1.6h-1.8" /></svg>,
  folder: <svg viewBox="0 0 20 16"><path d="M1.5 3.2c0-.9.7-1.7 1.7-1.7h4l1.8 2h7.8c.9 0 1.7.8 1.7 1.7v7.6c0 .9-.8 1.7-1.7 1.7H3.2c-1 0-1.7-.8-1.7-1.7z" /></svg>,
  tick: <svg viewBox="0 0 22 22"><path d="M6.5 11.3l3 3 6-6.3" /></svg>,
};

const TODAY = [
  { title: "Deep Work", when: "9:12 AM", first: "Notes from Cal Newport's book.", folder: "Reading", on: true },
  { title: "Groceries", when: "8:40 AM", first: "For the weekend, and Sunday dinner.", folder: "Home" },
];
const EARLIER = [
  { title: "Studio North", when: "Yesterday", first: "Decided: wait until March.", folder: "Work" },
  { title: "Kyoto in April", when: "Monday", first: "Six days, two cities.", folder: "Trips" },
];

function Row({ r }: { r: { title: string; when: string; first: string; folder: string; on?: boolean } }) {
  return (
    <li data-on={r.on || undefined}>
      <b>{r.title}</b>
      <span className={n.line}>{r.when}<span className={n.dot}>·</span><span className={n.first}>{r.first}</span></span>
      <span className={n.in}>{I.folder}{r.folder}</span>
    </li>
  );
}

const Checks = ({ phone }: { phone?: boolean }) => (
  <ul className={n.checks}>
    <li data-done><i>{I.tick}</i>Phone in another room</li>
    <li><i />{phone ? "A shutdown ritual" : "A shutdown ritual at 6"}</li>
    <li><i />Two deep hours before lunch</li>
  </ul>
);

export function NoteReal() {
  return (
    <div className={n.pair}>
      <div className={n.mac} aria-hidden="true">
        <div className={n.list}>
          <div className={n.bar}>
            <span className={n.lights}><i /><i /><i /></span>
            <span className={n.ico}>{I.side}</span><span className={n.ico}>{I.cal}</span><span className={n.ico}>{I.search}</span>
            <span className={n.round}>{I.more}</span><span className={n.round}>{I.compose}</span>
          </div>
          <p className={n.all}><b>All Notes</b><span>24 notes</span></p>
          <p className={n.day}>Today</p>
          <ul className={n.rows}>{TODAY.map((r) => <Row key={r.title} r={r} />)}</ul>
          <p className={n.day}>Earlier</p>
          <ul className={n.rows}>{EARLIER.map((r) => <Row key={r.title} r={r} />)}</ul>
        </div>
        <div className={n.noteCol}>
          <div className={n.bar}>
            <span className={n.ico}>{I.back}</span><span className={`${n.ico} ${n.dim}`}>{I.fwd}</span>
            <span className={n.crumb}>Reading</span>
            <span className={n.tools}><b>Aa</b><span className={n.ico}>{I.check}</span><span className={n.ico}>{I.table}</span><span className={n.ico}>{I.clip}</span><span className={n.ico}>{I.share}</span><span className={n.ico}>{I.more}</span></span>
          </div>
          <div className={n.note}>
            <p className={n.title}>Deep Work</p>
            <p>Notes from Cal Newport&apos;s book.</p>
            <p className={n.h}>Highlights</p>
            <p className={n.quote}>Deep work is rare, and worth more every year.</p>
            <p className={n.h}>To try</p>
            <Checks />
          </div>
        </div>
      </div>
      {/* The same note on an iPhone, over the window's lower right corner. */}
      <div className={n.phone} aria-hidden="true">
        <div className={n.screen}>
          <p className={n.status}><b>9:41</b></p>
          <p className={n.pBar}><span>{I.back}Reading</span><span className={n.pRound}>{I.more}</span></p>
          <div className={n.pNote}>
            <p className={n.title}>Deep Work</p>
            <p>Notes from Cal Newport&apos;s book.</p>
            <p className={n.h}>Highlights</p>
            <p className={n.quote}>Deep work is rare, and worth more every year.</p>
            <p className={n.h}>To try</p>
            <Checks phone />
          </div>
        </div>
      </div>
    </div>
  );
}
