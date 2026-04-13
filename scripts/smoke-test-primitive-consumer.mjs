import { spawnSync } from "node:child_process"
import { existsSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import {
  startLocalRegistryServer,
  stopLocalRegistryServer,
} from "./local-registry-server.mjs"

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, "..")
const smokeRoot = path.join(repoRoot, "smoke-test-apps")
const workRoot = path.join(smokeRoot, ".work")
const appDir = path.join(workRoot, "primitive-consumer")
const smokePort = process.env.CALENDARCN_SMOKE_PORT ?? "3201"

rmSync(appDir, {
  force: true,
  recursive: true,
})

runCheckedCommand(
  "pnpm",
  [
    "dlx",
    "create-next-app@16.1.7",
    appDir,
    "--ts",
    "--tailwind",
    "--eslint",
    "--app",
    "--use-pnpm",
    "--disable-git",
    "--yes",
  ],
  {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      CI: "1",
    },
  },
  "Failed to create the primitive consumer app with create-next-app"
)

runCheckedCommand(
  "pnpm",
  [
    "exec",
    "shadcn",
    "init",
    "-d",
    "--yes",
    "--force",
    "--silent",
    "--cwd",
    appDir,
  ],
  {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      CI: "1",
    },
  },
  "Failed to initialize shadcn in the primitive consumer app"
)

runCheckedCommand(
  "pnpm",
  ["registry:build"],
  {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      CI: "1",
    },
  },
  "Failed to build registry output before the primitive consumer smoke test"
)

const server = await startLocalRegistryServer()

try {
  runCheckedCommand(
    "pnpm",
    [
      "exec",
      "shadcn",
      "add",
      `${server.baseUrl}/calendar-core.json`,
      `${server.baseUrl}/calendar-toolbar.json`,
      "--cwd",
      appDir,
      "--yes",
      "--overwrite",
      "--silent",
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        CI: "1",
      },
    },
    "Failed to install CalendarCN primitive items into the consumer app"
  )
} finally {
  await stopLocalRegistryServer(server)
}

writeSmokeTestPage(resolveAppPagePath(appDir))

runCheckedCommand(
  "pnpm",
  ["install"],
  {
    cwd: appDir,
    encoding: "utf8",
    env: {
      ...process.env,
      CI: "1",
    },
  },
  "Failed to install dependencies after adding CalendarCN primitives"
)

runCheckedCommand(
  "pnpm",
  ["exec", "next", "build"],
  {
    cwd: appDir,
    encoding: "utf8",
    env: {
      ...process.env,
      CI: "1",
    },
  },
  "Failed to build the primitive consumer app after installing CalendarCN"
)

console.log("Primitive consumer smoke app is ready.")
console.log(`App directory: ${appDir}`)
console.log(
  `Start it with: cd ${appDir} && pnpm exec next start --hostname 127.0.0.1 --port ${smokePort}`
)
console.log("What this verified:")
console.log("- create-next-app bootstrap")
console.log("- shadcn project initialization")
console.log("- CalendarCN primitive install from a local registry server")
console.log("- dependency resolution")
console.log("- production build of the external consumer app")

function resolveAppPagePath(targetDir) {
  const sourcePagePath = path.join(targetDir, "src", "app", "page.tsx")

  if (existsSync(sourcePagePath)) {
    return sourcePagePath
  }

  return path.join(targetDir, "app", "page.tsx")
}

