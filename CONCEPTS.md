# Domain Concepts — Danceflix

Reference document for the project's core concepts and their relationships. Serves as the foundation for typing, data structure, and modeling decisions.

---

## 1. Dance Step (`DanceStep`)

The fundamental domain unit. Represents a teachable movement or technique that can exist independently.

| Attribute | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier (slug used in URL and graph references) |
| `name` | `string` | Step name |
| `description` | `string` | Description of the movement and choreographic intention |
| `youtubeVideos` | `string[]` | List of YouTube video IDs |
| `localVideos` | `VideoSource[]` | List of local videos with optional metadata (camera angle, duration, presenter) |
| `tags` | `string[]` | Keywords for search and grouping |
| `difficulty` | `0–5` | Conceptual/technical complexity of the step — set at creation, never changes with practice |
| `trainingNotes` | `string?` | Free-form training notes (tips, reminders, personal observations) |
| `learningLevel` | `0–5` | Current state of practitioner's mastery — evolves with practice |

**Difference between `difficulty` and `learningLevel`:**
- `difficulty` is a property of the step itself — indicates how objectively complex it is. Never changes.
- `learningLevel` is a property of the practitioner in relation to the step — indicates how much has been internalized. Evolves with practice.

---

## 2. Hub

A Hub is a **special type of Dance Step** — it has all attributes of `DanceStep` and adds graph semantics: it is a central node in the style's mental map.

**A step can be a Hub, but not every step is a Hub.**

Additional attributes beyond `DanceStep`:

| Attribute | Type | Description |
|---|---|---|
| `incomingSteps` | `string[]` | IDs of steps that *arrive at* this hub (entry transitions) |
| `outgoingSteps` | `string[]` | IDs of steps that *leave from* this hub (exit transitions) |
| `icon` | `string` | Visual icon for the node in the graph |
| `color` | `string` | CSS color for visual identity in the graph |

Hubs are the **anchoring points** of `FlowMap`. Non-hub steps can exist in the catalog without appearing in the graph.

---

## 3. Flow

A Flow is an **ordered path through Dance Steps** (hubs or non-hubs), representing a common sequence or reference choreography.

| Attribute | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier |
| `name` | `string` | Descriptive name of the sequence |
| `description` | `string` | Context and intention of the flow |
| `sequence` | `string[]` | Ordered list of step IDs (defines the path in the graph) |
| `difficulty` | `0–5` | Complexity of the sequence as a whole |
| `learningLevel` | `0–5` | Current state of practitioner's mastery for this specific flow |
| `videos` | `VideoSource[]?` | Videos dedicated to demonstrating the complete flow |

A Flow is modeled as a **directed graph**: each element in `sequence` points to the next. The graph can have future branching (alternative sequences).

---

## 4. DanceStyle

Groups everything belonging to a dance style (Zouk, Bachata, Samba…). It's the entry point for all data.

| Attribute | Type | Description |
|---|---|---|
| `id` | `string` | Unique slug (e.g., `'zouk'`) — used in URL and as `styleId` in steps |
| `name` | `string` | Display name (e.g., `'Zouk Brasileiro'`) |
| `description` | `string` | Brief style description |
| `icon` | `string` | Emoji or representative character |
| `color` | `string` | Primary brand color of the style |
| `accentColor` | `string?` | Highlight color for CTAs and active states — defaults to `color` |
| `steps` | `DanceStep[]` | Complete catalog of steps in the style |
| `hubs` | `Hub[]` | Subset of steps that are Hubs (FlowMap nodes) |
| `flows` | `Flow[]` | Reference sequences defined for the style |

---

## Relationships Between Concepts

```
DanceStyle
├── steps[]          → complete list of DanceStep
│     └── (some steps are Hubs)
├── hubs[]           → subset of DanceStep with graph semantics
│     ├── incomingSteps[]  → references to DanceStep.id
│     └── outgoingSteps[]  → references to DanceStep.id
└── flows[]          → Flow
      └── sequence[] → ordered references to DanceStep.id (hubs or not)
```

**A Hub is a DanceStep** — it's not a separate entity. The distinction is that hubs participate in the graph and have directional references to other steps.

**A Flow is a path in the graph** — it references steps by `id`, regardless of whether they are hubs. It can have its own video material.

---

## Modeling Notes

- `difficulty` and `learningLevel` exist both in `DanceStep` and in `Flow`, with the same semantics: objective difficulty vs. subjective practitioner level.
- Training progress (`learningLevel`, `trainingNotes`, review history) should be separated from the step's static data — it lives in `TrainingProgress` persisted in `localStorage`, not in the catalog.
- A step can have multiple video recordings (`VideoSource[]`), including different angles, camera positions, and presenters. Flows can also have dedicated videos showing the complete sequence.
