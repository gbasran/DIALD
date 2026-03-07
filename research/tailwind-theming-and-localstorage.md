# Hackathon Research: Tailwind CSS Custom Theming & localStorage Patterns

---

## TOPIC 1: Tailwind CSS Custom Theming

---

### 1.1 Customizing tailwind.config.ts with Brand Colors

Tailwind's configuration file lets you extend or override the default color palette. The `extend` key adds colors without losing defaults; placing colors directly under `theme` replaces the defaults entirely.

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Single value brand colors
        "phlo-blue": "#3B82F6",
        "phlo-green": "#10B981",
        "phlo-purple": "#8B5CF6",

        // Multi-shade brand colors (use like bg-brand-500, text-brand-700)
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

**Usage in JSX:**
```tsx
<div className="bg-phlo-blue text-white">Single brand color</div>
<div className="bg-brand-500 hover:bg-brand-600">Multi-shade brand color</div>
```

**Key point:** Using `extend.colors` adds your custom colors alongside all of Tailwind's built-in colors (slate, gray, red, blue, etc.). If you put colors directly under `theme.colors` (without `extend`), you lose all defaults.

---

### 1.2 CSS Variables Approach vs tailwind.config.ts Extend Approach

There are two main strategies for theming. Each has trade-offs.

#### Approach A: Static values in tailwind.config.ts

```ts
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      primary: "#3B82F6",
      secondary: "#10B981",
      accent: "#8B5CF6",
    },
  },
},
```

**Pros:**
- Simple, no extra CSS needed
- Full IDE autocomplete
- Tailwind generates all utility classes at build time

**Cons:**
- Cannot change at runtime
- Dark mode requires separate `dark:` variants for every usage
- Switching themes (e.g., user-selected accent colors) is impossible without rebuilding

#### Approach B: CSS Variables referenced in tailwind.config.ts

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --color-primary: 59 130 246;      /* RGB channels for blue-500 */
    --color-secondary: 16 185 129;    /* RGB channels for green-500 */
    --color-accent: 139 92 246;       /* RGB channels for purple-500 */
    --color-background: 255 255 255;
    --color-foreground: 15 23 42;
  }

  .dark {
    --color-primary: 96 165 250;      /* blue-400 (lighter for dark bg) */
    --color-secondary: 52 211 153;    /* green-400 */
    --color-accent: 167 139 250;      /* purple-400 */
    --color-background: 15 23 42;
    --color-foreground: 248 250 252;
  }
}
```

```ts
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      primary: "rgb(var(--color-primary) / <alpha-value>)",
      secondary: "rgb(var(--color-secondary) / <alpha-value>)",
      accent: "rgb(var(--color-accent) / <alpha-value>)",
      background: "rgb(var(--color-background) / <alpha-value>)",
      foreground: "rgb(var(--color-foreground) / <alpha-value>)",
    },
  },
},
```

**Pros:**
- Dark mode is automatic -- just swap the CSS class, all utilities update
- Runtime theme switching (e.g., user picks accent color)
- Single source of truth for colors
- `<alpha-value>` syntax preserves opacity support (`bg-primary/50` works)

**Cons:**
- Slightly more setup
- Must store raw color channels (not hex) to preserve opacity utilities
- IDE autocomplete still works, but you can't see the actual color in the config

**Recommendation for hackathon:** Use CSS variables. It pays off immediately when you add dark mode, and shadcn/ui already uses this pattern.

---

### 1.3 How shadcn/ui Uses CSS Variables for Theming (HSL-Based)

shadcn/ui uses HSL (Hue, Saturation, Lightness) color channels stored in CSS variables. This is its core theming mechanism.

#### The CSS Variable Convention

```css
/* globals.css -- shadcn/ui default pattern */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;

    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;

    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}
