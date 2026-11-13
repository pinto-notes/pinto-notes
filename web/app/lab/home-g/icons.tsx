// The app's toolbar glyphs, redrawn as line icons at the app's weight.

type P = { size?: number; className?: string };
const I = ({ size = 22, className, children }: P & { children: React.ReactNode }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

/** New note. */
export const Compose = (p: P) => <I {...p}><path d="M11.5 4H6.6A2.6 2.6 0 0 0 4 6.6v10.8A2.6 2.6 0 0 0 6.6 20h10.8a2.6 2.6 0 0 0 2.6-2.6v-4.9" /><path d="M17.7 3.7a1.7 1.7 0 0 1 2.4 2.4l-7.6 7.6-3.2.8.8-3.2z" /></I>;
/** New whiteboard: a shape behind a shape. */
export const Board = (p: P) => <I {...p}><path d="M15 8.6V6.6A2.6 2.6 0 0 0 12.4 4H6.6A2.6 2.6 0 0 0 4 6.6v5.8A2.6 2.6 0 0 0 6.6 15h2" /><rect x="8.6" y="8.6" width="11.4" height="11.4" rx="2.6" /></I>;
/** New app. */
export const Apps = (p: P) => <I {...p}><rect x="4" y="4" width="6.6" height="6.6" rx="1.7" /><rect x="13.4" y="4" width="6.6" height="6.6" rx="1.7" /><rect x="4" y="13.4" width="6.6" height="6.6" rx="1.7" /><rect x="13.4" y="13.4" width="6.6" height="6.6" rx="1.7" /></I>;

export const More = (p: P) => <I {...p}><circle cx="6" cy="12" r="0.9" fill="currentColor" /><circle cx="12" cy="12" r="0.9" fill="currentColor" /><circle cx="18" cy="12" r="0.9" fill="currentColor" /></I>;
export const Back = (p: P) => <I {...p}><path d="M14.5 5.5 8 12l6.5 6.5" /></I>;
export const Fwd = (p: P) => <I {...p}><path d="M9.5 5.5 16 12l-6.5 6.5" /></I>;
export const Share = (p: P) => <I {...p}><path d="M12 14.5V3.5M8.3 7 12 3.3 15.7 7" /><path d="M8.5 10H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1.5" /></I>;
export const Checklist = (p: P) => <I {...p}><circle cx="5.5" cy="7" r="2" /><path d="M4.6 15.8l1 1 1.9-2" /><path d="M11 7h9M11 16h9" /></I>;
export const Table = (p: P) => <I {...p}><rect x="3.5" y="5" width="17" height="14" rx="2" /><path d="M3.5 10h17M3.5 14.5h17M10 5v14" /></I>;
export const Clip = (p: P) => <I {...p}><path d="M19.5 11.5 12 19a4.6 4.6 0 0 1-6.5-6.5l7.8-7.8a3 3 0 0 1 4.3 4.3L10 16.6a1.5 1.5 0 0 1-2.1-2.1l7-7" /></I>;
export const Folder = (p: P) => <I {...p}><path d="M3.5 7.2c0-1 .8-1.7 1.7-1.7h4l2 2h7.6c1 0 1.7.8 1.7 1.7v7.6c0 1-.8 1.7-1.7 1.7H5.2c-1 0-1.7-.8-1.7-1.7z" /></I>;
export const Search = (p: P) => <I {...p}><circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 5 5" /></I>;
export const Sidebar = (p: P) => <I {...p}><rect x="3.5" y="5" width="17" height="14" rx="2.5" /><path d="M9.5 5v14M5.8 8.5h1.6M5.8 11h1.6" /></I>;
export const Tick = (p: P) => <I {...p}><path d="m6.5 12.5 3.6 3.6 7.4-8" /></I>;

// The whiteboard's tool bar.
export const Undo = (p: P) => <I {...p}><path d="M9 8 5 12l4 4" /><path d="M5 12h9.5a4.5 4.5 0 0 1 0 9H12" transform="translate(0 -4)" /></I>;
export const Redo = (p: P) => <I {...p}><path d="m15 8 4 4-4 4" /><path d="M19 12H9.5a4.5 4.5 0 0 0 0 9H12" transform="translate(0 -4)" /></I>;
export const Pointer = (p: P) => <I {...p}><path d="M6.5 4.5 18 11l-5.3 1.4L10 17.6z" fill="currentColor" /></I>;
export const Hand = (p: P) => <I {...p}><path d="M8.5 12V6.2a1.3 1.3 0 0 1 2.6 0V11m0-1.5V4.8a1.3 1.3 0 0 1 2.6 0V11m0-4.6a1.3 1.3 0 0 1 2.6 0V12m0-3.6a1.3 1.3 0 0 1 2.6 0v5.4a6.2 6.2 0 0 1-6.2 6.2h-.6a6 6 0 0 1-4.6-2.2L5 14.5a1.4 1.4 0 0 1 2.1-1.8L8.5 14" /></I>;
export const Pen = (p: P) => <I {...p}><path d="M5 19 18 6" strokeWidth={2} /></I>;
export const Square = (p: P) => <I {...p}><rect x="4.5" y="6" width="15" height="12" rx="1.2" /></I>;
export const Circle = (p: P) => <I {...p}><circle cx="12" cy="12" r="7.2" /></I>;
export const Diamond = (p: P) => <I {...p}><path d="m12 4.5 7.5 7.5-7.5 7.5L4.5 12z" /></I>;
export const Arrow = (p: P) => <I {...p}><path d="M6 18 18 6M10 6h8v8" /></I>;
export const Eraser = (p: P) => <I {...p}><path d="m14 5 5 5-8.5 8.5H6.5l-2-2a1.5 1.5 0 0 1 0-2.1z" /><path d="M9 10l5 5" /></I>;
