# Architectural Patterns

## State Management — Zustand with Persist

Both stores (`chore-store.ts`, `member-store.ts`) follow the same pattern:

1. Define a `State` interface with data fields and action methods
2. Create store with `create<State>()(persist(...))`
3. Use `partialize` to select which fields persist to localStorage
4. Actions use `get()` for current state and `set()` for immutable updates
5. IDs generated via `crypto.randomUUID()`

Storage keys: `chores-storage`, `members-storage`

**Selectors**: Components access store slices with inline selectors:
```
useChoreStore((s) => s.addChore)
useMemberStore((s) => s.members)
```

## Component Composition

**Container/Presentational split**:
- `CalendarView` is the container — manages navigation state, dialog state, and computes occurrences via `useMemo`
- `MonthView`/`WeekView` are presentational — receive data and callbacks as props
- `DayCell` renders a single day; `ChoreCard` renders a single chore occurrence

**Component hierarchy**: `App > Header + Sidebar + CalendarView > MonthView/WeekView > DayCell > ChoreCard`

**Props interfaces**: Every component defines a `Props` interface (or type) directly above the component. Props are destructured in the function signature.

## Modal/Dialog Pattern

All dialogs (`ChoreDialog`, `ChoreDetails`, `MemberEditDialog`) use the same structure:

1. Props: `open: boolean`, `onClose: () => void`, plus data props
2. Early return: `if (!open) return null`
3. Fixed overlay: `fixed inset-0 z-50 bg-black/50`
4. Content wrapper with `onClick={e => e.stopPropagation()}` to prevent close on inner click
5. Outer overlay `onClick={onClose}` for click-outside-to-close
6. Header with title + X close button (using `lucide-react` X icon)

## Form Pattern

Forms (`ChoreDialog`, `MemberDialog`, `MemberEditDialog`) follow:

1. Local `useState` for each field
2. `useEffect` to reset/populate fields when dialog opens or data changes
3. Controlled inputs with `value` + `onChange`
4. Submit button disabled when required fields are empty
5. `onSubmit` with `e.preventDefault()`, calls store action, then `onClose()`

## Occurrence Computation (not stored)

Chore occurrences are **computed, not persisted**. The flow:
1. `CalendarView` determines date range from current view (month or week)
2. Calls `useChoreStore.getOccurrencesForRange(start, end)`
3. Store iterates chores, calls `expandRecurrence()` for each
4. `expandRecurrence()` (`src/lib/recurrence.ts:14`) uses an increment function map to generate dates within the range
5. Results grouped into `Map<dateString, ChoreOccurrence[]>` in the view components

## Styling Conventions

- **Tailwind utility classes** exclusively — no CSS modules or styled-components
- **`cn()` helper** (`src/lib/utils.ts:4`) for conditional class merging (clsx + twMerge)
- **Design tokens** via `@theme` in `index.css` — use semantic names like `bg-primary`, `text-muted-foreground`
- **Member colors**: `MEMBER_COLORS` array (`src/types/index.ts:30`) provides `{ bg, text, border, dot }` class sets per member
- **Interactive states**: `hover:bg-muted`, `transition-colors`, `cursor-pointer`

## Date Handling

- All dates stored as ISO strings (`yyyy-MM-dd`) in state
- `date-fns` for all date math — no raw Date manipulation
- Calendar grids use `eachDayOfInterval` with `startOfWeek`/`endOfWeek` (Sunday start)
- `format()`, `isToday()`, `isSameMonth()` for display logic

## Event Handling

- `stopPropagation()` used strategically on nested clickable elements (e.g., checkbox inside clickable card)
- Handler naming: `handleSubmit`, `handleDelete`, `handleToggle`
- Parent components pass callbacks down; children invoke them with relevant data
