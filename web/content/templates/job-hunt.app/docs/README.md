# Job hunt: notes for whoever works on this app next

## What it's for
Someone applying to more than a handful of jobs at once: where each application stands, what to do today (follow up, an interview, an apply-by date), how many answer at all, and their prep for each interview. Their AI does the typing: a pasted job ad becomes a card, "I heard back from Tideway, interview Thursday 14:00" moves the card and sets the date, and "prep me for Tideway" fills in the questions.

## Data
data.json, all under "values" (the person's AI reads and edits it directly):
- stages: [{ id, name }]. The board's columns, left to right. Rename one by changing name, never id. Three ids mean something: "saved" (not sent yet), "applied" (sent, no answer yet) and "closed" (over). Every other stage, the starting "interview" and "offer" and any the person adds ("phone-screen"), means they're talking: a card there has heard back.
- jobs: [{ id, company, role, link?, salary?, contact?, stage, outcome?, applied?, heard?, notes?, steps, questions, ask }], in board order: a column shows its stage's jobs in the order they are here.
  - id: any unique text ("tideway", "j12"). Keep it as it is.
  - stage: a stage's id. (A stage's name works too, "Interview", and is read as that stage; write the id.)
  - link: the job ad's address. salary and contact are free text, as the ad or the person says them ("52–58k", "Karin Berg, design manager"). Leave out what isn't known.
  - applied, heard: "yyyy-mm-dd". The day the application went out, and the day they first answered (a yes to talk, or a no).
  - outcome: only on a closed card: "rejected" (they said no), "withdrew" (the person pulled out) or "no-reply" (it went quiet).
  - steps: [{ id, kind, what?, date: "yyyy-mm-dd", time?: "hh:mm", done? }]. Dated things to do. kind is "interview", "follow-up" or "deadline" (apply by). what is a short name when the kind alone doesn't say it ("Second interview with Karin"). done: true once it's done; it stays on the application's page, crossed out.
  - questions: [{ q, a? }]. Interview prep: questions they may ask, and the person's answer or talking points.
  - ask: [text]. Questions to ask them.
  - notes: free text.
- settings: { followUpDays }. Moving a card to Applied (or adding one there) adds a follow-up step this many days later, unless one is open already. 0 turns it off. 7 to start.
- started: "yyyy-mm-dd". Set when the first application is added. With no started and no jobs the app opens on its first screen.

**When the person pastes a job ad**, add a job with stage "saved" and steps: [] (an apply-by date as a "deadline" step). **When they apply**, set stage "applied" and applied to today; add a "follow-up" step if they want one. **When they hear back**, set stage (an id from stages), heard to today, and add an interview as a step with its date and time. **A no**: stage "closed", outcome "rejected". The app counts and dates the rest itself.

## Decisions
- The board is the first screen, because the question on opening is "where does everything stand". Five columns of cards, like a kanban: Saved, Applied, Interview, Offer, Closed. Closed and not Rejected and Withdrawn as columns: they're one place (over), and why is the outcome on the card ("They said no").
- Cards move by drag and by a Move button on each card (a sheet listing every stage, Closed once per reason, then Up and Down within the stage). The button is the way on a phone without a long press, the way with VoiceOver, and the way tests can count on. A mouse drags once it moves 5 px; a finger rests on the card for 350 ms first, so a swipe still scrolls the board. While a card is dragged the stage under it gets an amber ring and a line shows where it will land. Near the board's edge on iPhone, it scrolls.
- On iPhone the board scrolls sideways a stage at a time (scroll snap), each column 84% of the width so the next one peeks in. Above it a strip of the stages with their counts jumps to each. From 900 px every stage is side by side, as many columns as there are stages, none narrower than 168 px.
- Moving a card does the bookkeeping a person forgets: leaving Saved sets applied, a stage past Applied (or a no) sets heard, and Applied adds the follow-up from settings. The person can change either date in Edit.
- Response rate: of the applications sent (applied set, or a stage past Saved, or closed after a no or no reply), the share that heard back (heard set, a talking stage, or a no). A withdrawn application that never got an answer counts as sent and unanswered. It's on the board beside Open and Due.
- Due is a list, not a calendar: what's due today or late first, oldest first, each with its date and how late, then the next two weeks. Closed applications and done steps are never due. A card on the board shows its next step, in the accent once it's due.
- Interview prep is per application, on its page: questions and answers as rows (tap to edit in a sheet), and questions to ask them as a list you type straight into.
- The person is in control without the AI: add, edit, move, reorder and delete applications; add, edit, tick and delete dates; add, edit and delete prep; add, rename, reorder and remove stages (a removed stage's cards move to the stage before it); change the follow-up. Every delete shows Undo in a bar at the top of the screen.
- First use (src/screens/first.tsx): a new app opens on "Which job are you after?", alone, with no tabs: company, role, link and "Have you applied?", then the board with that card on it. Five empty columns said nothing about how it works. When the person's AI adds a job while the first screen is open, the app leaves it; if the person had typed something, a bar that stays says so and offers "Add mine" (applications don't replace each other, so theirs is added beside the AI's).
- Writes go through the store's updater over the data as it is now, not as the screen last drew it (src/lib/jobs.ts, edit), so a tap never drops a card the person's AI added a moment before.
- The app sets the note's summary line to "4 open applications, 2 due".
- Three tabs: Board, Due, Settings. An application opens on its own screen (Back returns), two columns from 900 px: details, dates and notes; then prep.
- Colour: three ambers, one job each, the same three the Mac app has (src/index.css). The accent (`--amber-accent`) is for ticks, the drag ring and the drop line. `text-link` is its ink shade for amber text (a due date, the Due count). `bg-primary` is the primary button. No other colours: stages are told apart by their columns, not by colour.
- No text under 12 px (0.75rem), Apple's minimum. Tests check text that changes after an action (saving is async) inside waitFor, never on the first find.

## Known gaps
- No reminders: Pinto Notes apps can't send notifications yet. Due is where today's things are.
- No reading of the job ad in the app: the person's AI turns a pasted ad into a card.
- One interview per step; there's no list of interviewers or a calendar export.
- A stage can't be marked as a "sent" or "talking" stage by hand: only the ids saved, applied and closed are quiet.