```

#### How These Map to Tailwind

```ts
// tailwind.config.ts (shadcn/ui pattern)
theme: {
  extend: {
    colors: {
      border: "hsl(var(--border))",
      input: "hsl(var(--input))",
      ring: "hsl(var(--ring))",
      background: "hsl(var(--background))",
      foreground: "hsl(var(--foreground))",
      primary: {
        DEFAULT: "hsl(var(--primary))",
        foreground: "hsl(var(--primary-foreground))",
      },
      secondary: {
        DEFAULT: "hsl(var(--secondary))",
        foreground: "hsl(var(--secondary-foreground))",
      },
      destructive: {
        DEFAULT: "hsl(var(--destructive))",
        foreground: "hsl(var(--destructive-foreground))",
      },
      muted: {
        DEFAULT: "hsl(var(--muted))",
        foreground: "hsl(var(--muted-foreground))",
      },
      accent: {
        DEFAULT: "hsl(var(--accent))",
        foreground: "hsl(var(--accent-foreground))",
      },
      popover: {
        DEFAULT: "hsl(var(--popover))",
        foreground: "hsl(var(--popover-foreground))",
      },
      card: {
        DEFAULT: "hsl(var(--card))",
        foreground: "hsl(var(--card-foreground))",
      },
    },
    borderRadius: {
      lg: "var(--radius)",
      md: "calc(var(--radius) - 2px)",
      sm: "calc(var(--radius) - 4px)",
    },
  },
},
```

**Usage in components:**
```tsx
// These automatically switch between light and dark
<div className="bg-background text-foreground">Page wrapper</div>
<button className="bg-primary text-primary-foreground">Click me</button>
<p className="text-muted-foreground">Subtle text</p>
```

#### Adding Custom Brand Colors to shadcn/ui's System

To add your own semantic colors (e.g., "phlo-blue") alongside shadcn's variables:

```css
/* globals.css -- add to both :root and .dark */
:root {
  /* ... existing shadcn variables ... */
  --phlo-blue: 217 91% 60%;
  --phlo-green: 160 84% 39%;
  --phlo-purple: 258 90% 66%;
}

.dark {
  /* ... existing shadcn variables ... */
  --phlo-blue: 213 94% 68%;
  --phlo-green: 160 67% 52%;
  --phlo-purple: 258 90% 76%;
}
```

```ts
// tailwind.config.ts -- add to extend.colors
colors: {
  // ... existing shadcn colors ...
  "phlo-blue": "hsl(var(--phlo-blue))",
  "phlo-green": "hsl(var(--phlo-green))",
  "phlo-purple": "hsl(var(--phlo-purple))",
},
```

**Why HSL?** HSL makes it intuitive to create light/dark variants: keep the same hue (H), and adjust saturation (S) and lightness (L). For dark mode, you typically increase lightness and may reduce saturation slightly.

---

### 1.4 Dark Mode Setup with Tailwind (Class-Based)

Class-based dark mode means Tailwind looks for a `dark` class on a parent element (usually `<html>`) instead of relying on the OS `prefers-color-scheme` media query. This gives you programmatic control.

#### Step 1: Configure Tailwind

```ts
// tailwind.config.ts
const config: Config = {
  darkMode: "class",  // enables class-based dark mode
  content: [/* ... */],
  theme: {
    extend: {/* ... */},
  },
};
```

#### Step 2: Use next-themes for Toggle Logic

`next-themes` is the standard library for theme switching in Next.js. It handles localStorage persistence, system preference detection, and avoiding flash-of-unstyled-content (FOUC).

```bash
npm install next-themes
```

```tsx
// src/app/providers.tsx
"use client";

import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"           // adds "dark" class to <html>
      defaultTheme="system"       // respects OS preference by default
      enableSystem                // listen to prefers-color-scheme
      disableTransitionOnChange   // prevents flash during theme switch
    >
      {children}
    </ThemeProvider>
  );
}
```

```tsx
// src/app/layout.tsx
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**Important:** `suppressHydrationWarning` on `<html>` is needed because `next-themes` injects a script that sets the `class` attribute before React hydrates, which would otherwise cause a hydration mismatch warning.

#### Step 3: Theme Toggle Component

