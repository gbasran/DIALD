# DIALD

**your adhd doesn't need another todo app.**

[Live App](https://diald.vercel.app)

---

## Inspiration

so here's the thing. i have ADHD and i'm a CS student. every productivity app out there is built by neurotypical people for neurotypical people. you open one up and it's like "here's 47 features and a planner, go organize your life!" and my brain just... shuts down.

i kept missing assignments not because i'm lazy but because i'd open my LMS and get hit with a wall of deadlines and my brain would go "this is too many decisions" and i'd end up doing none of them. classic decision paralysis. the apps that were supposed to help me were actually making it worse by adding more things to manage.

i wanted something that just tells me what to do next. no guilt, no "you're 3 days behind" notifications. just "hey, this is probably the move right now" and then gets out of the way.

## What it does

DIALD (Do I Actually Look Done?) is a study companion built specifically for how ADHD brains work.

**Mission Control** - the dashboard shows you everything at a glance without overwhelming you. weekly calendar, upcoming assignments, study streaks, focus time stats, and an activity feed. the "What Now" card uses AI to look at your workload and just tells you what to work on next so you don't have to decide.

**Assignments** - track what's due with color-coded urgency. status dots let you flip between not started, in progress, and done in one click. no complex workflows, no subtasks within subtasks. just the basics.

**Courses** - manage your courses with schedules, colors, and class times. everything else in the app ties back to these.

**Focus Timer** - pomodoro-style timer that links to your assignments. pick a task, pick a duration (15m quick burst, 25m pomodoro, 50m deep work, or custom), and go. when you finish you get confetti and a little celebration because positive reinforcement actually matters. it tracks your sessions and shows daily/weekly progress against goals.

**AI Chat** - talk to DIALD about your courses and assignments. it has context about your actual workload so it can give relevant advice instead of generic "make a study schedule" responses. supports markdown and LaTeX rendering for math help.

**Import Hub** - this one's fun. you can drag in your syllabus PDF and it'll extract assignments and course info using AI. paste an iCal link from your university and it pulls in your class schedule. paste raw text from Moodle or wherever and it cleans it up. way less manual data entry.

**AI Insights** - pattern analysis on your study habits. it looks at your assignments, completion rates, and focus sessions and gives you strategy suggestions.

## How I built it

the whole thing is **Next.js 15** (App Router) with **TypeScript** and **Tailwind CSS**. UI components are **shadcn/ui** on top of Radix primitives. the AI stuff is **Google Gemini** through their SDK.

the biggest architectural decision was using **localStorage for everything**. no database, no auth, no backend state. sounds wild but hear me out: the target user is a university student who just needs their stuff to work on their laptop. adding a database means adding auth means adding account management means adding password resets means adding... you get it. every layer of infrastructure is another thing standing between the user and actually using the app.

state management is all custom React hooks (`use-courses`, `use-assignments`, `use-focus-sessions`, etc.) that read from and write to localStorage. the hooks handle serialization, loading states, and expose clean APIs to components. it's basically a hooks-based state layer that just happens to persist to the browser.

the AI features hit serverless API routes that proxy to Gemini. rate limiting and input validation happen server-side so the API key stays safe. structured prompts extract specific data formats for things like PDF parsing and assignment extraction.

**pdfjs-dist** handles client-side PDF text extraction before sending to AI for cleanup. **react-markdown** with **remark-gfm**, **remark-math**, and **rehype-katex** for rich chat rendering including LaTeX math.

deployed on **Vercel** with zero config. the no-database architecture means there's literally nothing to provision.

## Challenges I ran into

**localStorage is... localStorage.** it's synchronous, it has size limits, and it doesn't sync across tabs. had to be really careful about race conditions where two tabs could stomp on each other's writes. ref-based patterns for stale closure issues in timer callbacks were a whole journey.

**streaming AI responses** in the chat had some interesting edge cases. the Gemini SDK streams text chunks and i needed to render them progressively with markdown parsing without the UI stuttering. AbortControllers for canceling in-flight requests when users navigate away.

**iCal parsing** sounds simple until you realize every university exports slightly different flavors of iCal. recurring events, timezone handling, weird VTIMEZONE blocks, events that span midnight. the edge cases are endless.

**PDF extraction in the browser** is hit or miss. some PDFs have selectable text, some are scanned images, some have text in weird encoding. pdfjs gets you the raw text but the AI cleanup step is what makes it actually usable.

**serverless rate limiting** without a database is a fun constraint. had to implement in-memory rate limiting that resets on cold starts but that's fine for the use case.

## What I learned

**sometimes NOT having a database is the right call.** it sounds like heresy but for a single-user app where data privacy matters and the infrastructure tax of auth + DB would triple the complexity, localStorage is genuinely the right tool.

**ADHD-friendly UX is just good UX, but louder.** non-punitive language matters. saying "nothing due, enjoy the calm" instead of "0 tasks completed" is a tiny thing that completely changes how it feels to use the app. celebration screens with confetti after focus sessions aren't frivolous, they're functional.

**ref-based patterns in React are underrated.** when you have intervals and callbacks that need current state without re-subscribing, refs are your friend. learned a lot about stale closure patterns the hard way.

**AI prompt engineering for structured extraction** is way harder than chatbot prompts. getting Gemini to reliably output JSON with specific fields from messy PDF text required a lot of iteration on system prompts, examples, and fallback handling.

## What's next

- **auth + database layer** for users who want data across devices. probably Supabase so the migration isn't painful
- **mobile PWA** with offline support. the layout is responsive-ish but a proper PWA would be solid
- **spaced repetition** integrating actual study techniques, not just timers
- **calendar sync** two-way sync with Google Calendar / iCal instead of one-time import
- **collaborative features** share course info with classmates so everyone doesn't have to import the same syllabus

## Tech Stack

|                   |                                                          |
| ----------------- | -------------------------------------------------------- |
| **Framework**     | Next.js 15 (App Router)                                  |
| **Language**      | TypeScript                                               |
| **Styling**       | Tailwind CSS v3                                          |
| **UI Components** | shadcn/ui + Radix UI                                     |
| **AI**            | Google Gemini (`@google/genai`)                          |
| **PDF Parsing**   | pdfjs-dist                                               |
| **Markdown**      | react-markdown + remark-gfm + remark-math + rehype-katex |
| **Icons**         | Lucide React                                             |
| **Deployment**    | Vercel                                                   |
| **State**         | localStorage + custom React hooks                        |

## How AI was used

i'm gonna be real about this because i think transparency matters more than pretending.

my role on this project was basically solutions architect. before any code got written, i was in Figma mocking up layouts, figuring out component hierarchy, and getting the visual language right. when i needed to iterate fast on a specific interaction or tweak a color palette, i'd jump into Paint and just sketch it out quick and dirty. the design work came first, always.

from there i'd define the system: what features to build, how they should work, how the data should flow, and why localStorage over a database. every product, architecture, and design decision was mine. i did a lot of the coding myself too, both frontend and backend. the API routes, rate limiting, Gemini integration, structured prompt engineering, iCal parser, the whole serverless layer is stuff i was hands-on with. same with the hooks, state management patterns, and wiring the client together. AI (Claude) was more like a senior dev i could bounce ideas off of and delegate chunks of work to when i knew exactly what i wanted but didn't want to spend an hour typing boilerplate.

when something broke or didn't feel right, i'd step back, look at it from above, figure out what the system *should* be doing, and then either fix it myself or debug it together with AI. i wasn't just accepting output blindly. i was reviewing, redirecting, screenshotting the result, comparing it against my mockups, and sometimes scrapping entire approaches when they didn't match the vision.

think of it like running a one-person agency where i'm the designer, architect, and lead dev, and AI is a really fast junior who's good at churning out code when given clear direction. i created the mockups, wrote a lot of the code, reviewed everything, and made the calls. AI helped me move faster, but this project has my fingerprints all over it.

---

built by [Gurmann](https://github.com/gbasran) as a tool i actually needed. if you have ADHD and university is kicking your butt, give it a spin.
