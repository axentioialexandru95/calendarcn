export const siteConfig = {
  description:
    "Open-source scheduling primitives for shadcn/ui apps with month, week, day, and agenda views, drag and drop editing, recurring events, resources, and typed callbacks.",
  name: "CalendarCN",
  registryOrigin: "https://calendarcn.phantomtechind.com/r",
  repoUrl: "https://github.com/axentioialexandru95/calendarcn",
  supportUrl: "https://buymeacoffee.com/axentioialexandru",
  url: "https://calendarcn.phantomtechind.com",
} as const

export const socialPreview = {
  alt: "CalendarCN social preview",
  height: 630,
  path: "/social-preview.png",
  twitterHeight: 600,
  twitterPath: "/social-preview-twitter.png",
  type: "image/png",
  width: 1200,
} as const

export const starterInstallCommand = `npx shadcn@latest add ${siteConfig.registryOrigin}/calendarcn.json`

export const primitiveInstallCommand = [
  "npx shadcn@latest add \\",
  `  ${siteConfig.registryOrigin}/calendar-core.json \\`,
  `  ${siteConfig.registryOrigin}/calendar-toolbar.json`,
].join("\n")

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString()
}