function writeSmokeTestPage(filePath) {
  writeFileSync(
    filePath,
    [
      '"use client"',
      "",
      'import * as React from "react"',
      "",
      "import type {",
      "  CalendarCreateOperation,",
      "  CalendarEvent,",
      "  CalendarMoveOperation,",
      "  CalendarResizeOperation,",
      "  CalendarView,",
      '} from "@/components/calendar/types"',
      'import { CalendarRoot } from "@/components/calendar/root"',
      'import { CalendarToolbar } from "@/components/calendar/toolbar"',
      "import {",
      "  applyMoveOperation,",
      "  applyResizeOperation,",
      "  createEventFromOperation,",
      "  getRangeLabel,",
      "  shiftDate,",
      '} from "@/components/calendar/utils"',
      "",
      'const seedDate = new Date("2026-04-13T09:00:00.000Z")',
      "",
      "const seedEvents: CalendarEvent[] = [",
      "  {",
      '    id: "kickoff",',
      '    title: "Kickoff",',
      '    start: new Date("2026-04-13T09:00:00.000Z"),',
      '    end: new Date("2026-04-13T10:00:00.000Z"),',
      '    color: "#2563eb",',
      "  },",
      "  {",
      '    id: "design-review",',
      '    title: "Design review",',
      '    start: new Date("2026-04-13T11:00:00.000Z"),',
      '    end: new Date("2026-04-13T12:30:00.000Z"),',
      '    color: "#db2777",',
      "  },",
      "  {",
      '    id: "customer-call",',
      '    title: "Customer call",',
      '    start: new Date("2026-04-14T14:00:00.000Z"),',
      '    end: new Date("2026-04-14T15:00:00.000Z"),',
      '    color: "#0891b2",',
      "  },",
      "]",
      "",
      "export default function Page() {",
      "  const [date, setDate] = React.useState(seedDate)",
      "  const [events, setEvents] = React.useState(seedEvents)",
      "  const [selectedEventId, setSelectedEventId] = React.useState<string>()",
      '  const [view, setView] = React.useState<CalendarView>("week")',
      "",
      "  React.useEffect(() => {",
      "    if (window.innerWidth < 640) {",
      '      setView("day")',
      "    }",
      "  }, [])",
      "  const currentLabel = React.useMemo(",
      "    () => getRangeLabel(date, view),",
      "    [date, view]",
      "  )",
      "",
      "  function handleCreate(operation: CalendarCreateOperation) {",
      "    setEvents((currentEvents) => [",
      "      ...currentEvents,",
      "      createEventFromOperation(operation, {",
      '        title: "New event",',
      '        color: "#2563eb",',
      "      }),",
      "    ])",
      "  }",
      "",
      "  function handleMove(operation: CalendarMoveOperation) {",
      "    setEvents((currentEvents) => applyMoveOperation(currentEvents, operation))",
      "  }",
      "",
      "  function handleResize(operation: CalendarResizeOperation) {",
      "    setEvents((currentEvents) => applyResizeOperation(currentEvents, operation))",
      "  }",
      "",
      "  return (",
      '    <main className="min-h-screen bg-background px-6 py-10 text-foreground sm:px-10">',
      '      <div className="mx-auto max-w-6xl space-y-6">',
      '        <header className="space-y-2">',
      '          <p className="text-sm font-medium tracking-[0.18em] text-muted-foreground uppercase">',
      "            Smoke Test App",
      "          </p>",
      '          <h1 className="text-3xl font-semibold tracking-tight">',
      "            CalendarCN primitive consumer harness",
      "          </h1>",
      '          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">',
      "            This app verifies the lean install path where the toolbar and the",
      "            calendar surface are composed directly in a fresh external Next.js",
      "            project.",
      "          </p>",
      "        </header>",
      "",
      '        <div className="overflow-hidden rounded-[calc(var(--radius)*1.5)] border border-border/70 bg-card shadow-sm">',
      "          <CalendarToolbar",
      "            activeResourceIds={[]}",
      '            availableViews={["month", "week", "day", "agenda"]}',
      "            currentLabel={currentLabel}",
      "            onNavigate={(direction) => setDate((currentDate) => shiftDate(currentDate, view, direction))}",
      "            onToday={() => setDate(seedDate)}",
      "            onViewChange={setView}",
      "            view={view}",
      "          />",
      "          <CalendarRoot",
      "            date={date}",
      "            events={events}",
      "            onEventCreate={handleCreate}",
      "            onEventMove={handleMove}",
      "            onEventResize={handleResize}",
      "            onSelectedEventChange={setSelectedEventId}",
      '            scrollToTime="08:30"',
      "            selectedEventId={selectedEventId}",
      "            view={view}",
      "          />",
      "        </div>",
      "      </div>",
      "    </main>",
      "  )",
      "}",
      "",
    ].join("\n")
  )
}

function runCheckedCommand(command, args, options, message) {
  const result = spawnSync(command, args, options)

  if (result.status === 0) {
    return result
  }

  throw new Error(
    [
      message,
      result.stdout?.trim() ? `stdout:\n${result.stdout.trim()}` : "",
      result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : "",
      existsSync(appDir) ? `workspace: ${appDir}` : "",
    ]
      .filter(Boolean)
      .join("\n\n")
  )
}
