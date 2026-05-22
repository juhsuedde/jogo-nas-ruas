# Jogo nas Ruas

Mapa colaborativo de bares, restaurantes e praças transmitindo os jogos da Copa do Mundo.

**https://jogonasruas.vercel.app**

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | [TanStack Start](https://tanstack.com/start) (SSR + file-based routing) |
| Frontend | React 19, TypeScript, Tailwind CSS 4 |
| Mapas | Leaflet + react-leaflet |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth |
| Push notifications | Firebase Cloud Messaging |
| Search (lugares) | Google Places API (proxied via Supabase Edge Function) |
| Deploy | Cloudflare Workers (SSR primário) + Vercel (fallback SPA) |

## Começando

```bash
# Instalar dependências
bun install

# Variáveis de ambiente (já commitadas)
cp .env.example .env   # se criou do zero

# Servidor de desenvolvimento
bun dev                # → http://localhost:3001
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `bun dev` | Servidor de desenvolvimento (porta 3001) |
| `bun run build` | Build de produção + gera `dist/client/index.html` (Vercel) |
| `bun run lint` | ESLint |
| `bun run format` | Prettier (printWidth 100, singleQuote false) |

## Estrutura

```
src/
├── routes/                 # File-based TanStack Router
│   ├── __root.tsx          # Layout global (viewport, fontes, BottomNav)
│   ├── index.tsx           # Splash / home
│   ├── login.tsx           # Login com redirect
│   ├── mapa.tsx            # Mapa + sidebar/bottom-sheet + venue list
│   ├── add.tsx             # Cadastro de local (AddVenueModal)
│   ├── venue.$id.tsx       # Detalhe do local
│   ├── perfil.tsx          # Perfil do usuário
│   └── sitemap[.]xml.ts    # Sitemap dinâmico
├── components/             # Componentes compartilhados
│   ├── BottomNav.tsx
│   ├── BottomSheet.tsx
│   └── PwaRegister.tsx
├── features/
│   ├── auth/               # Supabase Auth (context + hook)
│   ├── map/                # MapView, VenueList, FilterBar, RadiusSelector, LocationButton
│   └── venues/             # AddVenueModal, VenueDetail
├── shared/
│   ├── lib/                # Clientes Supabase, queries TanStack Query, utils
│   └── components/ui/      # shadcn-style UI primitives
├── server.ts               # SSR server entry (h3 error recovery)
├── start.ts                # TanStack Start bootstrap
└── styles.css              # Tailwind + custom tokens
```

## Funcionalidades

- **Mapa interativo** com pins de locais, fly-to, busca por Google Places
- **Bottom sheet** (mobile) / **Sidebar** (desktop ≥1024px) com lista de locais, filtros e seleção de raio
- **Cadastro de locais** multi-etapas (endereço → dados → partidas)
- **Login social** com Supabase + redirect para rota de origem
- **Confirmação de presença** com contagem otimista (optimistic update)
- **Push notifications** via Firebase Cloud Messaging
- **Sitemap dinâmico** para SEO
- **Responsivo**: mobile-first com bottom-sheet dragável, sidebar em desktop

## Configuração

Variáveis de ambiente em `.env`:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
```

Edge Function do Google Places:
`https://nemrqkkuptdikiqqgaho.supabase.co/functions/v1/google-places`

## Deploy

- **Cloudflare Workers**: entrypoint `src/server.ts`, config `wrangler.jsonc`
- **Vercel** (static SPA fallback): `vercel.json` serve `dist/client/`, rewrites para `index.html`

O build gera `dist/client/index.html` via SSR (script `scripts/generate-html.js`) para que o Vercel sirva uma página estática funcional.

## Licença

MIT
