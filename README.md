# CalendarCN

CalendarCN is an open-source, shadcn-compatible calendar registry with month,
week, day, and agenda views, drag and drop, resizing, recurring events, and
typed event contracts.

## License

CalendarCN is released under the [MIT License](./LICENSE).

## Support the project

If CalendarCN helped you, you can support it here:

- [Buy me a coffee](https://buymeacoffee.com/axentioialexandru)

## Install From a Hosted Registry

CalendarCN now ships in two paths:

1. Primitive: `calendar-core` plus small optional add-ons
2. Starter: `calendarcn`, the batteries-included composed scheduler

Add the CalendarCN registry alias once in your app's `components.json`:

```json
{
  "registries": {
    "@calendarcn": "https://calendarcn.phantomtechind.com/r/{name}.json"
  }
}
```

### Primitive install

This is the default path. It keeps the calendar surface and toolbar as separate
open-code files so you can modify them directly.

```bash
npx shadcn@latest add @calendarcn/calendar-core @calendarcn/calendar-toolbar
```

Use it from a client component:

```tsx
"use client"

import { CalendarRoot } from "@/components/calendar/root"
import { CalendarToolbar } from "@/components/calendar/toolbar"
```

### Starter install

Use the starter bundle when you want the current full CalendarCN experience,
including the composed toolbar, event sheets, interaction dialogs, and
shortcuts dialog.

```bash
npx shadcn@latest add @calendarcn/calendarcn
```

Use it from a client component:

```tsx
"use client"

import { CalendarScheduler } from "@/components/calendar/scheduler"
```

## Clone the Reference App

Use the repo directly when you want the docs site, showcase, tests, and a full
reference implementation:

```bash
npx degit axentioialexandru95/calendarcn my-calendarcn-app
cd my-calendarcn-app
pnpm install
pnpm dev
```

## Build the Registry Locally

```bash
pnpm registry:build
```

This generates one JSON file per registry item under `public/r`, plus the
aggregate `public/r/registry.json`.

## Install Locally with shadcn

Build the registry, run the local docs app, and point `@calendarcn` at the
served registry files:

```json
{
  "registries": {
    "@calendarcn": "http://localhost:3000/r/{name}.json"
  }
}
```

Start the local registry host:

```bash
pnpm dev
```

Primitive:

```bash
npx shadcn@latest add @calendarcn/calendar-core @calendarcn/calendar-toolbar
```

Starter:

```bash
npx shadcn@latest add @calendarcn/calendarcn
```

This mirrors the hosted install flow and keeps transitive registry dependencies
working while you test the split primitive items locally.

## Verify the Registry

```bash
pnpm registry:check
```

This rebuilds the registry, verifies dependency closures for every item, checks
that user-facing items do not overwrite each other, and smoke tests `tsc` plus
`next build` across the primitive and starter install matrix.

## Run WebKit Tests From Docker

On rolling distros like Arch, Playwright WebKit can fail on missing system
libraries even when Chromium and Firefox pass. Use the Docker wrapper instead
of trying to satisfy those native deps locally:

```bash
pnpm test:e2e:webkit:docker
```

You can forward normal Playwright filters too:

```bash
pnpm test:e2e:webkit:docker -- tests/e2e/calendar.spec.ts --grep "calendar interactions"
```

The wrapper uses the official Playwright Docker image that matches the locally
installed Playwright version, mounts the repo into the container, and runs the
WebKit project there so Safari coverage is reproducible on unsupported Linux
hosts.

## Use the calendar

```tsx
"use client"

import { CalendarRoot } from "@/components/calendar/root"
import { CalendarToolbar } from "@/components/calendar/toolbar"
```

Or the starter bundle:

```tsx
"use client"

import { CalendarScheduler } from "@/components/calendar/scheduler"
```

The registry items exclude the landing page demo and showcase data on purpose.
