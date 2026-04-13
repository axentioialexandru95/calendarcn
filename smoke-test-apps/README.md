# Smoke Test Apps

This directory holds external-consumer harnesses for CalendarCN.

The current harness is generated into `smoke-test-apps/.work/starter-consumer`
by the root smoke-test script:

```bash
pnpm smoke:starter-consumer
```

What it does:

- creates a fresh minimal Next.js app outside the main docs app
- initializes `shadcn`
- serves the local `public/r` registry through a rewritten local registry server
- installs `calendarcn.json` into the fresh app
- writes a small starter integration page
- runs a production build of that external app

If you want to test the install manually in a separate project, start the local
registry server first:

```bash
pnpm registry:serve:local
```

Then install from the printed local URLs instead of the hosted production URLs.
