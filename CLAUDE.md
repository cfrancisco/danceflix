# Danceflix

Personal dance step library with videos, training system, and mental flow map between steps. Supports multiple styles: Zouk, Bachata, and Samba.

Hosted via GitHub Pages (`npm run deploy`).

---

## Working Mode

**Always enter plan mode before implementing any changes.** Before writing or editing code, think through the approach, list the affected files, and confirm the plan with the user. Only start coding after the plan is agreed upon.
- 
You don't need check in the preview mode if everything is correct, just provide the code. The user will check and ask for changes if needed. 

---

## Stack

- **Vite + React 19 + TypeScript**
- **Tailwind CSS v4** via Vite plugin (`@tailwindcss/vite`) — no `tailwind.config.js`, theme in `src/index.css` with `@theme {}`
- **React Router v7** with `HashRouter` (URLs `#/...`)
- **Framer Motion** — route animations (`AnimatePresence`) and viewport entry (`AnimatedSection`); always use animations when creating new components or pages
- **@xyflow/react** installed, not used yet — candidate to replace manual SVG in `FlowMapGraph`

---

## Structure

```
src/
├── App.tsx                  HashRouter + StyleProvider + AnimatePresence on routes
├── main.tsx                 Entry point
├── index.css                Tailwind v4 + @theme + global utilities (.page-wrap, .text-rainbow)
├── types.ts                 SOURCE OF TRUTH for all types (DanceStep, Hub, Flow, DanceStyle, TrainingProgress…)
├── context/
│   └── StyleContext.tsx     StyleProvider + useActiveStyle() — global active style
├── data/
│   ├── videos.ts            Backward-compat shim → re-exports from registry
│   ├── registry.ts          Style registry; public API (getAllStyles, getStyleById, getVideoById, getRelatedVideos…)
│   ├── types.ts             Shim → re-exports from src/types.ts (do not modify)
│   └── styles/
│       ├── zouk/
│       │   ├── index.ts     ZoukStyle descriptor (injects styleId into steps)
│       │   ├── steps.ts     Zouk step catalog (no styleId — stays clean)
│       │   └── flowMap.ts   zoukHubs[] and zoukFlows[]
│       ├── bachata/
│       │   ├── index.ts
│       │   ├── videos.ts    (legacy filename — equivalent to steps.ts, should be updated as soon as possible)
│       │   └── flowMap.ts
│       └── samba/
│           ├── index.ts
│           ├── videos.ts   (legacy filename — equivalent to steps.ts, should be updated as soon as possible)
│           └── flowMap.ts
├── components/
│   ├── AnimatedSection.tsx  Framer-motion wrapper (fade-in on viewport entry)
│   ├── CategoryTag.tsx      Category badge
│   ├── FlowMapGraph.tsx     Interactive SVG graph (renders hubs and flows of active style)
│   ├── Navbar.tsx           Sticky navigation bar with search
│   ├── RelatedVideos.tsx    Grid of related steps
│   ├── StyleSelector.tsx    Active style selector (Zouk / Bachata / Samba)
│   ├── TrainingPanel.tsx    Individual step training progress panel
│   └── VideoCard.tsx        Step card (thumbnail, level, category)
│   (each component has its .css file alongside)
├── hooks/
│   └── useTraining.ts       Training state persisted in localStorage
└── pages/
    ├── Home.tsx             Hero + category filter + step grid
    ├── VideoDetail.tsx      Player + TrainingPanel + RelatedVideos
    ├── TrainingQueue.tsx    All steps ordered by training priority
    └── FlowMap.tsx          Mental map: "list" view (hubs) and "network" view (SVG graph)
    (each page has its .css file alongside)
```

> See also `CONCEPTS.md` for conceptual domain modeling (DanceStep, Hub, Flow, DanceStyle).

---

## Data Model

All types live in `src/types.ts`. `src/data/types.ts` is just a re-export shim.

```ts
type Level = 0 | 1 | 2 | 3 | 4 | 5
// Used for both difficulty (step property) and learningLevel (practitioner progress)

type StepCategory =
  | 'Base e Deslocamento' | 'Abertura' | 'Giros e Dinâmicas'
  | 'Pêndulos' | 'Movimentos de Tronco e Cabeça'
  | 'Conexões e Estilizações' | 'Finalizações' | 'All'

interface VideoSource {
  label?: string
  youtubeId?: string
  videoUrl?: string
  duration?: string   // overrides step's default duration
}

interface DanceStep {
  id: string             // slug used in URL (/video/:id)
  styleId?: string       // injected by style descriptor
  name: string
  description: string
  youtubeVideos: string[]  // YouTube IDs (embed + thumbnail)
  localVideos: VideoSource[]
  thumbnail?: string     // manual fallback; defaults to first YouTube thumbnail
  duration?: string
  category: string       // StepCategory value
  tags: string[]
  difficulty: Level      // objective step complexity — never changes
  technicalDetails?: string
}

interface Hub {
  stepId: string         // must equal a DanceStep.id
  icon: string
  color: string
  notes?: string
  incomingSteps: string[]   // stepIds of hubs flowing into here
  outgoingSteps: string[]   // stepIds of hubs flowing out from here
}

interface Flow {
  id: string
  name: string
  description: string
  sequence: string[]    // ordered stepIds
  difficulty: Level
  videos?: VideoSource[]
}

interface DanceStyle {
  id: string
  name: string
  description: string
  icon: string
  color: string
  accentColor?: string   // CTA color; defaults to color
  steps: DanceStep[]
  hubs: Hub[]
  flows: Flow[]
}

interface TrainingProgress {
  stepId: string
  timesReviewed: number
  learningLevel: Level   // practitioner's current mastery (evolves with practice)
  lastReviewedAt: string
  notes?: string
}
```

