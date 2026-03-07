# Phlo — Complete Build Guide

> **ADHD-Friendly AI Student Assistant**
> Built by Phuturum | ULeth Hackathon 2026
> Target: Next.js 14+ | Tailwind CSS | shadcn/ui | Google Gemini | localStorage

---

## Table of Contents

1. [Vision & Problem Statement](#1-vision--problem-statement)
2. [Technology Decisions](#2-technology-decisions)
3. [ADHD Design System](#3-adhd-design-system)
4. [Architecture](#4-architecture)
5. [Data Model](#5-data-model)
6. [Implementation Phases](#6-implementation-phases)
   - [Phase 1: Project Setup](#phase-1-project-setup-1-hour)
   - [Phase 2: Course Manager](#phase-2-course-manager-2-hours)
   - [Phase 3: Dashboard](#phase-3-dashboard-25-hours)
   - [Phase 4: AI Chat](#phase-4-ai-chat-3-hours)
   - [Phase 5: Focus Mode](#phase-5-focus-mode-2-hours)
   - [Phase 6: Data Import](#phase-6-data-import-25-hours)
   - [Phase 7: What Now Card](#phase-7-what-now-card-15-hours)
   - [Phase 8: Polish & Deploy](#phase-8-polish--deploy-2-3-hours)
7. [Complete File Reference](#7-complete-file-reference)
8. [Demo Script](#8-demo-script)
9. [Deployment](#9-deployment)

---

## 1. Vision & Problem Statement

**Problem**: Student life is chaotic — courses, deadlines, assignments, campus resources — spread across Moodle, Outlook, and scattered notes. For students with ADHD, this fragmentation is especially paralyzing. There's no single tool that ties it all together with AI intelligence and ADHD-friendly design.

**Solution**: Phlo — an AI-powered student dashboard that combines smart scheduling, a context-aware AI chat, and a distraction-free focus mode. It knows your courses, deadlines, and campus (ULeth/Moodle), and tells you exactly what to do *right now*.

**Branding**: Phlo — by Phuturum (ph replaces f, macron on o for visual distinction)

**Key Differentiator**: The "What Now?" card — AI analyzes your deadlines, estimated work time, and current time to tell you the single most important thing to do right now. One action. No overwhelm.

---

## 2. Technology Decisions

### 2.1 Why Next.js 14+ (App Router)

Next.js provides the entire full-stack in one framework, which is critical for a solo hackathon build.

**Key architectural patterns we use:**

- **App Router** (`app/` directory): File-system based routing where folders = URL segments, `page.tsx` = UI, `layout.tsx` = shared wrapping UI, `route.ts` = API endpoints.
- **Server Components** (default): Components render on the server, reducing client JavaScript. Used for layouts and pages that don't need interactivity.
- **Client Components** (`'use client'`): Required for anything using `useState`, `useEffect`, event handlers, or browser APIs like `localStorage`. Push this directive as far down the component tree as possible.
- **Streaming API Routes**: Route handlers (`route.ts`) support `ReadableStream` for streaming Gemini responses to the client in real-time.
- **Environment Variables**: `.env.local` for secrets. Variables WITHOUT `NEXT_PUBLIC_` prefix are server-only (perfect for `GEMINI_API_KEY`). Variables WITH `NEXT_PUBLIC_` are inlined at build time.

**Important Next.js 15+ change**: `params` and `searchParams` in pages are now Promises that must be `await`-ed.

**Setup command**:
```bash
npx create-next-app@latest phlo --typescript --tailwind --eslint --app --src-dir
```

### 2.2 Why shadcn/ui

shadcn/ui is NOT a component library you install via npm. It's a collection of copy-paste components built on Radix UI (accessible primitives) + Tailwind CSS. The CLI copies component source code directly into your project at `components/ui/`.

**Why this matters for a hackathon:**
- Components are YOUR code — fully editable, no version conflicts
- Built on Radix UI: proper ARIA, keyboard nav, focus management out of the box
- Uses `class-variance-authority` (cva) for type-safe variant management
- Theming via CSS variables — change colors in one place, everything updates

**Setup**:
```bash
npx shadcn@latest init
npx shadcn@latest add button card input textarea badge tabs dialog progress scroll-area separator
```

**After init, you get:**
- `components.json` — CLI config
- `lib/utils.ts` — the `cn()` helper (merges Tailwind classes intelligently via `clsx` + `tailwind-merge`)
- `globals.css` — updated with HSL CSS variables for theming

**Components we'll use:**

| Component | Radix? | Purpose |
|-----------|--------|---------|
| Button | Slot only | Primary actions, navigation |
| Card | No | Course cards, deadline cards, task cards |
| Input | No | Form fields |
| Textarea | No | Chat input, syllabus paste |
| Badge | No | Status labels (todo, in-progress, done) |
| Tabs | Yes | Course import methods, dashboard views |
| Dialog | Yes | Add/edit forms, confirmations |
| Progress | Yes | Timer progress, task completion |
| ScrollArea | Yes | Chat message scroll |
| Separator | No | Visual dividers |

### 2.3 Why Google Gemini API (Free Tier)

The `@google/generative-ai` npm package provides direct access to Gemini models.

**Key facts:**
- **Model**: `gemini-2.0-flash` — best balance of speed, quality, and generous free limits
- **Free tier**: 15 RPM, 1,500 RPD, 1M TPM (no credit card needed)
- **API key**: Obtain at https://aistudio.google.com/apikey
- **Streaming**: `chat.sendMessageStream()` returns an `AsyncIterable` — iterate with `for await`
- **System instructions**: Set on the model instance via `systemInstruction` parameter, NOT in chat history
- **History format**: `{ role: "user" | "model", parts: [{ text: string }] }` — note: `"model"` not `"assistant"`

**Critical gotcha**: History must alternate between `"user"` and `"model"` roles. First message must be `"user"`. System instructions are NOT part of history.

### 2.4 Why localStorage

For a hackathon demo, localStorage provides instant persistence with zero setup:
- No database to provision, no migrations, no auth
- Data survives page refreshes
- Sufficient for single-user demo
- Easy to pre-populate with demo data

**SSR safety pattern**: Always access localStorage inside `useEffect` (runs only in browser) or event handlers. Never at module level. Components using localStorage must be Client Components.

### 2.5 Dependency Summary

```json
{
  "dependencies": {
    "@google/generative-ai": "latest",
    "@radix-ui/react-dialog": "auto-installed by shadcn",
    "@radix-ui/react-tabs": "auto-installed by shadcn",
    "@radix-ui/react-progress": "auto-installed by shadcn",
    "@radix-ui/react-scroll-area": "auto-installed by shadcn",
    "@radix-ui/react-separator": "auto-installed by shadcn",
    "@radix-ui/react-slot": "auto-installed by shadcn",
    "class-variance-authority": "auto-installed by shadcn",
    "clsx": "auto-installed by shadcn",
    "lucide-react": "icons",
    "next": "latest",
    "next-themes": "dark mode toggle",
    "react": "latest",
    "react-dom": "latest",
    "tailwind-merge": "auto-installed by shadcn"
  }
}
```

---

## 3. ADHD Design System

### 3.1 Design Philosophy

ADHD affects executive function — planning, organizing, prioritizing, managing time, regulating attention. Our design compensates for these challenges:

1. **Reduce cognitive load**: Show only what's needed now. Progressive disclosure. Smart defaults.
2. **Clear visual hierarchy**: Obvious reading order via size, weight, color, spacing.
3. **Minimize decision fatigue**: One primary CTA per screen. AI-suggested task ordering.
4. **One action at a time**: Sequential flows, not parallel choices.
5. **Progress visibility**: Checklists, progress bars, completion celebrations.
6. **Gentle time awareness**: Relative time ("due in 2 hours"), color-coded urgency, visual timers.

### 3.2 Color Palette

All colors use HSL CSS variables for seamless light/dark mode switching.

**Light Mode:**

| Token | HSL | Hex Approx | Usage |
|-------|-----|------------|-------|
| background | 40 20% 98% | #FAFAF7 | Page background (warm white) |
| foreground | 220 25% 16% | #1E2A3A | Primary text (dark blue-gray) |
| card | 40 15% 96% | #F5F3EE | Card surfaces (soft cream) |
| primary | 199 80% 42% | #1588B5 | Primary actions, active states |
| primary-foreground | 0 0% 100% | #FFFFFF | Text on primary |
| secondary | 160 35% 88% | #D0EBD8 | Secondary surfaces (soft sage) |
| accent | 160 45% 42% | #3B9B6B | Success, completion, green accent |
| accent-foreground | 0 0% 100% | #FFFFFF | Text on accent |
| muted | 40 10% 93% | #EDEBE6 | Muted backgrounds |
| muted-foreground | 220 10% 46% | #6B7280 | Secondary text |
| destructive | 0 55% 55% | #CC5C5C | Soft red (errors, not alarming) |
| border | 220 15% 88% | #DDE1E8 | Borders |
| warning | 38 85% 52% | #E8A44A | Approaching deadlines (warm amber) |
| focus-purple | 258 50% 62% | #9B8EC4 | Focus mode accent (lavender) |

**Dark Mode**: Same hues, increased lightness, slightly reduced saturation.

**ADHD-specific color choices:**
- No pure white (#FFFFFF) backgrounds — warm white (#FAFAF7) reduces visual fatigue
- No pure black (#000000) text — dark blue-gray reduces harsh contrast
- Soft red for destructive (not alarming) — ADHD brains are already anxious enough
- Warm amber for warnings — gentler than red, still attention-getting
- Lavender for focus mode — psychologically calming, distinct from task-oriented blues

### 3.3 Typography

```
Font: Nunito Sans (Google Fonts) — rounded terminals, friendly, highly legible
  Fallback: system-ui, -apple-system, sans-serif

Display font (headings): Nunito (Google Fonts) — rounder, more characterful
  Fallback: system-ui, -apple-system, sans-serif

Scale (1.25 ratio):
  Display/Hero:    2rem (32px)    font-bold
  H1/Page Title:   1.625rem (26px) font-bold
  H2/Section:      1.3rem (21px)   font-semibold
  H3/Subsection:   1.063rem (17px) font-semibold
  Body:            1rem (16px)     font-normal
  Small/Caption:   0.875rem (14px) font-normal
  Micro/Label:     0.75rem (12px)  font-medium

Line height:
  Headings: 1.3-1.4
  Body: 1.6-1.75 (generous — ADHD readers benefit from extra leading)
  UI labels: 1.4

Letter spacing:
  Body: 0.01em-0.02em (subtle openness)
  ALL CAPS: 0.05em-0.1em (mandatory)

Max line width: 65 characters (~32em)
```

**Why Nunito/Nunito Sans**: Rounded terminals feel approachable without being childish. Tall x-height improves legibility. Distinct letterforms (l/I/1) prevent confusion. Available as a variable font via `next/font`.

### 3.4 Layout Principles

- **Card-based layout**: Natural visual grouping, limited information per card, supports progressive disclosure
- **Generous whitespace**: Minimum 16px between elements, 24-32px between sections, 40-64px between major sections
- **Single column on mobile**: No multi-column layouts that fragment attention
- **Max 3 cards per row** on desktop
- **Bottom navigation on mobile**: Thumb-reachable, always visible, max 4-5 items with icons + labels
- **Card specs**: 12-16px border radius, 20-24px padding, subtle shadow `0 1px 3px rgba(0,0,0,0.06)`

### 3.5 Micro-interactions & Emotional Tone

**Completion animations:**
- Checkbox: checkmark draws itself (200-300ms, ease-out)
- Progress bar: smooth fill animation (300-500ms, spring easing)
- Task done: subtle confetti or color flash for milestones

**Emotional tone:**
- **Never shame** for missed tasks: "Welcome back! Ready to pick up where you left off?"
- **Celebrate what was done**: "You completed 3 tasks today!" (not "You have 7 overdue tasks")
- **Encouraging language**: "Great progress!", "You're on a roll!", "Almost there!"
- **Reframe overdue items** as "Ready to tackle" rather than "Overdue"
- **Empty states**: "Nothing here yet — that's okay! Add your first task whenever you're ready."

### 3.6 Focus Mode Design

When focus mode is active:
- Strip away ALL navigation
- Show only: current task name (H1), time estimate, circular progress timer, "Done" button
- Calming background (gradient or solid lavender tint)
- No other clickable elements except "Exit Focus"
- Timer: circular progress ring (not digital countdown — less anxiety-inducing)
- Break screen: shift to green tones, suggest "Stretch", "Get water", "Look away from screen"

---

## 4. Architecture

### 4.1 Directory Structure

```
src/
  app/
    page.tsx                 # Dashboard (home)
    chat/page.tsx            # AI Chat
    focus/page.tsx           # Focus Mode
    courses/page.tsx         # Course Manager
    api/
      chat/route.ts          # Gemini streaming chat endpoint
      extract/route.ts       # Syllabus/email AI extraction
      moodle/route.ts        # Moodle iCal import
    layout.tsx               # App shell, nav, global styles
    globals.css              # Tailwind base + CSS variable theme
    providers.tsx            # Theme provider wrapper
  components/
    dashboard/
      ScheduleView.tsx       # Weekly schedule grid
      UpcomingDeadlines.tsx   # Deadline cards sorted by urgency
      WhatNowCard.tsx        # AI-powered "do this now" card
    chat/
      ChatInterface.tsx      # Chat window with streaming
      MessageBubble.tsx      # Individual messages
    focus/
      FocusTimer.tsx         # Pomodoro-style circular timer
      TaskCard.tsx           # Current task display
    courses/
      CourseForm.tsx         # Manual course entry
      CourseList.tsx         # View/manage courses
      SyllabusPaste.tsx      # AI extraction from pasted text
      MoodleImport.tsx       # iCal URL import
    layout/
      Navigation.tsx         # Bottom nav bar
    ui/                      # shadcn/ui components (auto-generated)
  lib/
    gemini.ts                # Gemini API client
    storage.ts               # localStorage CRUD helpers
    types.ts                 # TypeScript interfaces
    context.ts               # Build AI system prompt from student data
    ical-parser.ts           # Parse iCal (.ics) data
    utils.ts                 # Shared utilities (cn, date helpers)
  hooks/
    use-local-storage.ts     # Generic localStorage hook
    use-courses.ts           # Course CRUD hook
    use-assignments.ts       # Assignment CRUD hook
    use-tasks.ts             # Task CRUD hook
  data/
    demo-data.ts             # Pre-loaded demo data for presentation
```

### 4.2 Data Flow

```
User enters data (CourseForm / SyllabusPaste / MoodleImport)
  → localStorage (via storage hooks)
  → Components read from hooks (useCourses, useAssignments, etc.)
  → Dashboard displays schedule + deadlines
  → AI chat reads all data via context.ts → buildSystemPrompt()
  → Gemini API receives full student context as system instruction
  → Streaming response displayed in ChatInterface
```

### 4.3 Client/Server Component Boundary

```
SERVER COMPONENTS (no 'use client'):
  - app/layout.tsx (imports client Providers)
  - app/page.tsx (imports client dashboard components)
  - app/chat/page.tsx (imports client ChatInterface)
  - app/focus/page.tsx (imports client FocusTimer)
  - app/courses/page.tsx (imports client CourseForm/List)

CLIENT COMPONENTS ('use client'):
  - All components/ files (use state, effects, events, localStorage)
  - app/providers.tsx (ThemeProvider uses context)
  - hooks/ files (React hooks)

API ROUTES (server-side, no directive needed):
  - app/api/chat/route.ts (Gemini API key stays server-side)
  - app/api/extract/route.ts
  - app/api/moodle/route.ts
```

---

## 5. Data Model

```typescript
// src/lib/types.ts

export interface Course {
  id: string;
  name: string;          // "Operating Systems"
  code: string;          // "CPSC 3620"
  schedule: ClassTime[];
  location: string;
  color: string;         // HSL string for visual distinction
}

export interface ClassTime {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  startTime: string;     // "09:00"
  endTime: string;       // "10:15"
}

export interface Assignment {
  id: string;
  courseId: string;
  name: string;
  dueDate: string;       // ISO date "2026-03-15T23:59:00Z"
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  estimatedMinutes: number;
}

export interface Task {
  id: string;
  assignmentId: string;
  name: string;           // Micro-task name
  estimatedMinutes: number; // Max 45 min
  status: 'todo' | 'in-progress' | 'done';
  order: number;
}

export interface StudySession {
  id: string;
  taskId: string;
  startTime: string;
  durationMinutes: number;
  completed: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const STORAGE_KEYS = {
  COURSES: 'phlo-courses',
  ASSIGNMENTS: 'phlo-assignments',
  TASKS: 'phlo-tasks',
  SESSIONS: 'phlo-sessions',
  CHAT_HISTORY: 'phlo-chat-history',
  SETTINGS: 'phlo-settings',
} as const;
```

---

## 6. Implementation Phases

### Phase 1: Project Setup (1 hour)

**Commands:**
```bash
cd /home/gbas/Hackathon-2026-Uleth

# Create Next.js project IN the repo root (using . to avoid nested directory)
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Init shadcn/ui
npx shadcn@latest init
# Choose: Default style, Slate base color, CSS variables: Yes

# Add shadcn components
npx shadcn@latest add button card input textarea badge tabs dialog progress scroll-area separator

# Install additional dependencies
npm install @google/generative-ai next-themes lucide-react

# Create project structure
mkdir -p src/components/{dashboard,chat,focus,courses,layout}
mkdir -p src/lib src/hooks src/data
```

**Create `.env.local`:**
```
GEMINI_API_KEY=your_api_key_here
```

**Files to create in this phase:**

1. `src/lib/types.ts` — Data model (see Section 5 above)
2. `src/lib/utils.ts` — Already created by shadcn, but extend with date helpers
3. `src/lib/storage.ts` — localStorage CRUD
4. `src/hooks/use-local-storage.ts` — Generic localStorage hook
5. `src/app/globals.css` — Override with ADHD-friendly theme
6. `src/app/providers.tsx` — Theme provider
7. `src/app/layout.tsx` — Update with fonts and providers

**Commit**: "Set up Next.js project with shadcn/ui and Tailwind"

---

### Phase 2: Course Manager (2 hours)

**Files to create:**

1. `src/hooks/use-courses.ts` — Course CRUD hook with localStorage
2. `src/hooks/use-assignments.ts` — Assignment CRUD hook
3. `src/components/courses/CourseForm.tsx` — Manual entry form
4. `src/components/courses/CourseList.tsx` — Display courses with edit/delete
5. `src/app/courses/page.tsx` — Courses page
6. `src/data/demo-data.ts` — ULeth demo courses

**Commit**: "Add course manager with manual entry and assignments"

---

### Phase 3: Dashboard (2.5 hours)

**Files to create:**

1. `src/components/layout/Navigation.tsx` — Bottom nav bar
2. `src/components/dashboard/ScheduleView.tsx` — Weekly schedule grid
3. `src/components/dashboard/UpcomingDeadlines.tsx` — Sorted deadline cards
4. `src/app/layout.tsx` — Update with navigation
5. `src/app/page.tsx` — Dashboard page

**Commit**: "Add dashboard with schedule view and deadline tracker"

---

### Phase 4: AI Chat (3 hours)

**Files to create:**

1. `src/lib/gemini.ts` — Gemini API client
2. `src/lib/context.ts` — AI system prompt builder
3. `src/app/api/chat/route.ts` — Streaming chat API endpoint
4. `src/components/chat/MessageBubble.tsx` — Message display
5. `src/components/chat/ChatInterface.tsx` — Full chat UI with streaming
6. `src/app/chat/page.tsx` — Chat page

**Commit**: "Add AI chat with Gemini streaming and student context"

---

### Phase 5: Focus Mode (2 hours)

**Files to create:**

1. `src/hooks/use-tasks.ts` — Task CRUD hook
2. `src/components/focus/FocusTimer.tsx` — Circular pomodoro timer
3. `src/components/focus/TaskCard.tsx` — Current task display
4. `src/app/focus/page.tsx` — Focus mode page

**Commit**: "Add focus mode with pomodoro timer and task selection"

---

### Phase 6: Data Import (2.5 hours)

**Files to create:**

1. `src/lib/ical-parser.ts` — Custom iCal parser (zero deps)
2. `src/app/api/moodle/route.ts` — Fetch + parse iCal URL
3. `src/components/courses/MoodleImport.tsx` — iCal URL import UI
4. `src/app/api/extract/route.ts` — AI syllabus extraction
5. `src/components/courses/SyllabusPaste.tsx` — Paste + extract UI

**Commit**: "Add Moodle iCal import and AI text extraction"

---

### Phase 7: What Now Card (1.5 hours)

**Files to create:**

1. `src/components/dashboard/WhatNowCard.tsx` — AI-powered priority card
2. Update `src/app/page.tsx` to include WhatNowCard

**Commit**: "Add AI-powered What Now card to dashboard"

---

### Phase 8: Polish & Deploy (2-3 hours)

- Responsive design check
- Loading states and error handling
- Animations and transitions
- Demo data pre-population
- Dark mode toggle
- Deploy to Vercel
- Test live URL

**Commit**: "Polish UI, add demo data, deploy to Vercel"

---

## 7. Complete File Reference

Every file needed for the project, with complete contents.

---

### 7.1 `src/lib/types.ts`

```typescript
export interface Course {
  id: string;
  name: string;
  code: string;
  schedule: ClassTime[];
  location: string;
  color: string;
}

export interface ClassTime {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  startTime: string;
  endTime: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  name: string;
  dueDate: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  estimatedMinutes: number;
}

export interface Task {
  id: string;
  assignmentId: string;
  name: string;
  estimatedMinutes: number;
  status: 'todo' | 'in-progress' | 'done';
  order: number;
}

export interface StudySession {
  id: string;
  taskId: string;
  startTime: string;
  durationMinutes: number;
  completed: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const STORAGE_KEYS = {
  COURSES: 'phlo-courses',
  ASSIGNMENTS: 'phlo-assignments',
  TASKS: 'phlo-tasks',
  SESSIONS: 'phlo-sessions',
  CHAT_HISTORY: 'phlo-chat-history',
} as const;
```

---

### 7.2 `src/lib/storage.ts`

```typescript
export interface Identifiable {
  id: string;
}

export function createStorageService<T extends Identifiable>(storageKey: string) {
  function getAll(): T[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  function getById(id: string): T | undefined {
    return getAll().find((item) => item.id === id);
  }

  function save(items: T[]): void {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }

  function create(item: T): T {
    const items = getAll();
    items.push(item);
    save(items);
    return item;
  }

  function update(id: string, updates: Partial<T>): T | undefined {
    const items = getAll();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return undefined;
    items[index] = { ...items[index], ...updates };
    save(items);
    return items[index];
  }

  function remove(id: string): boolean {
    const items = getAll();
    const filtered = items.filter((item) => item.id !== id);
    if (filtered.length === items.length) return false;
    save(filtered);
    return true;
  }

  function clear(): void {
    localStorage.removeItem(storageKey);
  }

  function setAll(items: T[]): void {
    save(items);
  }

  return { getAll, getById, create, update, remove, clear, setAll };
}
```

---

### 7.3 `src/hooks/use-local-storage.ts`

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value;
        try {
          localStorage.setItem(key, JSON.stringify(nextValue));
        } catch (error) {
          console.warn(`Error writing localStorage key "${key}":`, error);
        }
        return nextValue;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}
```

---

### 7.4 `src/hooks/use-courses.ts`

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '@/lib/types';
import type { Course } from '@/lib/types';

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COURSES);
      if (stored) setCourses(JSON.parse(stored));
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
    }
  }, [courses, isLoaded]);

  const addCourse = useCallback((course: Omit<Course, 'id'>) => {
    const newCourse: Course = { ...course, id: crypto.randomUUID() };
    setCourses((prev) => [...prev, newCourse]);
    return newCourse;
  }, []);

  const updateCourse = useCallback((id: string, updates: Partial<Course>) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  }, []);

  const deleteCourse = useCallback((id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const getCourseById = useCallback(
    (id: string) => courses.find((c) => c.id === id),
    [courses]
  );

  return { courses, isLoaded, addCourse, updateCourse, deleteCourse, getCourseById, setCourses };
}
```

---

### 7.5 `src/hooks/use-assignments.ts`

```typescript
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { STORAGE_KEYS } from '@/lib/types';
import type { Assignment } from '@/lib/types';

export function useAssignments(courseId?: string) {
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
      if (stored) setAllAssignments(JSON.parse(stored));
    } catch {
      // use empty default
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(allAssignments));
    }
  }, [allAssignments, isLoaded]);

  const assignments = useMemo(
    () => courseId ? allAssignments.filter((a) => a.courseId === courseId) : allAssignments,
    [allAssignments, courseId]
  );

  const addAssignment = useCallback((assignment: Omit<Assignment, 'id'>) => {
    const newAssignment: Assignment = { ...assignment, id: crypto.randomUUID() };
    setAllAssignments((prev) => [...prev, newAssignment]);
    return newAssignment;
  }, []);

  const updateAssignment = useCallback((id: string, updates: Partial<Assignment>) => {
    setAllAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
  }, []);

  const deleteAssignment = useCallback((id: string) => {
    setAllAssignments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const deleteAssignmentsForCourse = useCallback((cId: string) => {
    setAllAssignments((prev) => prev.filter((a) => a.courseId !== cId));
  }, []);

  return {
    assignments,
    allAssignments,
    isLoaded,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    deleteAssignmentsForCourse,
    setAllAssignments,
  };
}
```

---

### 7.6 `src/hooks/use-tasks.ts`

```typescript
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { STORAGE_KEYS } from '@/lib/types';
import type { Task } from '@/lib/types';

export function useTasks(assignmentId?: string) {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (stored) setAllTasks(JSON.parse(stored));
    } catch {
      // use empty default
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(allTasks));
    }
  }, [allTasks, isLoaded]);

  const tasks = useMemo(
    () => assignmentId ? allTasks.filter((t) => t.assignmentId === assignmentId) : allTasks,
    [allTasks, assignmentId]
  );

  const addTask = useCallback((task: Omit<Task, 'id'>) => {
    const newTask: Task = { ...task, id: crypto.randomUUID() };
    setAllTasks((prev) => [...prev, newTask]);
    return newTask;
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setAllTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setAllTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { tasks, allTasks, isLoaded, addTask, updateTask, deleteTask, setAllTasks };
}
```

---

### 7.7 `src/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Phlo ADHD-friendly calming palette — Light Mode */
    --background: 40 20% 98%;
    --foreground: 220 25% 16%;

    --card: 40 15% 96%;
    --card-foreground: 220 25% 16%;

    --popover: 0 0% 100%;
    --popover-foreground: 220 25% 16%;

    --primary: 199 80% 42%;
    --primary-foreground: 0 0% 100%;

    --secondary: 160 35% 88%;
    --secondary-foreground: 220 25% 20%;

    --muted: 40 10% 93%;
    --muted-foreground: 220 10% 46%;

    --accent: 160 45% 42%;
    --accent-foreground: 0 0% 100%;

    --destructive: 0 55% 55%;
    --destructive-foreground: 0 0% 100%;

    --border: 220 15% 88%;
    --input: 220 15% 88%;
    --ring: 199 80% 42%;

    --radius: 0.75rem;

    /* Phlo brand extras */
    --warning: 38 85% 52%;
    --focus-purple: 258 50% 62%;
  }

  .dark {
    --background: 220 25% 8%;
    --foreground: 40 15% 92%;

    --card: 220 25% 12%;
    --card-foreground: 40 15% 92%;

    --popover: 220 25% 12%;
    --popover-foreground: 40 15% 92%;

    --primary: 199 75% 55%;
    --primary-foreground: 220 25% 8%;

    --secondary: 160 25% 18%;
    --secondary-foreground: 40 15% 92%;

    --muted: 220 20% 16%;
    --muted-foreground: 40 8% 60%;

    --accent: 160 40% 48%;
    --accent-foreground: 0 0% 100%;

    --destructive: 0 45% 45%;
    --destructive-foreground: 0 0% 100%;

    --border: 220 20% 20%;
    --input: 220 20% 20%;
    --ring: 199 75% 55%;

    --warning: 38 80% 60%;
    --focus-purple: 258 55% 72%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

---

### 7.8 `src/app/providers.tsx`

```tsx
'use client';

import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
```

---

### 7.9 `src/app/layout.tsx`

```tsx
import type { Metadata } from 'next';
import { Nunito, Nunito_Sans } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
});

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-nunito-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Phlo — ADHD-Friendly Student Assistant',
  description: 'AI-powered student dashboard with smart scheduling, context-aware chat, and distraction-free focus mode.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${nunito.variable} ${nunitoSans.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          <main className="min-h-screen pb-20">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
```

---

### 7.10 `src/lib/gemini.ts`

```typescript
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export function getGeminiModel(systemInstruction: string) {
  return genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    ],
  });
}

export async function streamChat(
  systemPrompt: string,
  history: { role: string; content: string }[],
  message: string
) {
  const model = getGeminiModel(systemPrompt);

  const geminiHistory = history.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({ history: geminiHistory });
  const result = await chat.sendMessageStream(message);
  return result.stream;
}
```

---

### 7.11 `src/lib/context.ts`

```typescript
import { createStorageService } from './storage';
import { STORAGE_KEYS } from './types';
import type { Course, Assignment, Task } from './types';

export function buildSystemPrompt(
  courses: Course[],
  assignments: Assignment[],
  tasks: Task[]
): string {
  const now = new Date();

  const courseList = courses
    .map((c) => `- ${c.code}: ${c.name} (${c.schedule.map((s) => `${s.day} ${s.startTime}-${s.endTime}`).join(', ')}) @ ${c.location}`)
    .join('\n');

  const upcomingAssignments = assignments
    .filter((a) => a.status !== 'done')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .map((a) => {
      const course = courses.find((c) => c.id === a.courseId);
      const dueDate = new Date(a.dueDate);
      const hoursUntilDue = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));
      const urgency = hoursUntilDue < 24 ? 'URGENT' : hoursUntilDue < 72 ? 'SOON' : '';
      return `- ${urgency ? `[${urgency}] ` : ''}${a.name} (${course?.code || 'Unknown'}) — due ${a.dueDate}, est. ${a.estimatedMinutes}min, status: ${a.status}`;
    })
    .join('\n');

  return `You are Phlo, an ADHD-friendly student assistant at the University of Lethbridge.
Your student uses Moodle as their LMS and Outlook with their @uleth.ca email.

CURRENT DATE/TIME: ${now.toLocaleString()}

COURSES:
${courseList || 'No courses added yet.'}

UPCOMING ASSIGNMENTS (sorted by due date):
${upcomingAssignments || 'No upcoming assignments.'}

ULETH CAMPUS RESOURCES:

Academic Support:
- Academic Advising: ulethbridge.ca/ross/academic-advising
- Accessible Learning Centre (ALC): alc@uleth.ca, ulethbridge.ca/accessible-learning-centre/
- Study Skills: ulethbridge.ca/student-success-centre/study-skills
- Tutoring Services: ulethbridge.ca/tutoring-services
- Writing Centre: ulethbridge.ca/artsci/academic-writing/writing-centre
- Library: library.ulethbridge.ca
- Testing Centre: ulethbridge.ca/teachingcentre/testing-centre
- Career Bridge: ulethbridge.ca/career-bridge

Health & Wellness:
- Counselling: 403-317-2845, Mon-Thu 8:45-11:30 & 1:30-4:00, Fri 10-11:30 & 1:30-4:00. Walk-in Wed.
- Health Centre: ulethbridge.ca/health-centre
- Rec Room (hangout): ulethbridge.ca/counselling/rec-room
- 7 Cups (online support, pw: uleth): 7cups.com/p/uleth

Campus Life:
- Student Clubs: clubs.ulsu.ca/clubs-list
- Food Court: ulsu.ca/store--food-court
- UPass (bus): ulsu.ca/upass-faq
- IT Help: ulethbridge.ca/information-technology#contact

Safety:
- Safewalk: ulethbridge.ca/security/content/safe-walk
- Security: 403-329-2345
- Crisis: 988 (Suicide Helpline), 911

GUIDELINES:
- Be concise and actionable — ADHD brains need clarity, not walls of text
- Always suggest ONE specific next action
- Break large tasks into steps no longer than 45 minutes
- Be encouraging but not patronizing
- Reference their actual courses and deadlines
- For campus questions, reference the ULeth resources above with real contact info
- Use markdown formatting for readability`;
}
```

---

### 7.12 `src/app/api/chat/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { streamChat } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { messages, message, systemPrompt } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!systemPrompt || typeof systemPrompt !== 'string') {
      return NextResponse.json({ error: 'System prompt is required' }, { status: 400 });
    }

    const stream = await streamChat(systemPrompt, messages || [], message);

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
          controller.close();
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Stream error';
          controller.enqueue(new TextEncoder().encode(`\n[Error: ${errorMessage}]`));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: unknown) {
    console.error('Chat API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    let status = 500;
    if (message.includes('429')) status = 429;
    else if (message.includes('401')) status = 401;
    return NextResponse.json({ error: message }, { status });
  }
}
```

---

### 7.13 `src/app/api/extract/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { text, type } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const extractionPrompt = type === 'crowdmark'
      ? `Extract assignment information from this Crowdmark email notification. Return a JSON object with: { "assignments": [{ "name": string, "dueDate": string (ISO format), "courseName": string, "courseCode": string }] }. Only return valid JSON, no other text.`
      : `Extract course and assignment information from this syllabus text. Return a JSON object with: { "courseName": string, "courseCode": string, "assignments": [{ "name": string, "dueDate": string (ISO format or "TBD"), "description": string, "estimatedMinutes": number }] }. Only return valid JSON, no other text.`;

    const model = getGeminiModel(extractionPrompt);
    const result = await model.generateContent(text);
    const response = result.response.text();

    // Try to parse the JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not extract structured data' }, { status: 422 });
    }

    const extracted = JSON.parse(jsonMatch[0]);
    return NextResponse.json(extracted);
  } catch (error: unknown) {
    console.error('Extract API error:', error);
    return NextResponse.json({ error: 'Failed to extract data' }, { status: 500 });
  }
}
```

---

### 7.14 `src/app/api/moodle/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { parseICalEvents } from '@/lib/ical-parser';

export async function POST(req: NextRequest) {
  try {
    const { icalUrl } = await req.json();

    if (!icalUrl || typeof icalUrl !== 'string') {
      return NextResponse.json({ error: 'Missing icalUrl' }, { status: 400 });
    }

    let url: URL;
    try {
      url = new URL(icalUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(icalUrl, {
        signal: controller.signal,
        headers: { Accept: 'text/calendar, text/plain' },
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return NextResponse.json(
          { error: `Calendar server returned ${response.status}` },
          { status: 502 }
        );
      }

      const icsText = await response.text();
      const events = parseICalEvents(icsText);
      events.sort((a, b) => a.start.getTime() - b.start.getTime());

      return NextResponse.json({ events, count: events.length });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timed out' }, { status: 504 });
    }
    console.error('Moodle API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

### 7.15 `src/lib/ical-parser.ts`

```typescript
export interface CalendarEvent {
  uid: string;
  summary: string;
  description: string;
  start: Date;
  end: Date | null;
  url: string;
  categories: string[];
  location: string;
}

function parseICalDate(dateStr: string): Date {
  dateStr = dateStr.trim();

  if (dateStr.length === 8) {
    const year = parseInt(dateStr.slice(0, 4), 10);
    const month = parseInt(dateStr.slice(4, 6), 10) - 1;
    const day = parseInt(dateStr.slice(6, 8), 10);
    return new Date(Date.UTC(year, month, day));
  }

  const clean = dateStr.replace('Z', '');
  const year = parseInt(clean.slice(0, 4), 10);
  const month = parseInt(clean.slice(4, 6), 10) - 1;
  const day = parseInt(clean.slice(6, 8), 10);
  const hour = parseInt(clean.slice(9, 11), 10);
  const minute = parseInt(clean.slice(11, 13), 10);
  const second = parseInt(clean.slice(13, 15), 10);

  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

function unfoldLines(icsText: string): string[] {
  const normalized = icsText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const unfolded = normalized.replace(/\n[ \t]/g, '');
  return unfolded.split('\n').filter((line) => line.trim().length > 0);
}

function getPropertyValue(line: string): string {
  const colonIndex = line.indexOf(':');
  if (colonIndex === -1) return '';
  return line.slice(colonIndex + 1).trim();
}

function unescapeICalText(text: string): string {
  return text
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\\\/g, '\\')
    .replace(/\\;/g, ';');
}

export function parseICalEvents(icsText: string): CalendarEvent[] {
  const lines = unfoldLines(icsText);
  const events: CalendarEvent[] = [];

  let inEvent = false;
  let current: Partial<CalendarEvent> = {};

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      current = {
        uid: '', summary: '', description: '',
        start: new Date(), end: null, url: '',
        categories: [], location: '',
      };
      continue;
    }

    if (line === 'END:VEVENT') {
      inEvent = false;
      if (current.summary || current.uid) {
        events.push(current as CalendarEvent);
      }
      continue;
    }

    if (!inEvent) continue;
    const value = getPropertyValue(line);

    if (line.startsWith('SUMMARY')) current.summary = unescapeICalText(value);
    else if (line.startsWith('DESCRIPTION')) current.description = unescapeICalText(value);
    else if (line.startsWith('DTSTART')) current.start = parseICalDate(value);
    else if (line.startsWith('DTEND')) current.end = parseICalDate(value);
    else if (line.startsWith('UID')) current.uid = value;
    else if (line.startsWith('URL')) current.url = value;
    else if (line.startsWith('CATEGORIES')) current.categories = value.split(',').map((c) => c.trim());
    else if (line.startsWith('LOCATION')) current.location = unescapeICalText(value);
  }

  return events;
}
```

---

### 7.16 `src/lib/utils.ts`

This file is auto-created by shadcn. Extend it with date helpers:

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    const absDays = Math.abs(diffDays);
    if (absDays === 0) return 'Earlier today';
    if (absDays === 1) return 'Yesterday';
    return `${absDays} days ago`;
  }

  if (diffHours < 1) return 'Less than an hour';
  if (diffHours < 24) return `In ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getUrgencyColor(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const hoursUntil = (date.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntil < 0) return 'text-destructive';
  if (hoursUntil < 24) return 'text-[hsl(var(--warning))]';
  if (hoursUntil < 72) return 'text-[hsl(var(--primary))]';
  return 'text-muted-foreground';
}

export function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'done': return 'default';
    case 'in-progress': return 'secondary';
    case 'todo': return 'outline';
    default: return 'outline';
  }
}
```

---

### 7.17 `src/components/layout/Navigation.tsx`

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Timer, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/focus', label: 'Focus', icon: Timer },
  { href: '/courses', label: 'Courses', icon: BookOpen },
];

export function Navigation() {
  const pathname = usePathname();

  // Hide navigation in focus mode
  if (pathname === '/focus') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex max-w-md items-center justify-around px-4 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'fill-primary/10')} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

---

### 7.18 `src/components/dashboard/ScheduleView.tsx`

```tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Course } from '@/lib/types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

interface ScheduleViewProps {
  courses: Course[];
}

export function ScheduleView({ courses }: ScheduleViewProps) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">This Week</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-1 text-xs">
          {DAYS.map((day) => (
            <div
              key={day}
              className={cn(
                'py-1 text-center font-medium',
                day === today && 'text-primary font-bold'
              )}
            >
              {day.slice(0, 3)}
            </div>
          ))}
          {DAYS.map((day) => (
            <div key={`col-${day}`} className="space-y-1">
              {courses
                .filter((c) => c.schedule.some((s) => s.day === day))
                .map((course) => {
                  const slot = course.schedule.find((s) => s.day === day);
                  if (!slot) return null;
                  return (
                    <div
                      key={course.id}
                      className="rounded-md px-1.5 py-1 text-[10px] leading-tight font-medium"
                      style={{ backgroundColor: course.color + '22', color: course.color, borderLeft: `3px solid ${course.color}` }}
                    >
                      <div className="font-bold">{course.code}</div>
                      <div className="opacity-75">{slot.startTime}</div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
```

---

### 7.19 `src/components/dashboard/UpcomingDeadlines.tsx`

```tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRelativeDate, getUrgencyColor, getStatusBadgeVariant } from '@/lib/utils';
import type { Assignment, Course } from '@/lib/types';

interface UpcomingDeadlinesProps {
  assignments: Assignment[];
  courses: Course[];
}

export function UpcomingDeadlines({ assignments, courses }: UpcomingDeadlinesProps) {
  const upcoming = assignments
    .filter((a) => a.status !== 'done')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Upcoming Deadlines</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No upcoming deadlines — nice! Add courses to get started.
          </p>
        ) : (
          upcoming.map((assignment) => {
            const course = courses.find((c) => c.id === assignment.courseId);
            return (
              <div
                key={assignment.id}
                className="flex items-start justify-between gap-2 rounded-lg border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-tight">{assignment.name}</p>
                  <p className="text-xs text-muted-foreground">{course?.code || 'Unknown'}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs font-medium ${getUrgencyColor(assignment.dueDate)}`}>
                    {formatRelativeDate(assignment.dueDate)}
                  </span>
                  <Badge variant={getStatusBadgeVariant(assignment.status)} className="text-[10px]">
                    {assignment.status}
                  </Badge>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
```

---

### 7.20 `src/components/dashboard/WhatNowCard.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { Assignment, Course } from '@/lib/types';

interface WhatNowCardProps {
  assignments: Assignment[];
  courses: Course[];
}

export function WhatNowCard({ assignments, courses }: WhatNowCardProps) {
  const [suggestion, setSuggestion] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [topTask, setTopTask] = useState<Assignment | null>(null);

  useEffect(() => {
    // Find the most urgent incomplete assignment
    const urgent = assignments
      .filter((a) => a.status !== 'done')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

    setTopTask(urgent || null);

    if (urgent) {
      const course = courses.find((c) => c.id === urgent.courseId);
      const hoursUntil = Math.round(
        (new Date(urgent.dueDate).getTime() - Date.now()) / (1000 * 60 * 60)
      );
      setSuggestion(
        hoursUntil < 24
          ? `${urgent.name} for ${course?.code} is due very soon! Start now.`
          : `Work on ${urgent.name} for ${course?.code} — due in ${Math.round(hoursUntil / 24)} days.`
      );
    }
  }, [assignments, courses]);

  if (!topTask) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-6 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-primary/40" />
          <p className="mt-2 text-sm text-muted-foreground">
            All caught up! Add some courses and assignments to get personalized suggestions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          What to do right now
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-relaxed">{suggestion}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            ~{topTask.estimatedMinutes} min estimated
          </span>
        </div>
        <Link href="/focus">
          <Button size="sm" className="w-full gap-2">
            Start Focus Session <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
```

---

### 7.21 `src/components/chat/MessageBubble.tsx`

```tsx
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/lib/types';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-card border rounded-bl-md'
        )}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  );
}
```

---

### 7.22 `src/components/chat/ChatInterface.tsx`

```tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { buildSystemPrompt } from '@/lib/context';
import { useCourses } from '@/hooks/use-courses';
import { useAssignments } from '@/hooks/use-assignments';
import { useTasks } from '@/hooks/use-tasks';
import type { ChatMessage } from '@/lib/types';

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { courses } = useCourses();
  const { allAssignments } = useAssignments();
  const { allTasks } = useTasks();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsStreaming(true);

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };
    setMessages([...updatedMessages, assistantMessage]);

    try {
      const systemPrompt = buildSystemPrompt(courses, allAssignments, allTasks);

      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          message: userMessage.content,
          systemPrompt,
        }),
      });

      if (!response.ok) throw new Error('API request failed');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        content += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content,
          };
          return updated;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: 'Sorry, something went wrong. Please try again.',
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="space-y-4 py-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium">Hey! I'm Phlo</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your ADHD-friendly study assistant. Ask me anything about your courses, deadlines, or campus resources.
              </p>
            </div>
          )}
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="border-t bg-card p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your courses, deadlines, or campus..."
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            disabled={isStreaming}
          />
          <Button type="submit" size="icon" disabled={isStreaming || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
```

---

### 7.23 `src/components/focus/FocusTimer.tsx`

```tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Check } from 'lucide-react';

interface FocusTimerProps {
  durationMinutes: number;
  onComplete: () => void;
}

export function FocusTimer({ durationMinutes, onComplete }: FocusTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalSeconds = durationMinutes * 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, secondsLeft, onComplete]);

  const toggle = () => setIsRunning(!isRunning);

  const reset = () => {
    setIsRunning(false);
    setSecondsLeft(totalSeconds);
  };

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Circular progress */}
      <div className="relative">
        <svg width="280" height="280" viewBox="0 0 280 280" className="-rotate-90">
          {/* Background circle */}
          <circle
            cx="140" cy="140" r="120"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="140" cy="140" r="120"
            fill="none"
            stroke="hsl(var(--focus-purple))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          <span className="mt-1 text-sm text-muted-foreground">
            {isRunning ? 'Focusing...' : secondsLeft === 0 ? 'Done!' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={reset} className="h-12 w-12 rounded-full">
          <RotateCcw className="h-5 w-5" />
        </Button>
        <Button
          size="lg"
          onClick={toggle}
          className="h-16 w-16 rounded-full"
          disabled={secondsLeft === 0}
        >
          {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onComplete}
          className="h-12 w-12 rounded-full"
        >
          <Check className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
```

---

### 7.24 `src/components/focus/TaskCard.tsx`

```tsx
import { Card, CardContent } from '@/components/ui/card';
import type { Assignment, Course } from '@/lib/types';

interface TaskCardProps {
  assignment: Assignment | null;
  course: Course | undefined;
}

export function TaskCard({ assignment, course }: TaskCardProps) {
  if (!assignment) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No tasks to focus on right now.</p>
          <p className="mt-1 text-sm text-muted-foreground">Add some assignments to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-6 text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {course?.code || 'Task'}
        </p>
        <h2 className="mt-2 text-xl font-bold leading-tight">{assignment.name}</h2>
        {assignment.estimatedMinutes > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            ~{assignment.estimatedMinutes} min estimated
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

---

### 7.25 `src/components/courses/CourseForm.tsx`

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';
import type { Course, ClassTime } from '@/lib/types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

interface CourseFormProps {
  onSubmit: (course: Omit<Course, 'id'>) => void;
  initialData?: Course;
}

export function CourseForm({ onSubmit, initialData }: CourseFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [code, setCode] = useState(initialData?.code || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [color, setColor] = useState(initialData?.color || COLORS[0]);
  const [schedule, setSchedule] = useState<ClassTime[]>(initialData?.schedule || []);

  const addScheduleSlot = () => {
    setSchedule([...schedule, { day: 'Monday', startTime: '09:00', endTime: '10:15' }]);
  };

  const removeScheduleSlot = (index: number) => {
    setSchedule(schedule.filter((_, i) => i !== index));
  };

  const updateScheduleSlot = (index: number, updates: Partial<ClassTime>) => {
    setSchedule(schedule.map((slot, i) => (i === index ? { ...slot, ...updates } : slot)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    onSubmit({ name: name.trim(), code: code.trim(), location: location.trim(), color, schedule });
    if (!initialData) {
      setName('');
      setCode('');
      setLocation('');
      setSchedule([]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{initialData ? 'Edit Course' : 'Add Course'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Course code (CPSC 3620)" value={code} onChange={(e) => setCode(e.target.value)} />
            <Input placeholder="Course name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Input placeholder="Location (e.g., UHall B660)" value={location} onChange={(e) => setLocation(e.target.value)} />

          {/* Color picker */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Color:</span>
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-6 w-6 rounded-full border-2 transition-transform ${color === c ? 'scale-125 border-foreground' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* Schedule */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Schedule</span>
              <Button type="button" variant="ghost" size="sm" onClick={addScheduleSlot}>
                <Plus className="mr-1 h-3 w-3" /> Add time
              </Button>
            </div>
            {schedule.map((slot, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={slot.day}
                  onChange={(e) => updateScheduleSlot(i, { day: e.target.value as ClassTime['day'] })}
                  className="rounded-md border bg-background px-2 py-1.5 text-sm"
                >
                  {DAYS.map((d) => <option key={d} value={d}>{d.slice(0, 3)}</option>)}
                </select>
                <Input type="time" value={slot.startTime} onChange={(e) => updateScheduleSlot(i, { startTime: e.target.value })} className="w-28" />
                <span className="text-muted-foreground">-</span>
                <Input type="time" value={slot.endTime} onChange={(e) => updateScheduleSlot(i, { endTime: e.target.value })} className="w-28" />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeScheduleSlot(i)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          <Button type="submit" className="w-full">{initialData ? 'Update' : 'Add Course'}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

---

### 7.26 `src/components/courses/CourseList.tsx`

```tsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, MapPin, Clock } from 'lucide-react';
import type { Course, Assignment } from '@/lib/types';

interface CourseListProps {
  courses: Course[];
  assignments: Assignment[];
  onDelete: (id: string) => void;
}

export function CourseList({ courses, assignments, onDelete }: CourseListProps) {
  if (courses.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">No courses yet. Add your first course above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {courses.map((course) => {
        const courseAssignments = assignments.filter((a) => a.courseId === course.id);
        const pending = courseAssignments.filter((a) => a.status !== 'done').length;

        return (
          <Card key={course.id}>
            <CardContent className="flex items-center gap-3 py-3">
              <div
                className="h-10 w-1.5 rounded-full"
                style={{ backgroundColor: course.color }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{course.code}</span>
                  <span className="truncate text-sm text-muted-foreground">{course.name}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                  {course.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {course.location}
                    </span>
                  )}
                  {course.schedule.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {course.schedule.map((s) => s.day.slice(0, 3)).join(', ')}
                    </span>
                  )}
                </div>
              </div>
              {pending > 0 && (
                <Badge variant="secondary" className="text-xs">{pending} due</Badge>
              )}
              <Button variant="ghost" size="icon" onClick={() => onDelete(course.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
```

---

### 7.27 `src/data/demo-data.ts`

```typescript
import type { Course, Assignment } from '@/lib/types';

export const DEMO_COURSES: Omit<Course, 'id'>[] = [
  {
    name: 'Operating Systems',
    code: 'CPSC 3620',
    location: 'UHall B660',
    color: '#3B82F6',
    schedule: [
      { day: 'Tuesday', startTime: '13:00', endTime: '14:15' },
      { day: 'Thursday', startTime: '13:00', endTime: '14:15' },
    ],
  },
  {
    name: 'Data Structures & Algorithms',
    code: 'CPSC 2620',
    location: 'UHall C610',
    color: '#10B981',
    schedule: [
      { day: 'Monday', startTime: '10:00', endTime: '10:50' },
      { day: 'Wednesday', startTime: '10:00', endTime: '10:50' },
      { day: 'Friday', startTime: '10:00', endTime: '10:50' },
    ],
  },
  {
    name: 'Linear Algebra',
    code: 'MATH 2570',
    location: 'UHall E580',
    color: '#8B5CF6',
    schedule: [
      { day: 'Tuesday', startTime: '09:00', endTime: '10:15' },
      { day: 'Thursday', startTime: '09:00', endTime: '10:15' },
    ],
  },
  {
    name: 'Technical Writing',
    code: 'ENGL 2010',
    location: 'UHall A740',
    color: '#F59E0B',
    schedule: [
      { day: 'Monday', startTime: '14:00', endTime: '15:15' },
      { day: 'Wednesday', startTime: '14:00', endTime: '15:15' },
    ],
  },
];

export function createDemoAssignments(courseIds: string[]): Omit<Assignment, 'id'>[] {
  const now = new Date();

  const addDays = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(23, 59, 0, 0);
    return d.toISOString();
  };

  return [
    {
      courseId: courseIds[0], // CPSC 3620
      name: 'Process Scheduling Simulation',
      dueDate: addDays(2),
      description: 'Implement FCFS, SJF, and Round Robin scheduling algorithms in C.',
      status: 'in-progress',
      estimatedMinutes: 180,
    },
    {
      courseId: courseIds[0],
      name: 'Midterm Exam Study',
      dueDate: addDays(7),
      description: 'Covers chapters 1-6: processes, threads, synchronization, deadlocks.',
      status: 'todo',
      estimatedMinutes: 300,
    },
    {
      courseId: courseIds[1], // CPSC 2620
      name: 'AVL Tree Implementation',
      dueDate: addDays(4),
      description: 'Implement an AVL tree with insert, delete, and search operations.',
      status: 'todo',
      estimatedMinutes: 120,
    },
    {
      courseId: courseIds[2], // MATH 2570
      name: 'Assignment 5 - Eigenvalues',
      dueDate: addDays(1),
      description: 'Problems on eigenvalues, eigenvectors, and diagonalization.',
      status: 'todo',
      estimatedMinutes: 90,
    },
    {
      courseId: courseIds[3], // ENGL 2010
      name: 'Technical Report Draft',
      dueDate: addDays(10),
      description: 'First draft of technical report on a chosen CPSC topic.',
      status: 'todo',
      estimatedMinutes: 150,
    },
  ];
}
```

---

### 7.28 Page Files

**`src/app/page.tsx` (Dashboard)**

```tsx
import { DashboardContent } from '@/components/dashboard/DashboardContent';

export default function DashboardPage() {
  return <DashboardContent />;
}
```

**`src/components/dashboard/DashboardContent.tsx`**

```tsx
'use client';

import { useCourses } from '@/hooks/use-courses';
import { useAssignments } from '@/hooks/use-assignments';
import { ScheduleView } from './ScheduleView';
import { UpcomingDeadlines } from './UpcomingDeadlines';
import { WhatNowCard } from './WhatNowCard';
import { Navigation } from '@/components/layout/Navigation';

export function DashboardContent() {
  const { courses, isLoaded: coursesLoaded } = useCourses();
  const { allAssignments, isLoaded: assignmentsLoaded } = useAssignments();

  if (!coursesLoaded || !assignmentsLoaded) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>;
  }

  return (
    <>
      <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
        <div>
          <h1 className="text-2xl font-bold">Good {getGreeting()}</h1>
          <p className="text-sm text-muted-foreground">Here's what's on your plate.</p>
        </div>
        <WhatNowCard assignments={allAssignments} courses={courses} />
        <UpcomingDeadlines assignments={allAssignments} courses={courses} />
        <ScheduleView courses={courses} />
      </div>
      <Navigation />
    </>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
```

**`src/app/chat/page.tsx`**

```tsx
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Navigation } from '@/components/layout/Navigation';

export default function ChatPage() {
  return (
    <>
      <ChatInterface />
      <Navigation />
    </>
  );
}
```

**`src/app/focus/page.tsx`**

```tsx
import { FocusContent } from '@/components/focus/FocusContent';

export default function FocusPage() {
  return <FocusContent />;
}
```

**`src/components/focus/FocusContent.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { FocusTimer } from './FocusTimer';
import { TaskCard } from './TaskCard';
import { useCourses } from '@/hooks/use-courses';
import { useAssignments } from '@/hooks/use-assignments';

export function FocusContent() {
  const [sessionComplete, setSessionComplete] = useState(false);
  const { courses } = useCourses();
  const { allAssignments } = useAssignments();

  const topTask = allAssignments
    .filter((a) => a.status !== 'done')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0] || null;

  const course = topTask ? courses.find((c) => c.id === topTask.courseId) : undefined;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[hsl(var(--focus-purple)/0.03)] px-4">
      <Link href="/" className="absolute left-4 top-4">
        <Button variant="ghost" size="sm" className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Exit Focus
        </Button>
      </Link>

      <div className="w-full max-w-sm space-y-8">
        <TaskCard assignment={topTask} course={course} />
        <FocusTimer
          durationMinutes={25}
          onComplete={() => setSessionComplete(true)}
        />
        {sessionComplete && (
          <div className="text-center">
            <p className="text-lg font-semibold text-accent">Great work!</p>
            <p className="text-sm text-muted-foreground">Take a 5 minute break, then keep going.</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

**`src/app/courses/page.tsx`**

```tsx
import { CoursesContent } from '@/components/courses/CoursesContent';
import { Navigation } from '@/components/layout/Navigation';

export default function CoursesPage() {
  return (
    <>
      <CoursesContent />
      <Navigation />
    </>
  );
}
```

**`src/components/courses/CoursesContent.tsx`**

```tsx
'use client';

import { useCourses } from '@/hooks/use-courses';
import { useAssignments } from '@/hooks/use-assignments';
import { CourseForm } from './CourseForm';
import { CourseList } from './CourseList';
import { Button } from '@/components/ui/button';
import { DEMO_COURSES, createDemoAssignments } from '@/data/demo-data';

export function CoursesContent() {
  const { courses, addCourse, deleteCourse, isLoaded } = useCourses();
  const { allAssignments, addAssignment, deleteAssignmentsForCourse } = useAssignments();

  const handleDelete = (id: string) => {
    deleteCourse(id);
    deleteAssignmentsForCourse(id);
  };

  const loadDemoData = () => {
    const courseIds: string[] = [];
    DEMO_COURSES.forEach((c) => {
      const created = addCourse(c);
      courseIds.push(created.id);
    });

    const demoAssignments = createDemoAssignments(courseIds);
    demoAssignments.forEach((a) => addAssignment(a));
  };

  if (!isLoaded) return null;

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Courses</h1>
        {courses.length === 0 && (
          <Button variant="outline" size="sm" onClick={loadDemoData}>
            Load Demo Data
          </Button>
        )}
      </div>
      <CourseForm onSubmit={addCourse} />
      <CourseList courses={courses} assignments={allAssignments} onDelete={handleDelete} />
    </div>
  );
}
```

---

### 7.29 `tailwind.config.ts` (additions)

After shadcn init, add the font families to the config. The shadcn init already sets up colors. Add:

```typescript
// In the theme.extend section:
fontFamily: {
  sans: ['var(--font-nunito-sans)', 'system-ui', 'sans-serif'],
  heading: ['var(--font-nunito)', 'system-ui', 'sans-serif'],
},
```

---

## 8. Demo Script (3 Minutes)

**0:00-0:20 — Hook**
"Student life is overwhelming — especially with ADHD. Juggling Moodle deadlines, lecture schedules, and study sessions across scattered tools. Phlo fixes this."

**0:20-0:50 — Course Setup**
Show adding a ULeth course manually, OR click "Load Demo Data" to populate realistic courses. "Just paste from Moodle — Phlo does the rest."

**0:50-1:30 — Dashboard**
Show the weekly schedule populated, upcoming deadlines with urgency colors. Highlight the "What Now?" card: "Phlo analyzes your deadlines and tells you the ONE thing to focus on."

**1:30-2:15 — AI Chat**
Ask: "What should I study tonight?" — AI responds with specific recommendations based on actual deadlines. Ask: "Where can I get help with recursion?" — AI suggests ULeth tutoring resources. "It knows YOUR courses, YOUR deadlines."

**2:15-2:45 — Focus Mode**
Click "Start Focus Session" from the What Now card. Show the distraction-free timer with just the current task. "Designed for ADHD — one task, one timer, no distractions."

**2:45-3:00 — Close**
"Phlo — your ADHD-friendly AI study partner. Built with Next.js, Gemini AI, and designed with ADHD brains in mind. By Phuturum."

---

## 9. Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Go to vercel.com, import the repository
3. Add environment variable: `GEMINI_API_KEY`
4. Deploy

### Manual

```bash
npm run build
npx vercel --prod
```

### Pre-deploy checklist

- [ ] `.env.local` has `GEMINI_API_KEY` set
- [ ] Demo data loads correctly
- [ ] AI chat streams properly
- [ ] Focus timer works
- [ ] Navigation works on mobile
- [ ] All pages responsive

---

## Research References

Detailed research documents for each technology are available in the `research/` directory:

- `research/gemini-api-research.md` — Full Gemini API documentation with streaming examples
- `research/tailwind-theming-and-localstorage.md` — Tailwind theming and localStorage patterns

Additional research was conducted on:
- **Next.js 14+ App Router**: Routing, streaming, client/server components, environment variables
- **shadcn/ui**: Setup, theming (HSL CSS variables), component APIs
- **iCal parsing**: RFC 5545, Moodle export format, custom zero-dependency parser
- **ADHD-friendly UI design**: Cognitive load theory, color psychology, typography, layout patterns, micro-interactions, focus mode design

---

*Built for ULeth Hackathon 2026. By Phuturum.*
