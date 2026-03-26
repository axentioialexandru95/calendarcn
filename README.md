# CalendarCN

CalendarCN is an open-source, shadcn-compatible calendar registry item with month, week, day, and agenda views, drag and drop, resizing, recurring events, and typed event contracts.

## License

CalendarCN is released under the [MIT License](./LICENSE).

## Support the project

If CalendarCN helped you, you can support it here:

- [Buy me a coffee](https://buymeacoffee.com/phantomtechind)

## Install from a hosted registry

The fastest way to add CalendarCN to an existing app is the hosted registry
item:

```bash
npx shadcn@latest add https://calendarcn.phantomtechind.com/r/calendarcn.json
```

The registry item installs the full self-contained calendar source under
`components/calendar`.

## Optional Alias Shortcut

If your team wants a shorter project-local alias, add it once in that app's
`components.json`:

```json
{
  "registries": {
    "@calendarcn": "https://calendarcn.phantomtechind.com/r/{name}.json"
  }
}
```

Then you can use:

```bash
npx shadcn@latest add @calendarcn/calendarcn
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

This generates `public/r/calendarcn.json` and `public/r/registry.json`.

## Install Locally with shadcn

```bash
npx shadcn@latest add ./public/r/calendarcn.json
```

The CLI supports local registry JSON files directly, so you can test the install flow before hosting the registry.

## Verify the Registry

```bash
pnpm registry:check
```

This rebuilds the registry, verifies the item is self-contained, and smoke
tests installation into a temporary app.

## Use the calendar

```tsx
import { CalendarRoot } from "@/components/calendar"
```

The registry item excludes the landing page demo and showcase data on purpose.
