type SeoLandingPage = {
  category: "alternative" | "guide"
  description: string
  evaluationPoints: string[]
  evaluationTitle: string
  eyebrow: string
  heroBody: string
  heroTitle: string
  highlights: string[]
  keywords: string[]
  relatedDocs: Array<{
    href: string
    label: string
  }>
  slug: string
  title: string
  bestFit: string[]
}

export const seoLandingPages = [
  {
    category: "guide",
    description:
      "CalendarCN gives shadcn/ui apps a real scheduling surface with month, week, day, and agenda views plus drag, resize, recurrence, and typed event handlers.",
    evaluationPoints: [
      "Best when your product already uses shadcn/ui and the calendar should inherit that design system.",
      "Good fit if you want installable source code instead of a black-box widget or iframe.",
      "Less useful if you only need a date picker or a static month grid with no direct editing.",
    ],
    evaluationTitle: "How to qualify this use case",
    eyebrow: "Builder guide",
    heroBody:
      "Most shadcn calendar examples stop at date picking. CalendarCN is the path when your app needs actual scheduling behavior: multi-view planning, direct manipulation, typed mutations, and open-code install.",
    heroTitle: "A shadcn calendar that can actually schedule work.",
    highlights: [
      "Install a batteries-included scheduler first, then drop down to primitives when you need more control.",
      "Keep the visual system aligned with the rest of your shadcn app instead of bolting on an alien calendar skin.",
      "Use the same event model across month, week, day, and agenda without forking your UI contracts.",
    ],
    keywords: [
      "shadcn calendar",
      "shadcn scheduler",
      "calendar component for shadcn ui",
    ],
    relatedDocs: [
      { href: "/docs/calendar", label: "Calendar overview" },
      { href: "/docs/calendar/patterns/starter", label: "Starter pattern" },
      { href: "/docs/calendar/api", label: "API reference" },
    ],
    slug: "shadcn-calendar",
    title: "Shadcn Calendar for real scheduling UIs",
    bestFit: [
      "Teams already using shadcn/ui in a React or Next.js product.",
      "Apps that need direct event creation, move, resize, and selection.",
      "Builders who want source-installed components they can own and modify.",
    ],
  },
  {
    category: "guide",
    description:
      "CalendarCN is a React scheduler component for product teams that need direct editing, recurring events, resource lanes, and a controlled state model.",
    evaluationPoints: [
      "Use this when you need a scheduling surface inside an existing product, not a standalone consumer calendar.",
      "The controlled API is a strength if your app already owns validation, persistence, and business rules.",
      "If you need a massive plugin ecosystem before shipping anything, broader incumbents may fit better.",
    ],
    evaluationTitle: "What makes this a scheduler, not just a calendar",
    eyebrow: "Developer use case",
    heroBody:
      "If the user story is 'move work around, resize appointments, switch planning views, and persist those changes into our app', you are shopping for a scheduler component. That is the product shape CalendarCN is built for.",
    heroTitle: "A React scheduler component for products that keep changing.",
    highlights: [
      "Wire `date`, `view`, and `events` into your own state while the calendar handles visible range and interaction UI.",
      "Use one event contract across month, week, day, and agenda so teams can change planning mode without changing data shape.",
      "Start with the scheduler wrapper for evaluation, then move to `CalendarRoot` and `CalendarToolbar` when you need fine control.",
    ],
    keywords: [
      "react scheduler component",
      "react scheduling component",
      "scheduler component react",
    ],
    relatedDocs: [
      { href: "/docs/calendar", label: "Controlled integration model" },
      {
        href: "/docs/calendar/patterns/interactions",
        label: "Direct editing pattern",
      },
      { href: "/docs/calendar/views/week", label: "Week view details" },
    ],
    slug: "react-scheduler-component",
    title: "React scheduler component for shadcn and Next.js apps",
    bestFit: [
      "Internal tools and SaaS surfaces where the calendar is part of a bigger workflow.",
      "Teams that need optimistic move and resize behavior wired into product state.",
      "React and Next.js apps that care about owning the implementation instead of embedding a widget.",
    ],
  },
  {
    category: "guide",
    description:
      "CalendarCN supports drag-and-drop calendar workflows in React with event creation, move, resize, keyboard nudges, and touch interactions.",
    evaluationPoints: [
      "Direct editing matters most when users plan by moving time blocks instead of filling modal forms.",
      "CalendarCN covers mouse, keyboard, and touch interaction paths rather than treating drag and drop as desktop-only polish.",
      "This is the right fit if your product wants typed mutation callbacks instead of internal hidden state.",
    ],
    evaluationTitle: "What to look for in a drag-and-drop calendar",
    eyebrow: "Interaction guide",
    heroBody:
      "A real drag-and-drop calendar is more than pointer movement. It needs preview states, resize handles, keyboard alternatives, touch behavior, and clean mutation payloads. CalendarCN is built around that interaction model.",
    heroTitle: "Drag-and-drop calendar behavior for React products.",
    highlights: [
      "Create blocks by dragging on empty slots, then move or resize them in place.",
      "Keep direct editing accessible with arrow-key moves, resize shortcuts, and focus-managed overlays.",
      "Return every change as a typed operation so your app can validate or persist it on its own terms.",
    ],
    keywords: [
      "drag and drop calendar react",
      "react drag and drop scheduler",
      "react calendar resize events",
    ],
    relatedDocs: [
      {
        href: "/docs/calendar/patterns/interactions",
        label: "Interactions pattern",
      },
      { href: "/docs/calendar/views/day", label: "Day view" },
      { href: "/docs/calendar/views/week", label: "Week view" },
    ],
    slug: "drag-and-drop-calendar-react",
    title: "Drag and drop calendar in React with typed event operations",
    bestFit: [
      "Scheduling flows where users expect to manipulate events directly on the calendar surface.",
      "Teams that need consistent behavior across desktop and touch devices.",
      "Products that want to intercept create, move, and resize requests before persistence.",
    ],
  },
  {
    category: "guide",
    description:
      "CalendarCN handles recurring events in React scheduling UIs while keeping the rendered occurrences tied to one controlled event model.",
    evaluationPoints: [
      "This matters when users think in series while the UI still needs individual visible occurrences.",
      "Recurring support is most valuable when month, week, day, and agenda must all stay in sync.",
      "If your recurrence rules are extremely specialized, you still own persistence and can extend the surrounding workflow.",
    ],
    evaluationTitle: "Why recurring events change the implementation",
    eyebrow: "Planning guide",
    heroBody:
      "Recurring events become painful when different views drift or when edits lose the relationship between the source event and visible occurrences. CalendarCN keeps recurrence inside the same scheduling surface and event contract.",
    heroTitle: "Recurring events without a second calendar model.",
    highlights: [
      "Expand recurring events for the visible range while keeping source-event context in the interaction payloads.",
      "Use the same scheduling surface for one-off blocks and repeating series.",
      "Keep recurrence, selection, and follow-up actions aligned across every exported view.",
    ],
    keywords: [
      "react calendar recurring events",
      "recurring events react scheduler",
      "react recurrence calendar component",
    ],
    relatedDocs: [
      { href: "/docs/calendar", label: "Calendar overview" },
      { href: "/calendar-lab/recurrence", label: "Recurrence demo" },
      { href: "/docs/calendar/api", label: "Typed scheduling API" },
    ],
    slug: "react-calendar-recurring-events",
    title: "React calendar with recurring events for scheduling products",
    bestFit: [
      "Team calendars and planning surfaces where repeated work should behave like first-class schedule data.",
      "Apps that need recurring occurrences rendered consistently across multiple views.",
      "Builders who want recurrence in the component layer but persistence rules in application code.",
    ],
  },
  {
    category: "guide",
    description:
      "CalendarCN supports resource scheduling in React with parallel lanes for teams, rooms, staff, or calendars while keeping the same editing model.",
    evaluationPoints: [
      "Resource lanes matter when the same scheduling interactions repeat across people, rooms, or calendars.",
      "The right component should preserve create, move, and resize behavior across every lane instead of inventing a second model.",
      "CalendarCN is strongest when resources are part of a broader product workflow, not an isolated dispatch system.",
    ],
    evaluationTitle: "How to evaluate resource scheduling UI",
    eyebrow: "Resource guide",
    heroBody:
      "When your schedule spans staff, rooms, or parallel calendars, the UI needs lanes without changing the interaction model. CalendarCN lets you keep one editing surface and one event contract across those resources.",
    heroTitle: "Resource scheduling for teams, rooms, and parallel calendars.",
    highlights: [
      "Render resources as lanes while keeping direct editing and view switching consistent.",
      "Filter or scope calendars without rebuilding the schedule UI for each resource type.",
      "Use the same event model for single-lane planning and resource-aware views.",
    ],
    keywords: [
      "resource scheduling react",
      "react resource calendar",
      "staff scheduling component react",
    ],
    relatedDocs: [
      {
        href: "/docs/calendar/patterns/resources",
        label: "Resource lanes pattern",
      },
      { href: "/docs/calendar/views/agenda", label: "Agenda view" },
      { href: "/docs/calendar/api", label: "Resource-aware API" },
    ],
    slug: "resource-scheduling-react",
    title: "Resource scheduling in React with shared calendar interactions",
    bestFit: [
      "Products scheduling by staff, team, room, or calendar lane.",
      "Interfaces where users need to compare parallel availability quickly.",
      "Apps that want resource lanes without abandoning a shadcn-native UI.",
    ],
  },
  {
    category: "alternative",
    description:
      "CalendarCN is a FullCalendar alternative for React teams that want source-installed calendar code, shadcn/ui fit, and a product-first controlled integration model.",
    evaluationPoints: [
      "Choose CalendarCN when owning the React implementation and matching your design system matters more than a huge plugin catalog.",
      "Choose FullCalendar when you need its mature ecosystem, broad integrations, or specific premium modules immediately.",
      "CalendarCN is the better story for teams that want a shadcn-native scheduler inside an existing product surface.",
    ],
    evaluationTitle: "Where this differs from FullCalendar",
    eyebrow: "Comparison page",
    heroBody:
      "FullCalendar is the incumbent and it is broad. CalendarCN is narrower on purpose: open React code, shadcn-native styling, and a scheduling surface built for teams embedding calendar behavior into a product.",
    heroTitle: "A FullCalendar alternative for shadcn-native React apps.",
    highlights: [
      "Source-installed components fit teams that want to inspect and modify the calendar directly.",
      "The interaction model is designed around controlled React state and typed callbacks.",
      "Design-system alignment is a core feature instead of an afterthought.",
    ],
    keywords: [
      "fullcalendar alternative react",
      "fullcalendar alternative",
      "shadcn calendar alternative fullcalendar",
    ],
    relatedDocs: [
      { href: "/docs/calendar", label: "Calendar overview" },
      {
        href: "/docs/calendar/patterns/starter",
        label: "Starter install path",
      },
      {
        href: "/docs/calendar/patterns/interactions",
        label: "Direct editing pattern",
      },
    ],
    slug: "fullcalendar-alternative",
    title: "FullCalendar alternative for source-installed React scheduling",
    bestFit: [
      "React teams that want an installable codebase instead of a more opaque integration layer.",
      "Products that care about shadcn/ui fit and typed callbacks over plugin breadth.",
      "Builders comparing incumbents before committing to a scheduling stack.",
    ],
  },
  {
    category: "alternative",
    description:
      "CalendarCN is a react-big-calendar alternative for teams that want stronger design-system fit, direct scheduling interactions, and modern shadcn-first presentation.",
    evaluationPoints: [
      "Choose CalendarCN when the calendar should feel native to a shadcn app rather than styled around an external CSS package.",
      "Choose react-big-calendar when you want the classic baseline and are comfortable composing more of the interaction story yourself.",
      "CalendarCN is optimized for product teams that want a stronger out-of-the-box scheduler experience without abandoning control.",
    ],
    evaluationTitle: "Where this differs from react-big-calendar",
    eyebrow: "Comparison page",
    heroBody:
      "react-big-calendar remains a known baseline. CalendarCN aims at a different default: open-code install for shadcn apps, stronger interaction coverage, and a presentation layer that already belongs inside a modern product UI.",
    heroTitle: "A react-big-calendar alternative for modern shadcn apps.",
    highlights: [
      "Start with a more product-shaped scheduler wrapper before dropping to primitives.",
      "Use drag, resize, recurrence, resources, and selection without pulling in a separate CSS visual system.",
      "Keep the calendar aligned with the rest of a shadcn and Next.js codebase.",
    ],
    keywords: [
      "react big calendar alternative",
      "react-big-calendar alternative",
      "react scheduler alternative",
    ],
    relatedDocs: [
      { href: "/docs/calendar", label: "Calendar overview" },
      { href: "/docs/calendar/views/week", label: "Week view" },
      { href: "/docs/calendar/api", label: "Controlled API" },
    ],
    slug: "react-big-calendar-alternative",
    title: "react-big-calendar alternative for shadcn and Next.js products",
    bestFit: [
      "Teams re-evaluating older React calendar defaults.",
      "Products that want a stronger out-of-the-box scheduler feel plus source ownership.",
      "Apps where design-system alignment is part of the decision, not polish for later.",
    ],
  },
] as const satisfies readonly SeoLandingPage[]

export const homepageAudience = {
  bestFit: [
    "React and Next.js teams already shipping with shadcn/ui.",
    "Products embedding scheduling into internal tools, SaaS workflows, or booking surfaces.",
    "Builders who want source-installed calendar code with direct event interactions.",
  ],
  notFor: [
    "Consumer users searching for a standalone calendar app.",
    "Projects that only need a date picker or a static month grid.",
    "Teams optimizing for the largest ecosystem before design-system fit or source ownership.",
  ],
} as const

export const seoLandingPageSlugs = seoLandingPages.map((page) => page.slug)

export function getSeoLandingPage(slug: string) {
  return seoLandingPages.find((page) => page.slug === slug)
}