```tsx
// src/components/theme-toggle.tsx
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch -- only render after mount
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="rounded-md p-2 bg-secondary text-secondary-foreground"
    >
      {theme === "dark" ? "Light Mode" : "Dark Mode"}
    </button>
  );
}
```

#### Using dark: Variants (Without CSS Variables)

If you are NOT using the CSS variable approach, you apply dark variants manually:

```tsx
<div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
  <p className="text-gray-600 dark:text-gray-400">
    Every color needs a dark: variant
  </p>
</div>
```

**This is why CSS variables are strongly preferred** -- with variables, you set colors once in `:root` and `.dark`, and every usage of `bg-background` or `text-foreground` automatically adapts.

---

### 1.5 Custom Color Palette Setup

Here is a complete example of a branded color palette with semantic naming:

```css
/* globals.css */
@layer base {
  :root {
    /* Brand palette */
    --phlo-blue: 217 91% 60%;
    --phlo-blue-light: 213 100% 95%;
    --phlo-blue-dark: 217 91% 45%;

    --phlo-green: 160 84% 39%;
    --phlo-green-light: 158 64% 92%;
    --phlo-green-dark: 160 84% 29%;

    --phlo-purple: 258 90% 66%;
    --phlo-purple-light: 258 90% 95%;
    --phlo-purple-dark: 258 90% 50%;

    /* Semantic tokens */
    --success: var(--phlo-green);
    --warning: 38 92% 50%;
    --error: 0 84% 60%;
    --info: var(--phlo-blue);
  }

  .dark {
    --phlo-blue: 213 94% 68%;
    --phlo-blue-light: 217 91% 15%;
    --phlo-blue-dark: 213 94% 78%;

    --phlo-green: 160 67% 52%;
    --phlo-green-light: 160 40% 15%;
    --phlo-green-dark: 160 67% 62%;

    --phlo-purple: 258 90% 76%;
    --phlo-purple-light: 258 50% 15%;
    --phlo-purple-dark: 258 90% 86%;

    --success: var(--phlo-green);
    --warning: 38 92% 65%;
    --error: 0 84% 70%;
    --info: var(--phlo-blue);
  }
}
```

```ts
// tailwind.config.ts
colors: {
  "phlo-blue": {
    DEFAULT: "hsl(var(--phlo-blue))",
    light: "hsl(var(--phlo-blue-light))",
    dark: "hsl(var(--phlo-blue-dark))",
  },
  "phlo-green": {
    DEFAULT: "hsl(var(--phlo-green))",
    light: "hsl(var(--phlo-green-light))",
    dark: "hsl(var(--phlo-green-dark))",
  },
  "phlo-purple": {
    DEFAULT: "hsl(var(--phlo-purple))",
    light: "hsl(var(--phlo-purple-light))",
    dark: "hsl(var(--phlo-purple-dark))",
  },
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  error: "hsl(var(--error))",
  info: "hsl(var(--info))",
},
```

**Usage:**
```tsx
<div className="bg-phlo-blue text-white">Default blue</div>
<div className="bg-phlo-blue-light text-phlo-blue-dark">Soft blue card</div>
<span className="text-success">Saved!</span>
<span className="text-error">Failed!</span>
```

---

### 1.6 Font Configuration with next/font

`next/font` automatically hosts fonts with zero layout shift. Here is how to integrate it with Tailwind.

#### Google Fonts

```tsx
// src/app/layout.tsx
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",   // CSS variable name
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

```ts
// tailwind.config.ts
theme: {
  extend: {
    fontFamily: {
      sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      mono: ["var(--font-mono)", "Menlo", "monospace"],
    },
  },
},
```

#### Local Fonts

```tsx
// src/app/layout.tsx
import localFont from "next/font/local";

const calSans = localFont({
  src: "./fonts/CalSans-SemiBold.woff2",
  variable: "--font-cal",
  display: "swap",
});

