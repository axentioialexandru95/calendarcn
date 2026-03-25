import { readFile } from "node:fs/promises"
import path from "node:path"

export async function readSourceFile(filePath: string) {
  const absolutePath = path.join(process.cwd(), filePath)
  const source = await readFile(absolutePath, "utf8")

  return source.trimEnd()
}
