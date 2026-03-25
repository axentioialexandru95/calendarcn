import registry from "@/registry.json"

type RegistryItem = (typeof registry.items)[number]

export function getRegistryItem(name: string): RegistryItem {
  const item = registry.items.find((entry) => entry.name === name)

  if (!item) {
    throw new Error(`Registry item "${name}" was not found.`)
  }

  return item
}

export const calendarRegistryItem = getRegistryItem("calendarcn")
