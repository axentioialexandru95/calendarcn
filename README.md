# CalendarCN

CalendarCN is a shadcn-compatible calendar registry item with month, week, day, and agenda views, drag and drop, resizing, and typed event contracts.

## Build the registry

```bash
pnpm registry:build
```

This generates `public/r/calendarcn.json` and `public/r/registry.json`.

## Install locally with shadcn

```bash
npx shadcn@latest add ./public/r/calendarcn.json
```

The CLI supports local registry JSON files directly, so you can test the install flow before hosting the registry.

## Install from a hosted registry

After deploying this app, the same file will be available at `/r/calendarcn.json`:

```bash
npx shadcn@latest add https://your-domain.com/r/calendarcn.json
```

If you want a namespace-style command, add the registry to your target app's `components.json`:

```json
{
  "registries": {
    "@calendarcn": "https://your-domain.com/r/{name}.json"
  }
}
```

Then install with:

```bash
npx shadcn@latest add @calendarcn/calendarcn
```

## Use the calendar

```tsx
import { CalendarRoot } from "@/components/calendar"
```

The registry item installs the reusable calendar source only. The landing page demo and showcase data are intentionally excluded.