// Add calSans.variable to <html className={...}>
```

```ts
// tailwind.config.ts
fontFamily: {
  heading: ["var(--font-cal)", "system-ui", "sans-serif"],
  sans: ["var(--font-inter)", "system-ui", "sans-serif"],
  mono: ["var(--font-mono)", "Menlo", "monospace"],
},
```

**Usage:**
```tsx
<h1 className="font-heading text-4xl">Page Title</h1>
<p className="font-sans">Body text in Inter</p>
<code className="font-mono">console.log("hello")</code>
```

---
---

## TOPIC 2: localStorage Patterns in React/Next.js

---

### 2.1 Best Patterns for localStorage in Next.js App Router (Avoiding SSR Issues)

**The core problem:** `localStorage` is a browser API. It does not exist on the server. In Next.js App Router, components can render on the server (Server Components) or on the client. Even Client Components render on the server first (SSR) before hydrating in the browser.

#### Rule 1: Only access localStorage in Client Components

```tsx
// This component MUST have "use client" at the top
"use client";

import { useEffect, useState } from "react";

export function UserPreferences() {
  const [preferences, setPreferences] = useState<Prefs | null>(null);

  useEffect(() => {
    // Safe: useEffect only runs in the browser
    const stored = localStorage.getItem("preferences");
    if (stored) {
      setPreferences(JSON.parse(stored));
    }
  }, []);

  // ...
}
```

#### Rule 2: Never access localStorage at the module level

```ts
// BAD -- this runs during SSR and will crash
const theme = localStorage.getItem("theme"); // ReferenceError: localStorage is not defined

// GOOD -- guard with typeof check (but prefer useEffect)
const theme = typeof window !== "undefined"
  ? localStorage.getItem("theme")
  : null;
```

#### Rule 3: Use useEffect for reads, event handlers for writes

```tsx
"use client";

export function Counter() {
  const [count, setCount] = useState(0);

  // Read on mount (useEffect = browser only)
  useEffect(() => {
    const saved = localStorage.getItem("count");
    if (saved) setCount(Number(saved));
  }, []);

  // Write in event handler (also browser only)
  const increment = () => {
    const newCount = count + 1;
    setCount(newCount);
    localStorage.setItem("count", String(newCount));
  };

  return <button onClick={increment}>{count}</button>;
}
```

---

### 2.2 Custom useLocalStorage Hook

This is the most important pattern. A reusable hook that behaves like `useState` but persists to localStorage.

```ts
// src/hooks/use-local-storage.ts
"use client";

import { useState, useEffect, useCallback } from "react";

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Initialize state -- during SSR, always use initialValue
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // On mount, read from localStorage
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

  // Setter that also writes to localStorage
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

  // Remove function
  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
```

**Usage:**
```tsx
"use client";

import { useLocalStorage } from "@/hooks/use-local-storage";

interface UserSettings {
  theme: "light" | "dark";
  fontSize: number;
}

export function SettingsPanel() {
  const [settings, setSettings] = useLocalStorage<UserSettings>("settings", {
    theme: "light",
    fontSize: 16,
  });

  return (
    <div>
      <p>Current theme: {settings.theme}</p>
      <button
        onClick={() =>
          setSettings((prev) => ({
            ...prev,
            theme: prev.theme === "light" ? "dark" : "light",
          }))
        }
      >
        Toggle Theme
      </button>
    </div>
  );
}
```

---

### 2.3 CRUD Helper Functions for Structured Data in localStorage

For managing collections (courses, assignments, tasks), a service layer keeps things clean.

```ts
// src/lib/storage.ts

/**
 * Generic CRUD operations for localStorage collections.
 * Each item must have an `id` field of type string.
 */
export interface Identifiable {
  id: string;
}

