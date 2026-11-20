"use client";

import { useEffect } from "react";

/// What the tab says while you're on another one. Sentence case, one emoji at most.
export const AWAY_TITLES = [
  "Your notes miss you",
  "This checklist won't tick itself",
  "Your AI is still holding your place",
  "We saved your spot 📝",
  "Hello? 👀",
  "The note is still open",
  "Snack break? Fine. Come back after 🍿",
  "Left on read, by a notes app",
  "Still here. Still taking notes.",
];

/// Picks a line other than the last one, so two leaves in a row never say the same thing.
export function pickAwayTitle(last: string | null, random: () => number = Math.random): string {
  const pool = AWAY_TITLES.filter((t) => t !== last);
  return pool[Math.floor(random() * pool.length)] ?? AWAY_TITLES[0];
}

/// On the home page, leaving the tab swaps its title for a random line; coming back puts it back.
export function TabAway() {
  useEffect(() => {
    const real = document.title;
    let last: string | null = null;
    const onChange = () => {
      if (document.hidden) {
        last = pickAwayTitle(last);
        document.title = last;
      } else {
        document.title = real;
      }
    };
    document.addEventListener("visibilitychange", onChange);
    return () => {
      document.removeEventListener("visibilitychange", onChange);
      document.title = real;
    };
  }, []);
  return null;
}
