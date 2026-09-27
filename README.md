# Taplino app

The Taplino tenant dashboard and public tap renderer. Next.js 16 (App Router,
React 19) + Tailwind v4, sharing the marketing site's design language (warm cream
paper, ink text, orange accent, Bricolage Grotesque / Hanken Grotesk).

Two surfaces in one app:

1. **Dashboard** (`/app/*`, auth-gated) — the multi-tenant builder. Manage
   businesses, sites (locations), cards, and build the tap destinations.
2. **Public tap pages** (`/c/[slug]`, `/p/[slug]`) — what a customer sees when they
   tap an NFC card. Mobile-first and tuned to feel native on iOS.

## Features

- **Auth** via better-auth (email/password, passkeys, email OTP), cookie sessions.
- **Businesses → locations → cards/pages** with a company switcher.
- **Builders** for the five card types: Google review, digital menu (multilingual,
  live pricing), link hub, vCard, and one-tap wifi.
- **Public renderer** with native touches: wifi QR to join, `.vcf` add-to-contacts,
  smart review routing (send happy customers to Google, capture the rest), and a
  DE/EN/FR/IT language switcher on menus and link hubs.
- **Analytics**, **team/invitations**, **settings**, and **plan/billing** views.

## Local setup

```bash
cp .env.local.example .env.local   # point NEXT_PUBLIC_API_URL at the backend
pnpm install
pnpm dev                           # http://localhost:3310
```

Run the backend (`nfc-card-backend`) alongside it on `http://localhost:3311`.

## Structure

```
src/
  app/
    (dashboard)/        auth guard + shell; /app, /app/cards, /app/pages, ...
    login, register, verify-email, invite/[token]
    c/[slug], p/[slug]  public tap renderer
  components/
    ui.tsx, modal.tsx, page-header.tsx, localized-input.tsx
    builders/           the five content builders + live preview
    public/             the five public views + shell + language switcher
  lib/
    api.ts, auth-client.ts, company.tsx, providers.tsx, i18n.ts, types.ts
```

The dashboard UI is currently authored in English; all customer-facing public
content is fully multilingual (DE/EN/FR/IT) via `LocalizedText`.
