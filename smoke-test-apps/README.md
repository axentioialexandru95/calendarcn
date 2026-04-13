# Smoke Test Apps

This directory holds external-consumer harnesses for CalendarCN.

The harnesses are generated into `smoke-test-apps/.work/*` by the root smoke
scripts:

```bash
pnpm smoke:starter-consumer
pnpm smoke:primitive-consumer
```

The starter harness:

- creates a fresh minimal Next.js app outside the main docs app
- initializes `shadcn`
- serves the local `public/r` registry through a rewritten local registry server
- installs `calendarcn.json` into the fresh app
- writes a small starter integration page
- runs a production build of that external app

The primitive harness does the same thing, but installs:

- `calendar-core.json`
- `calendar-toolbar.json`

and wires `CalendarRoot` and `CalendarToolbar` directly in the external app.

If you want to test the install manually in a separate project, start the local
registry server first:

```bash
pnpm registry:serve:local
```

Then install from the printed local URLs instead of the hosted production URLs.
