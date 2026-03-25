import { CodePanel } from "@/components/docs/code-panel"

export function CodeSnippet({
  code,
  fileName,
}: {
  code: string
  fileName?: string
}) {
  return (
    <div className="not-prose my-6">
      <CodePanel code={code} fileName={fileName} />
    </div>
  )
}