export function createStorageService<T extends Identifiable>(storageKey: string) {
  function getAll(): T[] {
    if (typeof window === "undefined") return [];
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

  function create(item: T): T {
    const items = getAll();
    items.push(item);
    localStorage.setItem(storageKey, JSON.stringify(items));
    return item;
  }

  function update(id: string, updates: Partial<T>): T | undefined {
    const items = getAll();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return undefined;

    items[index] = { ...items[index], ...updates };
    localStorage.setItem(storageKey, JSON.stringify(items));
    return items[index];
  }

  function remove(id: string): boolean {
    const items = getAll();
    const filtered = items.filter((item) => item.id !== id);
    if (filtered.length === items.length) return false;

    localStorage.setItem(storageKey, JSON.stringify(filtered));
    return true;
  }

  function clear(): void {
    localStorage.removeItem(storageKey);
  }

  return { getAll, getById, create, update, remove, clear };
}
```

**Usage with typed entities:**
```ts
// src/lib/services.ts
import { createStorageService } from "./storage";

export interface Course {
  id: string;
  name: string;
  code: string;
  color: string;
  semester: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  dueDate: string;    // ISO date string
  weight: number;      // percentage
  completed: boolean;
}

export interface Task {
  id: string;
  assignmentId: string;
  title: string;
  completed: boolean;
  order: number;
}

export const courseService = createStorageService<Course>("courses");
export const assignmentService = createStorageService<Assignment>("assignments");
export const taskService = createStorageService<Task>("tasks");
```

**Usage in a component:**
```tsx
"use client";

import { courseService, type Course } from "@/lib/services";
import { useState, useEffect } from "react";
import { nanoid } from "nanoid"; // or crypto.randomUUID()

export function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    setCourses(courseService.getAll());
  }, []);

  const addCourse = () => {
    const newCourse: Course = {
      id: crypto.randomUUID(),
      name: "Data Structures",
      code: "CPSC 2620",
      color: "#3B82F6",
      semester: "Fall 2026",
    };
    courseService.create(newCourse);
    setCourses(courseService.getAll());
  };

  const deleteCourse = (id: string) => {
    courseService.remove(id);
    setCourses(courseService.getAll());
  };

  return (
    <div>
      <button onClick={addCourse}>Add Course</button>
      {courses.map((course) => (
        <div key={course.id}>
          <span>{course.code} - {course.name}</span>
          <button onClick={() => deleteCourse(course.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

---

### 2.4 Type-Safe localStorage with TypeScript Generics

For a more robust approach, you can create a fully type-safe storage map that ensures keys and value types are always paired correctly.

```ts
// src/lib/typed-storage.ts

/**
 * Define ALL localStorage keys and their types in one place.
 * This prevents typos and ensures type consistency across the app.
 */
interface StorageSchema {
  "courses": Course[];
  "assignments": Assignment[];
  "tasks": Task[];
  "user-settings": UserSettings;
  "onboarding-complete": boolean;
  "selected-semester": string;
}

export function getStorageItem<K extends keyof StorageSchema>(
  key: K
): StorageSchema[K] | null {
  if (typeof window === "undefined") return null;
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as StorageSchema[K]) : null;
  } catch {
    return null;
  }
}

export function setStorageItem<K extends keyof StorageSchema>(
  key: K,
  value: StorageSchema[K]
): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to write to localStorage key "${key}":`, error);
  }
}

export function removeStorageItem<K extends keyof StorageSchema>(
  key: K
): void {
  localStorage.removeItem(key);
}
```

**This gives you:**
```ts
// Autocomplete for key names -- only "courses", "assignments", etc.
const courses = getStorageItem("courses");
// TypeScript knows: courses is Course[] | null

const settings = getStorageItem("user-settings");
// TypeScript knows: settings is UserSettings | null

// Type error! "foo" is not a valid key
getStorageItem("foo"); // Error: Argument of type '"foo"' is not assignable

// Type error! Wrong value type for this key
setStorageItem("onboarding-complete", "yes"); // Error: string is not boolean
```

#### Combining with the useLocalStorage hook

```ts
// src/hooks/use-typed-storage.ts
"use client";

import { useState, useEffect, useCallback } from "react";

interface StorageSchema {
  courses: Course[];
  assignments: Assignment[];
  tasks: Task[];
  "user-settings": UserSettings;
  "selected-semester": string;
}

export function useTypedStorage<K extends keyof StorageSchema>(
  key: K,
  initialValue: StorageSchema[K]
): [StorageSchema[K], (value: StorageSchema[K] | ((prev: StorageSchema[K]) => StorageSchema[K])) => void] {
  const [value, setValue] = useState<StorageSchema[K]>(initialValue);

  useEffect(() => {
    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        setValue(JSON.parse(item) as StorageSchema[K]);
      }
    } catch {
      // use initial value on error
    }
  }, [key]);

  const setAndPersist = useCallback(
    (newValue: StorageSchema[K] | ((prev: StorageSchema[K]) => StorageSchema[K])) => {
      setValue((prev) => {
        const resolved = newValue instanceof Function ? newValue(prev) : newValue;
        localStorage.setItem(key, JSON.stringify(resolved));
        return resolved;
      });
    },
    [key]
  );

  return [value, setAndPersist];
}
```

---

### 2.5 Handling Hydration Mismatches with localStorage

**The problem:** During SSR, the component renders with `initialValue` (e.g., empty array). After hydration in the browser, `useEffect` reads localStorage and updates state. If the rendered output depends on this state, there is a brief flash and React may warn about hydration mismatch.

#### Strategy 1: Defer rendering until mounted (best for small UI elements)

```tsx
"use client";

import { useState, useEffect } from "react";

export function GreetingBanner() {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user-name");
    if (stored) setName(stored);
    setMounted(true);
  }, []);

  // Render nothing (or a skeleton) until after hydration
  if (!mounted) {
    return <div className="h-8 w-48 animate-pulse bg-muted rounded" />;
  }

  return <p>Welcome back, {name || "Guest"}!</p>;
}
```

#### Strategy 2: Use the same initial value on server and client

```tsx
"use client";

