import { spawn } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, "..")
const builtRegistryDir = path.join(repoRoot, "public", "r")
const hostedRegistryOrigin = "https://calendarcn.phantomtechind.com/r"

export async function startLocalRegistryServer() {
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

      if (filePath !== rootDir && !filePath.startsWith(rootDir + path.sep)) {
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
            "Registry server exited before becoming ready.",
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

export async function stopLocalRegistryServer(server) {
  if (server.process.exitCode !== null || server.process.killed) {
    return
  }

  await new Promise((resolve) => {
    server.process.once("exit", () => resolve())
    server.process.kill("SIGTERM")
  })
}
