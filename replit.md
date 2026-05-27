# CodeBuddy AI Assistant

A cyber-premium PWA for Turkish coding students. AI explains coding terms in Turkish with SSE streaming, 10-question interactive quizzes, favorites system, quiz score history, and an AI chat interface. Dark Matrix aesthetic (#050605 bg, neon green #00ff41, glassmorphism, JetBrains Mono).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing key

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (artifact: `codebuddy`, preview path `/`)
- API: Express 5 (artifact: `api-server`, path `/api`)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Auth: JWT (`jsonwebtoken`), bcryptjs (pure JS — no native build issues)
- AI: OpenAI via Replit AI integrations (`@workspace/integrations-openai-ai-server`)

## Where things live

- `lib/db/` — Drizzle schema (source of truth for DB tables)
- `lib/api-spec/` — OpenAPI spec (`openapi.yaml`), source of truth for API contract
- `lib/api-client-react/` — Generated React Query hooks (do not edit)
- `lib/api-zod/` — Generated Zod schemas (do not edit)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/codebuddy/src/pages/` — React page components
- `artifacts/codebuddy/src/hooks/use-auth.tsx` — JWT auth context

## Architecture decisions

- SSE endpoints (explain, deepen, chat) use raw `fetch` + ReadableStream on the frontend — NOT the generated hooks, which don't support streaming.
- Auth token stored as `codebuddy_token` in localStorage, passed as `Authorization: Bearer` header.
- `bcryptjs` (pure JS) used instead of `bcrypt` to avoid native build issues in Replit's NixOS sandbox.
- All mutations use `{ data: {...} }` pattern from Orval-generated hooks.
- Chat uses `useListOpenaiMessages(id, options)` where `id` is positional first arg.

## Product

- **Home**: Search any coding term, browse preset categories (React, JS, Python), shortcut to AI Chat
- **Explain**: SSE-streamed AI explanation in Turkish with syntax-highlighted code blocks, Deepen feature, learning roadmap, quiz shortcut, favorites button
- **Quiz**: GPT-generated 10-question multiple-choice quiz for any term, animated feedback per answer, score saved to DB
- **Favorites**: Saved terms with explanation preview, quick re-visit or delete
- **Scores**: Quiz history with average score stats, retry from list
- **Chat**: Multi-conversation SSE AI chat, sidebar for conversation switching

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change before editing frontend pages.
- The API server must be built (`pnpm run build`) before starting — the dev script builds then starts.
- SSE endpoints in Express must use `res.write(...)` in a `for await` loop; do not use `res.json()` for streaming routes.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
