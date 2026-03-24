export type CalendarCnThemeName = "theme-white" | "theme-dark"

type CalendarCnThemeDefinition = {
  caption: string
  label: string
  mode: "light" | "dark"
  name: CalendarCnThemeName
}

export const DEFAULT_CALENDARCN_THEME: CalendarCnThemeName = "theme-white"

export const calendarCnThemes = [
  {
    name: "theme-white",
    label: "White",
    caption: "A bright product page with soft warm highlights and clean cards.",
    mode: "light",
  },
  {
    name: "theme-dark",
    label: "Dark",
    caption: "A darker workspace treatment with stronger contrast for the live scheduler.",
    mode: "dark",
  },
] satisfies CalendarCnThemeDefinition[]

export const calendarCnThemeNames = calendarCnThemes.map((theme) => theme.name)

export function getCalendarCnThemeDefinition(
  themeName?: string | null
): CalendarCnThemeDefinition {
  return (
    calendarCnThemes.find((theme) => theme.name === themeName) ??
    calendarCnThemes[0]
  )
}

export function toggleCalendarCnTheme(
  themeName?: string | null
): CalendarCnThemeName {
  return themeName === "theme-dark" ? "theme-white" : "theme-dark"
}
