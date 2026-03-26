import { spawnSync } from "node:child_process"
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
const registryItemPath = path.join(repoRoot, "public/r/calendarcn.json")
const registryItem = JSON.parse(readFileSync(registryItemPath, "utf8"))

verifyRegistryItem(registryItem)
smokeInstallRegistryItem(registryItemPath)

console.log("Registry check passed.")

function verifyRegistryItem(item) {
  const filesByPath = new Map(
    item.files.map((file) => [normalizePath(file.path), file.content ?? ""])
  )
  const forbiddenImports = new Set()
  const missingImports = new Set()

  for (const [filePath, source] of filesByPath) {
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
        filesByPath
      )

      if (!resolvedPath) {
        missingImports.add(`${filePath} -> ${specifier}`)
      }
    }
  }

  if (forbiddenImports.size > 0 || missingImports.size > 0) {
    const problems = [
      forbiddenImports.size > 0
        ? `Forbidden app-level imports:\n${Array.from(forbiddenImports)
            .sort()
            .join("\n")}`
        : "",
      missingImports.size > 0
        ? `Missing local registry files:\n${Array.from(missingImports)
            .sort()
            .join("\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n")

    throw new Error(problems)
  }
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

function smokeInstallRegistryItem(localRegistryItemPath) {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), "calendarcn-registry-"))

  try {
    mkdirSync(path.join(tempDir, "app"), { recursive: true })

    writeFileSync(
      path.join(tempDir, "package.json"),
      JSON.stringify(
        {
          name: "calendarcn-registry-smoke",
          private: true,
          packageManager: "pnpm@10.0.0",
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
            baseUrl: ".",
            paths: {
              "@/*": ["./*"],
            },
          },
        },
        null,
        2
      )
    )

    writeFileSync(path.join(tempDir, "app", "globals.css"), "")

    const install = spawnSync(
      "pnpm",
      [
        "exec",
        "shadcn",
        "add",
        localRegistryItemPath,
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
      }
    )

    if (install.status !== 0) {
      throw new Error(
        [
          "shadcn add failed during registry smoke test.",
          install.stdout?.trim() ? `stdout:\n${install.stdout.trim()}` : "",
          install.stderr?.trim() ? `stderr:\n${install.stderr.trim()}` : "",
          `workspace: ${tempDir}`,
        ]
          .filter(Boolean)
          .join("\n\n")
      )
    }

    const expectedFiles = [
      "components/calendar/index.ts",
      "components/calendar/internal/lib/utils.ts",
      "components/calendar/internal/ui/button.tsx",
      "components/calendar/internal/utils/calendar/ics.ts",
    ]

    for (const relativePath of expectedFiles) {
      if (!existsSync(path.join(tempDir, relativePath))) {
        throw new Error(
          `Expected installed file was not written: ${relativePath}\nworkspace: ${tempDir}`
        )
      }
    }

    const unexpectedFiles = ["components/ui/button.tsx", "lib/utils.ts"]

    for (const relativePath of unexpectedFiles) {
      if (existsSync(path.join(tempDir, relativePath))) {
        throw new Error(
          `Registry install unexpectedly wrote app-level shared files: ${relativePath}\nworkspace: ${tempDir}`
        )
      }
    }

    const packageJson = JSON.parse(
      readFileSync(path.join(tempDir, "package.json"), "utf8")
    )
    const dependencyNames = new Set([
      ...Object.keys(packageJson.dependencies ?? {}),
      ...Object.keys(packageJson.devDependencies ?? {}),
    ])

    for (const dependency of [
      "@phosphor-icons/react",
      "clsx",
      "date-fns",
      "tailwind-merge",
    ]) {
      if (!dependencyNames.has(dependency)) {
        throw new Error(
          `Missing installed dependency after smoke test: ${dependency}\nworkspace: ${tempDir}`
        )
      }
    }
  } catch (error) {
    console.error(`Registry smoke test workspace preserved at ${tempDir}`)
    throw error
  }

  rmSync(tempDir, { force: true, recursive: true })
}

function normalizePath(value) {
  return value.replace(/\\/g, "/")
}
