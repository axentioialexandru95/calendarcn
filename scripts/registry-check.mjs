import { spawn, spawnSync } from "node:child_process"
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, "..")
const sourceRegistryPath = path.join(repoRoot, "registry.json")
const builtRegistryDir = path.join(repoRoot, "public", "r")
const builtRegistryManifestPath = path.join(builtRegistryDir, "registry.json")

const sourceRegistry = JSON.parse(readFileSync(sourceRegistryPath, "utf8"))
const builtRegistryManifest = JSON.parse(
  readFileSync(builtRegistryManifestPath, "utf8")
)
const builtItems = new Map(
  builtRegistryManifest.items.map((item) => [
    item.name,
    JSON.parse(
      readFileSync(path.join(builtRegistryDir, `${item.name}.json`), "utf8")
    ),
  ])
)
const hostedRegistryOrigin = "https://calendarcn.phantomtechind.com/r"

const userFacingItemNames = [
  "calendar-core",
  "calendar-toolbar",
  "calendar-event-sheet",
  "calendar-interactions",
  "calendar-shortcuts",
  "calendarcn",
]

verifyDisjointUserFacingFiles(sourceRegistry)
verifyRegistryItems(builtItems)
await verifyRegistryMatrix()

console.log("Registry check passed.")

function verifyDisjointUserFacingFiles(registry) {
  const seenPaths = new Map()

  for (const item of registry.items) {
    if (!userFacingItemNames.includes(item.name)) {
      continue
    }

    for (const file of item.files ?? []) {
      const normalizedPath = normalizePath(file.path)
      const owner = seenPaths.get(normalizedPath)

      if (owner) {
        throw new Error(
          `User-facing registry items overlap on ${normalizedPath}: ${owner} and ${item.name}`
        )
      }

      seenPaths.set(normalizedPath, item.name)
    }
  }
}

