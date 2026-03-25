import { createFromSource } from "fumadocs-core/search/server"

import { docsSource } from "@/lib/docs/source"

export const dynamic = "force-static"

export const { GET } = createFromSource(docsSource)
