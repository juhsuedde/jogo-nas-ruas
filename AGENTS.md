# AGENTS.md

## Dev Commands

```bash
bun dev          # Start dev server
bun run build    # Production build (for Cloudflare)
bun run lint     # ESLint
bun run format   # Prettier
```

## Important Notes

- **Config is handled by Lovable**: `vite.config.ts` uses `@lovable.dev/vite-tanstack-config`. Do NOT add plugins manually (React, Tailwind, TanStack, tsConfigPaths, Cloudflare are already included) - doing so will break the build.

- **Cloudflare deployment**: Entry point is `src/server.ts` (not default). Configured in `wrangler.jsonc`.

- **Environment variables**: Use `.env` (local only, never commit). Supabase env vars required at runtime.

- **Package manager**: Uses Bun. Do not commit `bun.lock`.

- **No test runner configured** currently.