function verifyRegistryItems(items) {
  for (const [itemName] of items) {
    const installedFiles = collectInstalledFiles(itemName, items)
    const forbiddenImports = new Set()
    const missingImports = new Set()

    for (const [filePath, source] of installedFiles) {
      for (const specifier of collectImportSpecifiers(source)) {
        if (specifier.startsWith("@/")) {
          forbiddenImports.add(`${filePath} -> ${specifier}`)
          continue
        }

        if (!specifier.startsWith(".")) {
          continue
        }

        const resolvedPath = resolveRegistryImport(
          filePath,
          specifier,
          installedFiles
        )

        if (!resolvedPath) {
          missingImports.add(`${filePath} -> ${specifier}`)
        }
      }
    }

    if (forbiddenImports.size > 0 || missingImports.size > 0) {
      const problems = [
        forbiddenImports.size > 0
          ? `Forbidden app-level imports in ${itemName}:\n${Array.from(
              forbiddenImports
            )
              .sort()
              .join("\n")}`
          : "",
        missingImports.size > 0
          ? `Missing local registry files in ${itemName}:\n${Array.from(
              missingImports
            )
              .sort()
              .join("\n")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n")

      throw new Error(problems)
    }
  }
}

function collectInstalledFiles(itemName, items, visited = new Set()) {
  const normalizedItemName = normalizeRegistryDependency(itemName)

  if (visited.has(normalizedItemName)) {
    return new Map()
  }

  const item = items.get(normalizedItemName)

  if (!item) {
    throw new Error(
      `Built registry item "${normalizedItemName}" was not found.`
    )
  }

  visited.add(normalizedItemName)
  const filesByPath = new Map()

  for (const dependencyName of item.registryDependencies ?? []) {
    const dependencyFiles = collectInstalledFiles(
      dependencyName,
      items,
      visited
    )

    for (const [filePath, source] of dependencyFiles) {
      filesByPath.set(filePath, source)
    }
  }

  for (const file of item.files ?? []) {
    filesByPath.set(normalizePath(file.path), file.content ?? "")
  }

  return filesByPath
}

function collectImportSpecifiers(source) {
  const specifiers = []

  for (const match of source.matchAll(/from\s+["']([^"']+)["']/g)) {
    specifiers.push(match[1])
  }

  for (const match of source.matchAll(/import\s*\(\s*["']([^"']+)["']\s*\)/g)) {
    specifiers.push(match[1])
  }

  return specifiers
}

function resolveRegistryImport(fromPath, specifier, filesByPath) {
  const basePath = path.posix.normalize(
    path.posix.join(path.posix.dirname(fromPath), specifier)
  )
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    path.posix.join(basePath, "index.ts"),
    path.posix.join(basePath, "index.tsx"),
    path.posix.join(basePath, "index.js"),
    path.posix.join(basePath, "index.jsx"),
  ]

  return candidates.find((candidate) =>
    filesByPath.has(normalizePath(candidate))
  )
}

async function verifyRegistryMatrix() {
  const matrix = [
    {
      expectedFiles: [
        "components/calendar/root.tsx",
        "components/calendar/views/week.tsx",
      ],
      items: ["calendar-core"],
      name: "calendar-core",
      pageSource: createCorePageSource(),
    },
    {
      expectedFiles: [
        "components/calendar/root.tsx",
        "components/calendar/toolbar.tsx",
      ],
      items: ["calendar-core", "calendar-toolbar"],
      name: "calendar-core+toolbar",
      pageSource: createCoreToolbarPageSource(),
    },
    {
      expectedFiles: [
        "components/calendar/addons/event-sheet/create-sheet.tsx",
        "components/calendar/addons/event-sheet/details-sheet.tsx",
      ],
      items: ["calendar-core", "calendar-event-sheet"],
      name: "calendar-core+event-sheet",
      pageSource: createEventSheetPageSource(),
    },
    {
      expectedFiles: [
        "components/calendar/addons/interactions/context-menu.tsx",
        "components/calendar/addons/interactions/change-confirmation.tsx",
      ],
      items: ["calendar-core", "calendar-interactions"],
      name: "calendar-core+interactions",
      pageSource: createInteractionsPageSource(),
    },
    {
      expectedFiles: ["components/calendar/addons/shortcuts/dialog.tsx"],
      items: ["calendar-core", "calendar-shortcuts"],
      name: "calendar-core+shortcuts",
      pageSource: createShortcutsPageSource(),
    },
    {
      expectedFiles: ["components/calendar/scheduler.tsx"],
      items: ["calendarcn"],
      name: "calendarcn",
      pageSource: createStarterPageSource(),
    },
  ]

  const registryServer = await startRegistryServer()

  try {
    for (const scenario of matrix) {
      smokeInstallRegistryItems(scenario, registryServer.baseUrl)
    }
  } finally {
    await stopRegistryServer(registryServer)
  }
}

function smokeInstallRegistryItems(
  { expectedFiles, items, name, pageSource },
  registryBaseUrl
) {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), `calendarcn-${name}-`))

  try {
    writeBaseApp(tempDir, pageSource)
    installRegistryItems(tempDir, items, registryBaseUrl)

    for (const relativePath of expectedFiles) {
      if (!existsSync(path.join(tempDir, relativePath))) {
        throw new Error(
          `Expected installed file was not written for ${name}: ${relativePath}\nworkspace: ${tempDir}`
        )
      }
    }

    for (const relativePath of ["components/ui/button.tsx", "lib/utils.ts"]) {
      if (existsSync(path.join(tempDir, relativePath))) {
        throw new Error(
          `Registry install unexpectedly wrote app-level shared files for ${name}: ${relativePath}\nworkspace: ${tempDir}`
        )
      }
    }

    runCheckedCommand(
      "pnpm",
      ["install"],
      {
        cwd: tempDir,
        encoding: "utf8",
        env: {
          ...process.env,
          CI: "1",
        },
      },
      `pnpm install failed for ${name}`,
      tempDir
    )

    runCheckedCommand(
      "pnpm",
      ["exec", "tsc", "--noEmit"],
      {
        cwd: tempDir,
        encoding: "utf8",
        env: {
          ...process.env,
          CI: "1",
        },
      },
      `TypeScript build failed for ${name}`,
      tempDir
    )

    runCheckedCommand(
      "pnpm",
      ["exec", "next", "build"],
      {
        cwd: tempDir,
        encoding: "utf8",
        env: {
          ...process.env,
          CI: "1",
        },
      },
      `next build failed for ${name}`,
      tempDir
    )
  } finally {
    rmSync(tempDir, {
      force: true,
      recursive: true,
    })
  }
}

function writeBaseApp(tempDir, pageSource) {
  mkdirSync(path.join(tempDir, "app"), {
    recursive: true,
  })

  writeFileSync(
    path.join(tempDir, "package.json"),
    JSON.stringify(
      {
        name: "calendarcn-registry-smoke",
        private: true,
        packageManager: "pnpm@10.0.0",
        scripts: {
          build: "next build",
        },
        dependencies: {
          next: "16.1.7",
          react: "19.2.4",
          "react-dom": "19.2.4",
        },
        devDependencies: {
          "@types/node": "25.5.0",
          "@types/react": "19.2.14",
          "@types/react-dom": "19.2.3",
          typescript: "5.9.3",
        },
      },
      null,
      2
    )
  )

  writeFileSync(
    path.join(tempDir, "components.json"),
    JSON.stringify(
      {
        $schema: "https://ui.shadcn.com/schema.json",
        style: "radix-vega",
        rsc: true,
        tsx: true,
        tailwind: {
          config: "",
          css: "app/globals.css",
          baseColor: "mist",
          cssVariables: true,
          prefix: "",
        },
        aliases: {
          components: "@/components",
          utils: "@/lib/utils",
          ui: "@/components/ui",
          lib: "@/lib",
          hooks: "@/hooks",
        },
      },
      null,
      2
    )
  )

  writeFileSync(
    path.join(tempDir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          allowJs: false,
          baseUrl: ".",
          esModuleInterop: true,
          incremental: true,
          isolatedModules: true,
          jsx: "preserve",
          lib: ["dom", "dom.iterable", "esnext"],
          module: "esnext",
          moduleResolution: "bundler",
          noEmit: true,
          paths: {
            "@/*": ["./*"],
          },
          plugins: [{ name: "next" }],
          resolveJsonModule: true,
          skipLibCheck: true,
          strict: true,
          target: "ES2017",
        },
        include: [
          "next-env.d.ts",
          "**/*.ts",
          "**/*.tsx",
          ".next/types/**/*.ts",
        ],
        exclude: ["node_modules"],
      },
      null,
      2
    )
  )

  writeFileSync(
    path.join(tempDir, "next-env.d.ts"),
    [
      '/// <reference types="next" />',
      '/// <reference types="next/image-types/global" />',
      "",
      "// This file is auto-generated by Next.js.",
      "",
    ].join("\n")
  )

  writeFileSync(path.join(tempDir, "app", "globals.css"), "")
  writeFileSync(
    path.join(tempDir, "app", "layout.tsx"),
    [
      'import type { ReactNode } from "react"',
      "",
      'import "./globals.css"',
      "",
      "export default function RootLayout({ children }: { children: ReactNode }) {",
      "  return (",
      '    <html lang="en">',
      "      <body>{children}</body>",
      "    </html>",
      "  )",
      "}",
      "",
    ].join("\n")
  )
  writeFileSync(path.join(tempDir, "app", "page.tsx"), pageSource)
}

function installRegistryItems(tempDir, itemNames, registryBaseUrl) {
  const registryItems = itemNames.map((itemName) =>
    `${registryBaseUrl}/${normalizeRegistryDependency(itemName)}.json`
  )

  runCheckedCommand(
    "pnpm",
    [
      "exec",
      "shadcn",
      "add",
      ...registryItems,
      "--cwd",
      tempDir,
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
    `shadcn add failed for ${itemNames.join(", ")}`,
    tempDir
  )
}

async function startRegistryServer() {
  const serverScript = `
    const http = require("node:http")
    const fs = require("node:fs")
    const path = require("node:path")

    const rootDir = path.resolve(process.argv[1])
    const hostedRegistryOrigin = process.argv[2]

    function resolveRequestPath(requestUrl) {
      const url = new URL(requestUrl, "http://127.0.0.1")
      const requestedPath = decodeURIComponent(url.pathname)
      const normalizedPath = requestedPath === "/" ? "registry.json" : requestedPath.replace(/^\\/+/, "")
      const filePath = path.resolve(rootDir, normalizedPath)

      if (
        filePath !== rootDir &&
        !filePath.startsWith(rootDir + path.sep)
      ) {
        return null
      }

      return filePath
    }

    const server = http.createServer((request, response) => {
      const filePath = resolveRequestPath(request.url ?? "/")

      if (!filePath) {
        response.statusCode = 403
        response.end("Forbidden")
        return
      }

      try {
        const stats = fs.statSync(filePath)

        if (!stats.isFile()) {
          throw new Error("Not a file")
        }

        const address = server.address()

        if (!address || typeof address === "string") {
          throw new Error("Server address unavailable")
        }

        const runtimeBaseUrl = "http://127.0.0.1:" + address.port
        const fileContents = fs.readFileSync(filePath, "utf8")
        const rewrittenContents = fileContents.replaceAll(
          hostedRegistryOrigin,
          runtimeBaseUrl
        )

        response.statusCode = 200
        response.setHeader("Content-Type", "application/json; charset=utf-8")
        response.end(rewrittenContents)
      } catch {
        response.statusCode = 404
        response.end("Not found")
      }
    })

    server.listen(0, "127.0.0.1", () => {
      const address = server.address()

      if (!address || typeof address === "string") {
        process.exit(1)
      }

      process.stdout.write(String(address.port) + "\\n")
    })

    function closeServer() {
      server.close(() => process.exit(0))
    }

    process.on("SIGINT", closeServer)
    process.on("SIGTERM", closeServer)
  `

  const serverProcess = spawn(
    process.execPath,
    ["-e", serverScript, builtRegistryDir, hostedRegistryOrigin],
    {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "pipe"],
    }
  )

  let stderr = ""

  serverProcess.stderr.on("data", (chunk) => {
    stderr += chunk.toString()
  })

  const port = await new Promise((resolve, reject) => {
    let stdout = ""

    function cleanup() {
      serverProcess.stdout.off("data", handleStdout)
      serverProcess.off("error", handleError)
      serverProcess.off("exit", handleExit)
    }

    function handleStdout(chunk) {
      stdout += chunk.toString()
      const [line] = stdout.split("\n")

      if (!line) {
        return
      }

      const portNumber = Number(line.trim())

      if (!Number.isFinite(portNumber)) {
        cleanup()
        reject(
          new Error(
            `Registry server emitted an invalid port: ${line.trim() || stdout}`
          )
        )
        return
      }

      cleanup()
      resolve(portNumber)
    }

    function handleError(error) {
      cleanup()
      reject(error)
    }

    function handleExit(code) {
      cleanup()
      reject(
        new Error(
          [
            `Registry server exited before becoming ready.`,
            `exit code: ${String(code)}`,
            stderr.trim() ? `stderr:\n${stderr.trim()}` : "",
          ]
            .filter(Boolean)
            .join("\n\n")
        )
      )
    }

    serverProcess.stdout.on("data", handleStdout)
    serverProcess.on("error", handleError)
    serverProcess.on("exit", handleExit)
  })

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    process: serverProcess,
  }
}

async function stopRegistryServer(server) {
  if (server.process.exitCode !== null || server.process.killed) {
    return
  }

  await new Promise((resolve) => {
    server.process.once("exit", () => resolve())
    server.process.kill("SIGTERM")
  })
}

function runCheckedCommand(command, args, options, message, workspacePath) {
  const result = spawnSync(command, args, options)

  if (result.status === 0) {
    return result
  }

  throw new Error(
    [
      message,
      result.stdout?.trim() ? `stdout:\n${result.stdout.trim()}` : "",
      result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : "",
      `workspace: ${workspacePath}`,
    ]
      .filter(Boolean)
      .join("\n\n")
  )
}

function normalizePath(value) {
  return value.replace(/\\/g, "/")
}

function stripRegistryReference(value) {
  return value.replace(/^@[^/]+\//, "")
}

function normalizeRegistryDependency(value) {
  if (/^https?:\/\//.test(value)) {
    const dependencyUrl = new URL(value)
    const fileName = dependencyUrl.pathname.split("/").pop()

    if (!fileName?.endsWith(".json")) {
      throw new Error(`Registry dependency URL must end with .json: ${value}`)
    }

    return fileName.replace(/\.json$/, "")
  }

  return stripRegistryReference(value)
}

function createCorePageSource() {
  return [
    '"use client"',
    "",
    'import * as React from "react"',
    'import { set } from "date-fns"',
    "",
    'import type { CalendarEvent } from "@/components/calendar/types"',
    'import { CalendarRoot } from "@/components/calendar/root"',
    "",
    'const seedDate = new Date("2026-03-24T09:00:00.000Z")',
    "const seedEvents: CalendarEvent[] = [",
    "  {",
    '    id: "standup",',
    '    title: "Studio standup",',
    "    start: set(seedDate, { hours: 9, minutes: 0 }),",
    "    end: set(seedDate, { hours: 9, minutes: 30 }),",
    '    color: "#2563eb",',
    "  },",
    "]",
    "",
    "export default function Page() {",
    "  const [events] = React.useState(seedEvents)",
    "",
    '  return <CalendarRoot date={seedDate} events={events} view="week" />',
    "}",
    "",
  ].join("\n")
}

function createCoreToolbarPageSource() {
  return [
    '"use client"',
    "",
    'import * as React from "react"',
    'import { set } from "date-fns"',
    "",
    'import type { CalendarEvent, CalendarView } from "@/components/calendar/types"',
    'import { CalendarRoot } from "@/components/calendar/root"',
    'import { CalendarToolbar } from "@/components/calendar/toolbar"',
    'import { getRangeLabel, shiftDate } from "@/components/calendar/utils"',
    "",
    'const seedDate = new Date("2026-03-24T09:00:00.000Z")',
    "const seedEvents: CalendarEvent[] = [",
    "  {",
    '    id: "standup",',
    '    title: "Studio standup",',
    "    start: set(seedDate, { hours: 9, minutes: 0 }),",
    "    end: set(seedDate, { hours: 9, minutes: 30 }),",
    '    color: "#2563eb",',
    "  },",
    "]",
    "",
    "export default function Page() {",
    "  const [date, setDate] = React.useState(seedDate)",
    '  const [view, setView] = React.useState<CalendarView>("week")',
    "  const currentLabel = React.useMemo(() => getRangeLabel(date, view), [date, view])",
    "",
    "  return (",
    "    <div>",
    "      <CalendarToolbar",
    "        activeResourceIds={[]}",
    '        availableViews={["month", "week", "day", "agenda"]}',
    "        currentLabel={currentLabel}",
    "        onNavigate={(direction) => setDate((currentDate) => shiftDate(currentDate, view, direction))}",
    "        onToday={() => setDate(seedDate)}",
    "        onViewChange={setView}",
    "        view={view}",
    "      />",
    "      <CalendarRoot date={date} events={seedEvents} view={view} />",
    "    </div>",
    "  )",
    "}",
    "",
  ].join("\n")
}

function createEventSheetPageSource() {
  return [
    '"use client"',
    "",
    'import * as React from "react"',
    'import { set } from "date-fns"',
    "",
    'import type { CalendarCreateOperation, CalendarEvent, CalendarOccurrence } from "@/components/calendar/types"',
    'import { CalendarEventCreateSheet } from "@/components/calendar/addons/event-sheet/create-sheet"',
    'import { CalendarEventDetailsSheet } from "@/components/calendar/addons/event-sheet/details-sheet"',
    'import { CalendarRoot } from "@/components/calendar/root"',
    "",
    'const seedDate = new Date("2026-03-24T09:00:00.000Z")',
    "const seedOccurrence: CalendarOccurrence = {",
    '  id: "standup",',
    '  occurrenceId: "standup",',
    '  sourceEventId: "standup",',
    "  isRecurringInstance: false,",
    "  seriesIndex: 0,",
    '  title: "Studio standup",',
    "  start: set(seedDate, { hours: 9, minutes: 0 }),",
    "  end: set(seedDate, { hours: 9, minutes: 30 }),",
    '  color: "#2563eb",',
    "}",
    "const seedEvents: CalendarEvent[] = [seedOccurrence]",
    "",
    "export default function Page() {",
    "  return (",
    "    <>",
    '      <CalendarRoot date={seedDate} events={seedEvents} view="week" />',
    "      <CalendarEventCreateSheet",
    "        initialOperation={null}",
    "        onOpenChange={() => {}}",
    "        onSubmit={(operation: CalendarCreateOperation) => operation.title}",
    "      />",
    "      <CalendarEventDetailsSheet",
    "        occurrence={null}",
    "        onOpenChange={() => {}}",
    "      />",
    "    </>",
    "  )",
    "}",
    "",
  ].join("\n")
}

function createInteractionsPageSource() {
  return [
    '"use client"',
    "",
    'import * as React from "react"',
    'import { set } from "date-fns"',
    "",
    'import type { CalendarOccurrence } from "@/components/calendar/types"',
    'import { CalendarEventChangeConfirmationDialog } from "@/components/calendar/addons/interactions/change-confirmation"',
    'import { CalendarEventContextMenu } from "@/components/calendar/addons/interactions/context-menu"',
    'import { CalendarRoot } from "@/components/calendar/root"',
    "",
    'const seedDate = new Date("2026-03-24T09:00:00.000Z")',
    "const seedOccurrence: CalendarOccurrence = {",
    '  id: "standup",',
    '  occurrenceId: "standup",',
    '  sourceEventId: "standup",',
    "  isRecurringInstance: false,",
    "  seriesIndex: 0,",
    '  title: "Studio standup",',
    "  start: set(seedDate, { hours: 9, minutes: 0 }),",
    "  end: set(seedDate, { hours: 9, minutes: 30 }),",
    '  color: "#2563eb",',
    "}",
    "",
    "export default function Page() {",
    "  return (",
    "    <>",
    '      <CalendarRoot date={seedDate} events={[seedOccurrence]} view="week" />',
    "      <CalendarEventChangeConfirmationDialog",
    "        context={null}",
    "        onCancel={() => {}}",
    "        onConfirm={() => {}}",
    "      />",
    "      {false ? (",
    "        <CalendarEventContextMenu",
    "          occurrence={seedOccurrence}",
    "          onClose={() => {}}",
    "          x={0}",
    "          y={0}",
    "        />",
    "      ) : null}",
    "    </>",
    "  )",
    "}",
    "",
  ].join("\n")
}

function createShortcutsPageSource() {
  return [
    '"use client"',
    "",
    'import { CalendarKeyboardShortcutsDialog } from "@/components/calendar/addons/shortcuts/dialog"',
    'import { CalendarRoot } from "@/components/calendar/root"',
    "",
    'const seedDate = new Date("2026-03-24T09:00:00.000Z")',
    "",
    "export default function Page() {",
    "  return (",
    "    <>",
    '      <CalendarRoot date={seedDate} events={[]} view="week" />',
    "      <CalendarKeyboardShortcutsDialog onOpenChange={() => {}} open={false} />",
    "    </>",
    "  )",
    "}",
    "",
  ].join("\n")
}

function createStarterPageSource() {
  return [
    '"use client"',
    "",
    'import * as React from "react"',
    'import { set } from "date-fns"',
    "",
    "import type {",
    "  CalendarCreateOperation,",
    "  CalendarEvent,",
    "  CalendarMoveOperation,",
    "  CalendarResizeOperation,",
    "  CalendarView,",
    '} from "@/components/calendar/types"',
    'import { CalendarScheduler } from "@/components/calendar/scheduler"',
    'import { applyMoveOperation, applyResizeOperation, createEventFromOperation } from "@/components/calendar/utils"',
    "",
    'const seedDate = new Date("2026-03-24T09:00:00.000Z")',
    "const seedEvents: CalendarEvent[] = [",
    "  {",
    '    id: "standup",',
    '    title: "Studio standup",',
    "    start: set(seedDate, { hours: 9, minutes: 0 }),",
    "    end: set(seedDate, { hours: 9, minutes: 30 }),",
    '    color: "#2563eb",',
    "  },",
    "]",
    "",
    "export default function Page() {",
    "  const [date, setDate] = React.useState(seedDate)",
    "  const [events, setEvents] = React.useState(seedEvents)",
    '  const [view, setView] = React.useState<CalendarView>("week")',
    "",
    "  function handleCreate(operation: CalendarCreateOperation) {",
    '    setEvents((currentEvents) => [...currentEvents, createEventFromOperation(operation, { title: "New event" })])',
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
    "    <CalendarScheduler",
    "      date={date}",
    "      events={events}",
    "      onDateChange={setDate}",
    "      onEventCreate={handleCreate}",
    "      onEventMove={handleMove}",
    "      onEventResize={handleResize}",
    "      onViewChange={setView}",
    "      view={view}",
    "    />",
    "  )",
    "}",
    "",
  ].join("\n")
}
