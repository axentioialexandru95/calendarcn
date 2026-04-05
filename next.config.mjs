import { createMDX } from "fumadocs-mdx/next"

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  async redirects() {
    return [
      {
        source: "/docs/components",
        destination: "/docs/calendar",
        permanent: true,
      },
      {
        source: "/docs/components/calendar",
        destination: "/docs/calendar",
        permanent: true,
      },
      {
        source: "/docs/components/calendar/starter",
        destination: "/docs/calendar/patterns/starter",
        permanent: true,
      },
      {
        source: "/docs/components/calendar/workweek",
        destination: "/docs/calendar/patterns/workweek",
        permanent: true,
      },
      {
        source: "/docs/components/calendar/resources",
        destination: "/docs/calendar/patterns/resources",
        permanent: true,
      },
      {
        source: "/docs/components/calendar/interactions",
        destination: "/docs/calendar/patterns/interactions",
        permanent: true,
      },
      {
        source: "/docs/components/calendar/month",
        destination: "/docs/calendar/views/month",
        permanent: true,
      },
      {
        source: "/docs/components/calendar/week",
        destination: "/docs/calendar/views/week",
        permanent: true,
      },
      {
        source: "/docs/components/calendar/day",
        destination: "/docs/calendar/views/day",
        permanent: true,
      },
      {
        source: "/docs/components/calendar/agenda",
        destination: "/docs/calendar/views/agenda",
        permanent: true,
      },
    ]
  },
}

export default withMDX(nextConfig)