export function CourseList() {
  // Both SSR and initial client render show empty array -- no mismatch
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    // After hydration, load from localStorage
    const stored = localStorage.getItem("courses");
    if (stored) setCourses(JSON.parse(stored));
  }, []);

  // During SSR: renders "No courses yet" (empty array)
  // After hydration: renders actual courses
  // No hydration mismatch because empty array -> empty array on first render
  return (
    <div>
      {courses.length === 0 ? (
        <p>No courses yet</p>
      ) : (
        courses.map((c) => <CourseCard key={c.id} course={c} />)
      )}
    </div>
  );
}
```

#### Strategy 3: Suppress hydration warning (last resort)

```tsx
// Only for elements where mismatch is expected and harmless
<div suppressHydrationWarning>
  {typeof window !== "undefined" ? localStorage.getItem("count") : "0"}
</div>
```

**Recommended approach:** Strategy 2 is the cleanest for data-driven UIs. Initialize with a safe default (empty array, null, etc.), then load localStorage in useEffect. The brief empty state can be covered by a loading skeleton or empty state message.

---

### 2.6 Pattern for Storing Arrays of Objects (Courses, Assignments, Tasks) with IDs

Here is the complete recommended pattern combining everything above, structured for a student planner app.

#### Data Models

```ts
// src/types/index.ts

export interface Course {
  id: string;
  name: string;
  code: string;
  color: string;
  semester: string;
  createdAt: string;
}

