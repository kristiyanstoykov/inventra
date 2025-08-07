To merge the **new `global.css`** structure with the  **colors and variables from the old one** , we’ll:

* ✅ Retain the modern structure of the **new file** (e.g. use of `@custom-variant`, `@theme inline`, `oklch`, etc.).
* ✅ Integrate the **color values from the old file** (which uses `hsl`-like color values).
* ✅ Preserve any **custom utilities** from the old CSS.
* ✅ Keep the Google Fonts import and `body` font style from the old file.
* ✅ Include the new utilities (like `tw-animate-css`) and updated Tailwind features.

---

Here is the  **merged `global.css`** :
```
@import "tailwindcss";
@import "tw-animate-css";
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

:root {
  --radius: 0.5rem;
  --content-max-width: 1200px;
  --content-max-width-sm: 640px;
  --content-max-width-md: 768px;
  --content-max-width-lg: 1024px;
  --content-max-width-xl: 1344px;

  --background: hsl(0 0% 100%);
  --foreground: hsl(0 0% 10%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(0 0% 10%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(0 0% 10%);
  --primary: hsl(210 58% 19%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(210 40% 96%);
  --secondary-foreground: hsl(210 30% 20%);
  --muted: hsl(210 20% 94%);
  --muted-foreground: hsl(210 10% 40%);
  --accent: hsl(28 95% 53%);
  --accent-foreground: hsl(0 0% 100%);
  --destructive: hsl(0 84.2% 60.2%);
  --border: hsl(210 15% 85%);
  --input: hsl(220 60% 97%);
  --ring: hsl(210 58% 19%);
  --chart-1: hsl(12 76% 61%);
  --chart-2: hsl(173 58% 39%);
  --chart-3: hsl(197 37% 24%);
  --chart-4: hsl(43 74% 66%);
  --chart-5: hsl(27 87% 67%);
  --sidebar: hsl(0 0% 100%);
  --sidebar-foreground: hsl(0 0% 10%);
  --sidebar-primary: hsl(210 58% 19%);
  --sidebar-primary-foreground: hsl(0 0% 100%);
  --sidebar-accent: hsl(210 40% 96%);
  --sidebar-accent-foreground: hsl(210 30% 20%);
  --sidebar-border: hsl(210 15% 85%);
  --sidebar-ring: hsl(210 58% 19%);
}

.dark {
  --background: hsl(0 0% 12%);
  --foreground: hsl(0 0% 96%);
  --card: hsl(215 25% 12%);
  --card-foreground: hsl(0 0% 96%);
  --popover: hsl(0 0% 9%);
  --popover-foreground: hsl(0 0% 96%);
  --primary: hsl(213 25% 78%);
  --primary-foreground: hsl(0 0% 8%);
  --secondary: hsl(0 0% 12%);
  --secondary-foreground: hsl(0 0% 95%);
  --muted: hsl(215 15% 22%);
  --muted-foreground: hsl(0 0% 60%);
  --accent: hsl(28 95% 53%);
  --accent-foreground: hsl(0 0% 100%);
  --destructive: hsl(0 62.8% 40%);
  --border: hsl(180 12% 24%);
  --input: hsl(215 20% 24%);
  --ring: hsl(0 0% 70%);
  --chart-1: hsl(220 70% 50%);
  --chart-2: hsl(160 60% 45%);
  --chart-3: hsl(30 80% 55%);
  --chart-4: hsl(280 65% 60%);
  --chart-5: hsl(340 75% 55%);
  --sidebar: hsl(215 25% 12%);
  --sidebar-foreground: hsl(0 0% 96%);
  --sidebar-primary: hsl(213 25% 78%);
  --sidebar-primary-foreground: hsl(0 0% 8%);
  --sidebar-accent: hsl(0 0% 12%);
  --sidebar-accent-foreground: hsl(0 0% 95%);
  --sidebar-border: hsl(180 12% 24%);
  --sidebar-ring: hsl(0 0% 70%);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
    font-family: 'IBM Plex Sans', 'Inter', 'Roboto', Arial, sans-serif;
  }
}

@layer utilities {
  .toast-dark {
    @apply bg-zinc-900 text-white border-zinc-700;
  }
  .toast-light {
    @apply bg-white text-black border-gray-300;
  }
}

```

---

### ✅ Summary of Changes:

* Replaced all `oklch(...)` color definitions with `hsl(...)` from the  **old file** .
* Preserved `@theme inline`, `@custom-variant`, and other **modern features** from the new structure.
* Added back all the **old utility layers** (like `.toast-dark`, `.toast-light`).
* Re-included the **IBM Plex Sans** font and body font settings.
* Removed unused `oklch()` color definitions to avoid confusion.

Let me know if you'd like this in a file download format or want me to convert the color tokens to Tailwind config.

**Ask ChatGPT**