**Difference: `difficulty` vs `learningLevel`:**
- `difficulty` is an objective step property. Set at creation, never changes.
- `learningLevel` lives in `TrainingProgress`. Represents practitioner's current mastery. Evolves with practice.

---

## Dance Style System

Each style is self-contained in `src/data/styles/<id>/`:

| File | Responsibility |
|---|---|
| `index.ts` | Exports `DanceStyle`; injects `styleId` into steps |
| `steps.ts` (or `videos.ts`) | Array `Omit<DanceStep, 'styleId'>[]` — raw data |
| `flowMap.ts` | Exports `<id>Hubs: Hub[]` and `<id>Flows: Flow[]` |

Active style is managed by `StyleContext` (persists in `localStorage` with key `danceflix:activeStyle`). All components needing the style use `useActiveStyle()`.

To register a new style, add to `src/data/registry.ts`:
```ts
import { BachataStyle } from './styles/bachata'
const registeredStyles = [ZoukStyle, BachataStyle, SambaStyle]
```

---

## FlowMap

- `FlowMap.tsx` has two views: **list** (hub cards of active style) and **network** (interactive SVG)
- `FlowMapGraph.tsx` renders pure SVG graph with fixed radial layout (`POSITIONS`)
  - All elements (nodes) should be moved freely
  - HTML overlay tooltip on hover
- Receives `hubs` and `flows` from active style via props

---

## Design System

### Palette (defined in `@theme` in `index.css`)

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#eef2ff` | Global background |
| `--color-bg-card` | `#ffffff` | Card background |
| `--color-navy` | `#1a1d3b` | Primary text, dark backgrounds |
| `--color-navy-soft` | `#2d3163` | Dark secondary text |
| `--color-text` | `#4a4e6b` | Body text |
| `--color-amber` | `#f5a623` | CTA, accent, active hover |
| `--color-amber-dark` | `#e09010` | Amber hover |
| `--color-grad-teal` | `#00c9a7` | Eyebrow labels, green badges |
| `--color-grad-purple` | `#b39ddb` | Rotations category, level 0 |
| `--color-grad-pink` | `#f06292` | Pendulums category, level 1 |
| `--color-grad-blue` | `#4fc3f7` | Opening category, level 3 |
| `--color-grad-yellow` | `#ffd54f` | Torso category, level 2 |
| `--color-grad-green` | `#00e676` | Finishes category |

### Typography

- Single font: **Poppins** (Google Fonts, weights 300–900)
- Components use `const P = "'Poppins', sans-serif"` as local constant (codebase standard)
- Eyebrow labels: `9–10px`, `letter-spacing: 0.45em`, `font-weight: 700`, `text-transform: uppercase`
- Hero headings: `clamp(36px, 7vw, 72px)`, `font-weight: 900`, `letter-spacing: -0.03em`

### Layout

- `.page-wrap`: `max-width: 1024px`, `margin: auto`, `padding: 0 24px` (defined in `index.css`)
- `.text-rainbow`: animated gradient teal → blue → purple → pink with `background-clip: text`

### Inline styles vs Tailwind

Project uses **inline styles for design-specific values** and Tailwind for structural layout utilities (`flex`, `grid`, `gap`, `hidden md:flex`, `sticky`, etc.). Do not use Tailwind classes for colors or typography — use inline CSS tokens or `--color-*` tokens.

### `learningLevel` — colors

| Level | Label | Color |
|---|---|---|
| 0 | Not practiced | `#b39ddb` (purple) |
| 1 | Developing | `#f06292` (pink) |
| 2 | Beginner | `#ffa726` (orange) |
| 3 | Stable | `#4fc3f7` (blue) |
| 4 | Comfortable | `#00c9a7` (teal) |
| 5 | Mastered | `#f5a623` (amber) |

---

## Routes

| Path | Component | Description |
|---|---|---|
| `#/` | `Home` | Hero + filter + grid |
| `#/video/:id` | `VideoDetail` | Player + training panel |
| `#/training` | `TrainingQueue` | Training queue ordered |
| `#/flow-map` | `FlowMap` | Mental map of active style |

---

## Scripts

```bash
npm run dev       # dev server (Vite)
npm run build     # tsc -b && vite build
npm run preview   # serve build locally
npm run deploy    # build + push to gh-pages branch
npm run lint      # ESLint
```

---

## Conventions — what NEVER to do

- **Never use Tailwind classes for colors or typography** — use inline tokens or `--color-*` CSS tokens
- **Never duplicate step data in Hub** — `Hub.stepId` points to `DanceStep`; name, description, difficulty come from the step
- **Never hardcode active style** — use `useActiveStyle()` to access global style, never import a specific style directly in a component
- **Never make inline CSS styles inside HTML elements** — create separate CSS files for each component or page. Keeps code organized and maintainable.
- **Never create unnecessary components** — try to improve existing components first. Avoid component proliferation.

---

## Adding Content

### New step (Zouk)
Edit `src/data/styles/zouk/steps.ts` and add to `zoukSteps` array. Required fields: `id`, `name`, `description`, `category`, `tags`, `difficulty`, `youtubeVideos`, `localVideos`.

### New hub in FlowMap
1. Add entry in `src/data/styles/zouk/flowMap.ts` → `zoukHubs`
2. Add hardcoded position in `src/components/FlowMapGraph.tsx` → `POSITIONS`
3. Reference the hub in `incomingSteps`/`outgoingSteps` of neighboring hubs

### New dance style
1. Create `src/data/styles/<id>/steps.ts`, `flowMap.ts`, `index.ts`
2. Import and add to `src/data/registry.ts` → `registeredStyles`
3. `StepCategory` in `src/types.ts` may need new categories specific to the style