export interface Assignment {
  id: string;
  courseId: string;        // foreign key to Course
  title: string;
  description: string;
  dueDate: string;         // ISO string: "2026-03-15T23:59:00Z"
  weight: number;
  grade: number | null;    // null = not graded yet
  completed: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  assignmentId: string;    // foreign key to Assignment
  title: string;
  completed: boolean;
  order: number;
  createdAt: string;
}
```

#### Storage Keys Convention

```ts
// src/lib/storage-keys.ts
export const STORAGE_KEYS = {
  COURSES: "phlo-courses",
  ASSIGNMENTS: "phlo-assignments",
  TASKS: "phlo-tasks",
  SETTINGS: "phlo-settings",
} as const;
```

Using a prefix ("phlo-") avoids conflicts with other apps using the same domain (e.g., localhost).

#### Combined Hook + Service Pattern

```ts
// src/hooks/use-courses.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { Course } from "@/types";

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COURSES);
      if (stored) {
        setCourses(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load courses:", error);
    }
    setIsLoaded(true);
  }, []);

  // Persist whenever courses change (but only after initial load)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
    }
  }, [courses, isLoaded]);

  const addCourse = useCallback((course: Omit<Course, "id" | "createdAt">) => {
    const newCourse: Course = {
      ...course,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setCourses((prev) => [...prev, newCourse]);
    return newCourse;
  }, []);

  const updateCourse = useCallback((id: string, updates: Partial<Course>) => {
    setCourses((prev) =>
      prev.map((course) =>
        course.id === id ? { ...course, ...updates } : course
      )
    );
  }, []);

  const deleteCourse = useCallback((id: string) => {
    setCourses((prev) => prev.filter((course) => course.id !== id));
  }, []);

  const getCourseById = useCallback(
    (id: string) => courses.find((c) => c.id === id),
    [courses]
  );

  return {
    courses,
    isLoaded,
    addCourse,
    updateCourse,
    deleteCourse,
    getCourseById,
  };
}
```

#### Relational Queries (Filtering by Foreign Key)

```ts
// src/hooks/use-assignments.ts
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { Assignment } from "@/types";

export function useAssignments(courseId?: string) {
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
      if (stored) setAllAssignments(JSON.parse(stored));
    } catch {
      // ignore
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(
        STORAGE_KEYS.ASSIGNMENTS,
        JSON.stringify(allAssignments)
      );
    }
  }, [allAssignments, isLoaded]);

  // Filter by courseId if provided
  const assignments = useMemo(
    () =>
      courseId
        ? allAssignments.filter((a) => a.courseId === courseId)
        : allAssignments,
    [allAssignments, courseId]
  );

  const addAssignment = useCallback(
    (assignment: Omit<Assignment, "id" | "createdAt">) => {
      const newAssignment: Assignment = {
        ...assignment,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setAllAssignments((prev) => [...prev, newAssignment]);
      return newAssignment;
    },
    []
  );

  const updateAssignment = useCallback(
    (id: string, updates: Partial<Assignment>) => {
      setAllAssignments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
      );
    },
    []
  );

  const deleteAssignment = useCallback((id: string) => {
    setAllAssignments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Cascade delete: remove all assignments for a course
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
  };
}
```

#### ID Generation

```ts
// Option 1: Built-in (recommended, no dependency)
const id = crypto.randomUUID();
// Output: "3b241101-e2bb-4d7a-8702-9e0e0a8e5e0d"

// Option 2: nanoid (smaller IDs, needs npm install nanoid)
import { nanoid } from "nanoid";
const id = nanoid();
// Output: "V1StGXR8_Z5jdHi6B-myT"

// Option 3: Timestamp-based (simple, good enough for localStorage)
const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
// Output: "1709747200000-k3j8f2a"
```

`crypto.randomUUID()` is available in all modern browsers and Node.js 19+. For a hackathon, it is the simplest choice with no dependencies.

---

## Quick Reference: Putting It All Together

Here is how both topics combine in a Next.js project:

```
src/
  app/
    globals.css          <-- CSS variables (shadcn/ui + custom brand colors)
    layout.tsx           <-- next/font setup, ThemeProvider
    providers.tsx        <-- next-themes ThemeProvider wrapper
  components/
    theme-toggle.tsx     <-- Dark mode toggle
  hooks/
    use-local-storage.ts <-- Generic useLocalStorage hook
    use-courses.ts       <-- Course-specific CRUD hook
    use-assignments.ts   <-- Assignment-specific CRUD hook
  lib/
    storage.ts           <-- Generic CRUD service factory
    storage-keys.ts      <-- Centralized key constants
  types/
    index.ts             <-- Course, Assignment, Task interfaces
  tailwind.config.ts     <-- Custom colors referencing CSS variables
```
