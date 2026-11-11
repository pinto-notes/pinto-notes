import type { SiteEvent } from "./posthog";

/// What the help pages send, so the help center grows from what people look for, not guesses.
/// Only the question's id and the page's path go out: never anything a visitor typed.

/// A question opened: by a click on it, or by a link to its #anchor (an email, the app, a post).
export function questionOpened(question: string, how: "click" | "link", path: string): SiteEvent {
  return { event: "help_question_opened", properties: { path, question, how }, leaves: false };
}

/// The answer to "Did this answer it?" under an open question.
export function answerRated(question: string, answer: "yes" | "no", path: string): SiteEvent {
  return { event: "help_answer_rated", properties: { path, question, answer }, leaves: false };
}

/// Put on the help page's support email links (read by clickEvent in lib/posthog.ts): a visitor
/// who writes in is one the page didn't help.
export const HELP_EMAIL_EVENT = "help_email_clicked";
