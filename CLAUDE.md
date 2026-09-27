# Taplino app conventions

- **Design language** matches the marketing site: `bg-paper` cream, `text-ink`,
  blue `accent` (#2f6df0), the `display` utility for headings, `rounded-card`,
  pill buttons, `eyebrow` labels. Reuse `@/components/ui`, `modal`, `page-header`,
  `localized-input`.
- **Data** goes through `@/lib/api` (auto-prefixes `/api/v1`, sends credentials) and
  `@tanstack/react-query`, keyed by the current `companyId` from `@/lib/company`.
- **Auth** via `@/lib/auth-client` (better-auth). Its methods return `{ data, error }`
  and do not throw.
- **Page builders are shared with the admin console.** `components/builders/*`,
  `components/localized-input.tsx`, `components/ui.tsx`, `lib/page-content.ts`, `lib/i18n.ts`
  and `lib/utils.ts` are copied into nfc-card-admin by its `pnpm sync:builders`. Keep them
  free of app-only imports (company context, permissions, API) so the copy still builds.
- **Public pages** are mobile-first, `tap-safe`, and themable via `page.theme`.
  Customer-facing content is multilingual (`LocalizedText`, `pickLocalized`).
- **Copy:** never use the em dash character in user-facing text. Use a period or
  comma, or rewrite the sentence.
- **Git:** never commit or push unless explicitly asked in the current request.
