import { spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

import {
  startLocalRegistryServer,
  stopLocalRegistryServer,
} from "./local-registry-server.mjs"

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, "..")

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
  "Failed to build registry output before starting the local registry server"
)

const server = await startLocalRegistryServer()

console.log(`Local CalendarCN registry: ${server.baseUrl}`)
console.log("")
console.log("Starter install:")
console.log(`npx shadcn@latest add ${server.baseUrl}/calendarcn.json`)
console.log("")
console.log("Primitive install:")
console.log(
  `npx shadcn@latest add ${server.baseUrl}/calendar-core.json ${server.baseUrl}/calendar-toolbar.json`
)
console.log("")
console.log("Press Ctrl+C to stop.")

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    await stopLocalRegistryServer(server)
    process.exit(0)
  })
}

await new Promise(() => {})

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
    ]
      .filter(Boolean)
      .join("\n\n")
  )
}
