# Taplino app conventions

- **Design language** matches the marketing site: `bg-paper` cream, `text-ink`,
  orange `accent` (#f0431f), the `display` utility for headings, `rounded-card`,
  pill buttons, `eyebrow` labels. Reuse `@/components/ui`, `modal`, `page-header`,
  `localized-input`.
- **Data** goes through `@/lib/api` (auto-prefixes `/api/v1`, sends credentials) and
  `@tanstack/react-query`, keyed by the current `companyId` from `@/lib/company`.
- **Auth** via `@/lib/auth-client` (better-auth). Its methods return `{ data, error }`
  and do not throw.
- **Public pages** are mobile-first, `tap-safe`, and themable via `page.theme`.
  Customer-facing content is multilingual (`LocalizedText`, `pickLocalized`).
- **Copy:** never use the em dash character in user-facing text. Use a period or
  comma, or rewrite the sentence.
- **Git:** never commit or push unless explicitly asked in the current request.
