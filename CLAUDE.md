# Office Chores App

A calendar-based chore scheduling and tracking app for teams/offices. Users create team members, assign recurring chores, and track completion on a calendar.

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build**: Vite 7 with `@vitejs/plugin-react`
- **Styling**: Tailwind CSS 4 (via `@tailwindcss/vite` plugin)
- **State**: Zustand 5 with `persist` middleware (localStorage)
- **Dates**: date-fns 4
- **Icons**: lucide-react
- **Utilities**: clsx + tailwind-merge (via `cn()` helper at `src/lib/utils.ts:4`)

## Commands

```bash
npm run dev      # Start dev server (Vite)
npm run build    # Type-check (tsc -b) then build for production
npm run preview  # Preview production build
```

No test framework is configured yet.

## Project Structure

```
src/
├── types/index.ts          # All shared types and constants (Chore, TeamMember, etc.)
├── store/
│   ├── chore-store.ts      # Zustand store: CRUD chores, completions, occurrence expansion
│   └── member-store.ts     # Zustand store: CRUD team members, color assignment
├── lib/
│   ├── recurrence.ts       # Recurrence expansion logic (none/daily/weekly/biweekly/monthly)
│   ├── calendar.ts         # Calendar grid helpers (month days, week days)
│   └── utils.ts            # cn() classname utility
├── components/
│   ├── layout/             # App shell: Header (nav + view toggle), Sidebar (member management)
│   ├── calendar/           # CalendarView > MonthView/WeekView > DayCell > ChoreCard
│   ├── chores/             # ChoreDialog (create/edit form), ChoreDetails (view + actions)
│   └── members/            # MemberList, MemberDialog (add), MemberEditDialog (edit/delete)
├── App.tsx                 # Root component: layout shell with viewMode state
├── main.tsx                # Entry point: StrictMode + createRoot
└── index.css               # Tailwind import + design tokens (@theme)
```

## Key Concepts

- **Chores** have a start date, optional end date, assignee, and recurrence type
- **Occurrences** are computed on-the-fly by `expandRecurrence()` — not stored in state
- **Completions** are stored as a flat `Record<string, boolean>` keyed by `choreId:date`
- **Member colors** are assigned by index into `MEMBER_COLORS` constant (`src/types/index.ts:30`)
- **Path alias**: `@` maps to `src/` (configured in `vite.config.ts:9`)

## Adding New Features or Fixing Bugs

- **New types**: Add to `src/types/index.ts` — all shared types live in one file
- **New state**: Create a Zustand store in `src/store/` following the persist pattern in `chore-store.ts:21`. Define a state interface with data + actions, wrap with `create<State>()(persist(...))`
- **New components**: Place in the appropriate `src/components/` subdirectory. Define a `Props` interface, use functional components with destructured props
- **New dialogs**: Follow the modal pattern (see `.claude/docs/architectural_patterns.md#modaldialog-pattern`) — `open`/`onClose` props, fixed overlay, click-outside-to-close, stopPropagation on content
- **New date logic**: Use `date-fns` — keep dates as `yyyy-MM-dd` strings in state, convert to `Date` objects only for computation
- **Styling**: Use Tailwind utilities and `cn()` for conditional classes. Use semantic tokens from `src/index.css:3` (e.g., `bg-primary`, `text-muted-foreground`)

## Design Tokens

Custom theme variables are defined in `src/index.css:3` using Tailwind's `@theme` directive. Key tokens: `--color-primary`, `--color-muted`, `--color-border`, `--color-destructive`, `--radius`.

## Additional Documentation

Check these files for deeper context when working on specific areas:

- `.claude/docs/architectural_patterns.md` — State management, component composition, modal/form conventions, styling patterns

## Workflow Rules

- **Always use dev agents** (`subagent_type: "dev"`) for all code changes — edits, new files, bug fixes, feature implementation. Never code directly inline in the main conversation.
- **Auto commit and push** after any code changes without asking the user.
