import registry from "@/registry.json"

type RegistryItem = (typeof registry.items)[number]

export const calendarRegistryNamespace = "@calendarcn"

export function stripRegistryReference(value: string) {
  return value.replace(/^@[^/]+\//, "")
}

export function toCalendarRegistryReference(value: string) {
  return `${calendarRegistryNamespace}/${stripRegistryReference(value)}`
}

export function getRegistryItem(name: string): RegistryItem {
  const normalizedName = stripRegistryReference(name)
  const item = registry.items.find((entry) => entry.name === normalizedName)

  if (!item) {
    throw new Error(`Registry item "${normalizedName}" was not found.`)
  }

  return item
}

export const calendarCoreRegistryItem = getRegistryItem("calendar-core")
export const calendarToolbarRegistryItem = getRegistryItem("calendar-toolbar")
export const calendarRegistryItem = getRegistryItem("calendarcn")
