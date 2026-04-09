import { readFileSync, readdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, "..")
const registrySourcePath = path.join(repoRoot, "registry.json")
const outputDir = path.join(repoRoot, "public", "r")
const publicRegistryOrigin = "https://calendarcn.phantomtechind.com/r"

runCheckedCommand(
  "pnpm",
  ["exec", "shadcn", "build", "registry.json", "-o", "public/r"],
  {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      CI: "1",
    },
  },
  "Failed to build registry output"
)

rewriteHostedRegistryFiles()

function rewriteHostedRegistryFiles() {
  const sourceRegistry = JSON.parse(readFileSync(registrySourcePath, "utf8"))
  const registryNames = new Set(sourceRegistry.items.map((item) => item.name))

  for (const entry of readdirSync(outputDir, {
    withFileTypes: true,
  })) {
    if (!entry.isFile() || path.extname(entry.name) !== ".json") {
      continue
    }

    const filePath = path.join(outputDir, entry.name)
    const json = JSON.parse(readFileSync(filePath, "utf8"))

    if (Array.isArray(json.registryDependencies)) {
      json.registryDependencies = json.registryDependencies.map((dependency) =>
        toHostedRegistryDependency(dependency, registryNames)
      )
    }

    if (typeof json.docs === "string") {
      json.docs = rewriteDocsCommands(json.docs)
    }

    writeFileSync(filePath, `${JSON.stringify(json, null, 2)}\n`)
  }
}

function toHostedRegistryDependency(dependency, registryNames) {
  const normalizedDependency = stripRegistryReference(dependency)

  if (!registryNames.has(normalizedDependency)) {
    return dependency
  }

  return `${publicRegistryOrigin}/${normalizedDependency}.json`
}

function rewriteDocsCommands(value) {
  return value.replace(/npx shadcn@latest add ((?:@calendarcn\/[\w-]+)(?:\s+@calendarcn\/[\w-]+)*)/g, (_match, dependencies) => {
    const urls = dependencies
      .trim()
      .split(/\s+/)
      .map((dependency) =>
        `${publicRegistryOrigin}/${stripRegistryReference(dependency)}.json`
      )
      .join(" ")

    return `npx shadcn@latest add ${urls}`
  })
}

function stripRegistryReference(value) {
  return value.replace(/^@[^/]+\//, "")
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
    ]
      .filter(Boolean)
      .join("\n\n")
  )
}
