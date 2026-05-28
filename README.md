# ⚽ Jogo nas Ruas

**Mapa colaborativo** para encontrar bares, restaurantes e praças que estão transmitindo os jogos da Copa do Mundo.

> 🏆 https://jogonasruas.vercel.app

---

## ✨ Funcionalidades

- 🗺️ **Mapa interativo** com Leaflet — pins personalizados para locais com transmissão, busca por endereço e voo suave entre pontos
- 🔍 **Busca por Google Places** — resultados com fotos, rating, telefone e site
- 🎯 **Filtros** — por distância (1/3/5/10 km), telão e promoções
- ➕ **Cadastro de locais** em 3 etapas: endereço → informações → partidas exibidas
- ✅ **Confirmação de presença (RSVP)** com atualização otimista
- 🏟️ **Página de detalhe** — partidas, galeria de fotos, botões de ligar/traçar rota/compartilhar, reivindicação do local
- 📱 **Notificações push** via Firebase Cloud Messaging (lembrete 1h antes do jogo)
- 👤 **Perfil** — estatísticas, histórico de jogos, avaliação de locais, meus locais
- 🛡️ **Painel administrativo** — moderação de locais pendentes, gerenciamento de pins patrocinados
- 📄 **Páginas legais** — Termos de Serviço e Política de Privacidade (LGPD)
- 📱 **PWA** — instalável como app, service worker com cache inteligente
- 📐 **Design responsivo** — mobile-first com bottom-sheet arrastável (3 snaps) e sidebar em desktop (≥1024px)

---

## 🧱 Stack

| Camada | Tecnologia |
|---|---|
| **Framework** | [TanStack Start](https://tanstack.com/start) (SSR + file-based routing) |
| **Frontend** | React 19, TypeScript, Tailwind CSS 4 |
| **Router** | TanStack Router (rotas baseadas em arquivos) |
| **Data Fetching** | TanStack React Query v5 |
| **Mapas** | Leaflet + react-leaflet (tiles CARTO Voyager) |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (email/senha) |
| **Push** | Firebase Cloud Messaging |
| **Busca** | Google Places API (via Supabase Edge Function) |
| **UI** | Radix UI + shadcn-style components |
| **Formulários** | React Hook Form + Zod |
| **Ícones** | Lucide React |
| **Notificações UI** | Sonner |
| **Bottom Sheet** | vaul |
| **Carrossel** | Embla Carousel |
| **Datas** | date-fns v4 |
| **PWA** | Web App Manifest + Service Worker customizado |
| **Ambiente** | Bun |

---

## 🚀 Começando

```bash
# Instalar dependências
bun install

# Servidor de desenvolvimento (porta 3001)
bun dev
```

Abra http://localhost:3001.

---

## 📜 Scripts

| Comando | Descrição |
|---|---|
| `bun dev` | Servidor de desenvolvimento (porta 3001) |
| `bun run build` | Build de produção + gera `dist/client/index.html` |
| `bun run build:dev` | Build em modo desenvolvimento |
| `bun run preview` | Pré-visualização do build |
| `bun run lint` | ESLint |
| `bun run format` | Prettier |

---

## 📁 Estrutura

```
src/
├── routes/                        # File-based TanStack Router
│   ├── __root.tsx                 # Layout global (providers, BottomNav, PWA)
│   ├── index.tsx                  # Splash / landing
│   ├── mapa.tsx                   # Mapa interativo + busca + filtros
│   ├── add.tsx                    # Cadastro de local (3 etapas)
│   ├── venue.$id.tsx              # Detalhe do local + RSVP + fotos
│   ├── login.tsx                  # Login / cadastro
│   ├── perfil.tsx                 # Perfil do usuário
│   ├── admin.tsx                  # Painel de moderação (admin)
│   ├── termos.tsx                 # Termos de Serviço
│   ├── privacidade.tsx            # Política de Privacidade
│   └── sitemap[.]xml.ts           # Sitemap dinâmico
├── components/                    # Componentes compartilhados
│   ├── BottomNav.tsx              # Navegação inferior
│   ├── BottomSheet.tsx            # Bottom sheet (vaul)
│   ├── FcmForegroundToast.tsx     # Toast de notificação em foreground
│   └── PwaRegister.tsx            # Registro PWA + install prompt
├── features/
│   ├── auth/                      # Auth context + hook (Supabase)
│   ├── map/                       # MapView, VenueList, FilterBar, etc.
│   ├── venues/                    # AddVenueModal, VenueCard, VenueDetail
│   └── profile/                   # Perfil (estatísticas, reviews)
├── shared/
│   ├── lib/                       # Clientes Supabase/FCM, queries, utils
│   ├── components/                # UI primitives (shadcn-style) + shared
│   └── hooks/                     # Hooks compartilhados
├── server.ts                      # SSR entry (h3 error recovery)
├── start.ts                       # TanStack Start bootstrap
├── router.tsx                     # Factory do router
└── styles.css                     # Tailwind + design tokens (cores Brasil)

supabase/
├── functions/
│   ├── google-places/             # Proxy Google Places API
│   ├── reverse-geocode/           # Coordenadas → cidade
│   └── send-push-notification/    # Disparo de push FCM
└── migrations/                    # 15 migrations SQL

public/
├── sw.js                          # Service worker customizado
├── firebase-messaging-sw.js       # FCM service worker
├── manifest.webmanifest           # PWA manifest
├── icon-192.png / icon-512.png    # Ícones PWA
└── robots.txt
```

---

## 🔧 Variáveis de Ambiente

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_FIREBASE_VAPID_KEY=
```

Configuradas via dashboard da Vercel/Cloudflare. Veja `.env.example`.

Secrets das Edge Functions (Supabase dashboard):
`GOOGLE_PLACES_API_KEY`, `GOOGLE_SERVICE_ACCOUNT`, `FIREBASE_PROJECT_ID`, `SB_URL`, `SB_SERVICE_ROLE_KEY`.

---

## 🌐 Deploy

### Cloudflare Workers (SSR primário)
- Entry: `src/server.ts`
- Config: `wrangler.jsonc` (nodejs_compat)
- Build: `bun run build`

### Vercel (fallback SPA estático)
- `vercel.json` serve `dist/client/`, rewrites para `/index.html`
- Pós-build: `scripts/generate-html.js` gera HTML estático via SSR

---

## 🎨 Design

Cores inspiradas na bandeira do Brasil com tokens OKLCH:

- **Verde Brasil** `oklch(0.58 0.16 145)`
- **Amarelo Brasil** `oklch(0.88 0.18 95)`
- **Azul Navy** `oklch(0.32 0.13 265)`
- **Creme** `oklch(0.98 0.02 95)`

Tipografia: **Bungee** (display) + **Nunito** (corpo) — ambas do Google Fonts.
Bordas "feitas à mão" e textura de papel para um visual autêntico.

---

## 📄 Licença

MIT
