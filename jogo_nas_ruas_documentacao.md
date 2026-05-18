# Jogo nas Ruas — Documentação do Projeto

> Última atualização: 18/05/2026  
> Status: Frontend finalizado, backend em configuração  
> Prazo: Copa do Mundo 2026 inicia em 11/06/2026 (~3 semanas)

---

## 1. Visão Geral

**Jogo nas Ruas** é um PWA mobile-first que ajuda torcedores brasileiros a encontrar bares, restaurantes e praças com telão transmitindo jogos da Copa do Mundo 2026. Usuários podem descobrir locais no mapa, filtrar por jogo/cidade, confirmar presença (RSVP) e adicionar novos locais.

### Core Loop

1. Usuário abre o app → vê mapa com pins de locais
2. Filtra por cidade/jogo → clica no card → vê detalhes
3. Confirma "vou assistir aqui" (RSVP)
4. Compartilha o local com amigos

---

## 2. Stack Técnica

| Camada                | Ferramenta                              | Status         |
| --------------------- | --------------------------------------- | -------------- |
| **Frontend/UI**       | Lovable.dev (React/TypeScript/Tailwind) | ✅ Finalizado  |
| **Mapa**              | Leaflet (OpenStreetMap)                 | ✅ Funcionando |
| **Backend/DB**        | Supabase (Postgres + Auth + Realtime)   | ✅ Conectado   |
| **Storage**           | Supabase Storage (`venue-images`)       | ✅ Configurado |
| **Push/Notificações** | Firebase Cloud Messaging                | ⏳ Pendente    |
| **Deploy**            | Vercel (via Lovable)                    | ✅ Automático  |
| **Analytics**         | Google Analytics 4 ou Plausible         | ⏳ Pendente    |

---

## 3. Estrutura de Telas (Frontend)

### Telas implementadas no Lovable

| Rota         | Tela              | Status | Detalhes                                                      |
| ------------ | ----------------- | ------ | ------------------------------------------------------------- |
| `/`          | Splash/Landing    | ✅     | Logo "Jogo nas Ruas", botão para entrar                       |
| `/mapa`      | Mapa principal    | ✅     | Full-screen Leaflet, bottom sheet com cards, filtros, FAB "+" |
| `/venue/$id` | Detalhe do local  | ✅     | Hero, match info, crowd meter, amenities, RSVP, share         |
| `/add`       | Adicionar local   | ✅     | Modal 3 passos: endereço → detalhes → jogo                    |
| `/perfil`    | Perfil do usuário | ✅     | Stats, próximos jogos, histórico, locais adicionados          |
| `/login`     | Login/Cadastro    | ✅     | Email/senha, modo criar conta/entrar                          |

### Componentes principais

- `MapScreen` — mapa + bottom sheet + filtros
- `VenueCard` — card no bottom sheet
- `VenueDetail` — tela de detalhe expandida
- `AddVenueModal` — wizard de 3 passos
- `ProfileScreen` — perfil do usuário
- `BottomNav` — navegação fixa (Mapa / + / Perfil)
- `FilterPills` — pills de filtro scrolláveis

### Design System (definido pelo Lovable)

- **Background**: `#0A2540` (deep navy)
- **Primary green**: `#009C3B` (Brasil)
- **Primary yellow**: `#FFDF00` (destaques)
- **Accent orange**: `#E85D04`
- **Off-white**: `#F5F0E1` (texto)
- **Fonte headings**: Bebas Neue (condensed, uppercase)
- **Fonte body**: Nunito
- **Textura**: Grain/noise overlay (CSS)
- **Cards**: Bordas arredondadas grandes (20px+), sombras suaves
- **Bottom sheet**: Snap points (peek/list/full)

---

## 4. Banco de Dados (Supabase)

### Tabelas criadas

#### `cities`

| Campo        | Tipo            | Descrição           |
| ------------ | --------------- | ------------------- |
| id           | uuid            | PK                  |
| name         | text            | Nome da cidade      |
| state        | text            | UF                  |
| lat, lng     | float           | Coordenadas         |
| geo          | geometry(Point) | PostGIS             |
| is_host_city | boolean         | Cidade-sede da Copa |

**Seed**: 16 cidades brasileiras (SP, RJ, Salvador, Recife, Fortaleza, BH, POA, Curitiba, Manaus, Natal, Brasília, Goiânia, Florianópolis, Santos, Campinas, Niterói)

#### `matches`

| Campo       | Tipo        | Descrição                    |
| ----------- | ----------- | ---------------------------- |
| id          | uuid        | PK                           |
| home_team   | text        | Time da casa                 |
| away_team   | text        | Time visitante               |
| match_date  | timestamptz | Data/hora do jogo (BRT)      |
| stage       | text        | Fase ("Fase de Grupos", etc) |
| group_name  | text        | Grupo (A-L)                  |
| stadium     | text        | Estádio                      |
| match_city  | text        | Cidade do jogo               |
| match_order | int         | Ordem do jogo                |

**Seed**: 48 jogos da fase de grupos (11-26/06/2026)

#### `venues`

| Campo                  | Tipo            | Descrição                           |
| ---------------------- | --------------- | ----------------------------------- |
| id                     | uuid            | PK                                  |
| name                   | text            | Nome do local                       |
| address                | text            | Endereço completo                   |
| neighborhood           | text            | Bairro                              |
| city_id                | uuid            | FK → cities                         |
| city_name              | text            | Nome da cidade (denormalizado)      |
| state                  | text            | UF                                  |
| lat, lng               | float           | Coordenadas                         |
| geo                    | geometry(Point) | PostGIS                             |
| phone                  | text            | Telefone                            |
| instagram              | text            | Instagram                           |
| website                | text            | Site                                |
| image_url              | text            | URL da imagem no Storage            |
| has_big_screen         | boolean         | Tem telão?                          |
| has_promotion          | boolean         | Tem promoção?                       |
| has_parking            | boolean         | Tem estacionamento?                 |
| accepts_reservation    | boolean         | Aceita reserva?                     |
| capacity_estimate      | int             | Capacidade estimada                 |
| promotions             | text            | Descrição da promoção               |
| match_ids              | uuid[]          | Jogos que vai transmitir            |
| shows_all_matches      | boolean         | Passa todos os jogos?               |
| verified               | boolean         | Verificado pela equipe?             |
| submitted_by           | uuid            | FK → auth.users                     |
| status                 | text            | `pending` / `approved` / `rejected` |
| created_at, updated_at | timestamptz     | Timestamps                          |

**Seed**: 40 bares/restaurantes/praças em 12 cidades brasileiras

#### `rsvps`

| Campo       | Tipo        | Descrição                |
| ----------- | ----------- | ------------------------ |
| id          | uuid        | PK                       |
| venue_id    | uuid        | FK → venues              |
| user_id     | uuid        | FK → auth.users          |
| match_id    | uuid        | FK → matches (opcional)  |
| guest_count | int         | Número de pessoas (1-20) |
| created_at  | timestamptz | Timestamp                |

**Constraint**: UNIQUE(venue_id, user_id, match_id)

#### `reviews`

| Campo      | Tipo        | Descrição       |
| ---------- | ----------- | --------------- |
| id         | uuid        | PK              |
| venue_id   | uuid        | FK → venues     |
| user_id    | uuid        | FK → auth.users |
| match_id   | uuid        | FK → matches    |
| rating     | int         | 1-5 estrelas    |
| comment    | text        | Comentário      |
| created_at | timestamptz | Timestamp       |

#### `favorites`

| Campo      | Tipo        | Descrição       |
| ---------- | ----------- | --------------- |
| id         | uuid        | PK              |
| venue_id   | uuid        | FK → venues     |
| user_id    | uuid        | FK → auth.users |
| created_at | timestamptz | Timestamp       |

**Constraint**: UNIQUE(venue_id, user_id)

### Índices

- `idx_venues_geo` — GIST em `venues.geo`
- `idx_venues_city` — em `venues.city_name`
- `idx_venues_verified` — em `venues(verified, status)`
- `idx_rsvps_venue` — em `rsvps(venue_id)`
- `idx_rsvps_user` — em `rsvps(user_id)`
- `idx_reviews_venue` — em `reviews(venue_id)`

### Funções SQL

- `nearby_venues(lat, lng, radius_meters)` — busca venues por proximidade
- `get_venue_rsvp_count(venue_uuid)` — conta RSVPs de um venue
- `update_updated_at_column()` — trigger para updated_at automático

### Views

- `venues_with_rsvp_count` — venues + contagem de RSVPs
- `brazil_matches` — jogos onde o Brasil joga

### RLS (Row Level Security)

| Tabela      | SELECT  | INSERT      | UPDATE  | DELETE  |
| ----------- | ------- | ----------- | ------- | ------- |
| `venues`    | público | autenticado | próprio | —       |
| `matches`   | público | —           | —       | —       |
| `rsvps`     | próprio | próprio     | —       | —       |
| `reviews`   | público | próprio     | próprio | —       |
| `favorites` | próprio | próprio     | —       | próprio |
| `cities`    | público | —           | —       | —       |

---

## 5. Storage (Supabase)

### Bucket: `venue-images`

| Policy               | Comando | Roles               | Definição                                                      |
| -------------------- | ------- | ------------------- | -------------------------------------------------------------- |
| Public read          | SELECT  | anon, authenticated | `bucket_id = 'venue-images'`                                   |
| Authenticated upload | INSERT  | authenticated       | `bucket_id = 'venue-images' AND auth.role() = 'authenticated'` |
| Owner delete         | DELETE  | authenticated       | `bucket_id = 'venue-images' AND auth.uid() = owner`            |

**Status**: ✅ Configurado (verificar se "Owner delete" está com comando DELETE, não SELECT)

---

## 6. Auth (Supabase)

- Provider: **Email/Password** (nativo do Supabase)
- Hooks no frontend: `useAuth()` (signIn, signUp, signOut, sessão reativa)
- Avatar no mapa leva para `/login` quando deslogado
- RSVP e adicionar local exigem login (redireciona para `/login`)

---

## 7. Pendências do Backend

### Alta prioridade (próximos passos)

| #   | Tarefa                                                            | Ferramenta                  | Complexidade |
| --- | ----------------------------------------------------------------- | --------------------------- | ------------ |
| 1   | **Firebase Cloud Messaging** — notificações push 1h antes do jogo | Firebase Console + frontend | Média        |
| 2   | **Domínio customizado** — `jogonasruas.com.br`                    | Vercel + Registrador        | Baixa        |
| 3   | **PWA manifest + service worker** — Add to Home Screen            | Lovable (prompt)            | Baixa        |
| 4   | **Web Share API** — compartilhar venue nativamente                | Lovable (prompt)            | Baixa        |

### Média prioridade (pós-lançamento)

| #   | Tarefa                                                      | Ferramenta                   | Complexidade |
| --- | ----------------------------------------------------------- | ---------------------------- | ------------ |
| 5   | **Analytics** — GA4 ou Plausible                            | Google Analytics / Plausible | Baixa        |
| 6   | **Imagens dos venues** — upload real de fotos               | Supabase Storage             | Baixa        |
| 7   | **Moderação de locais** — aprovar/rejeitar venues pendentes | Dashboard admin              | Média        |
| 8   | **Pagamento de destaque** — pins patrocinados               | Stripe/Pix                   | Alta         |

---

## 8. Checklist de Lançamento

### Semana 1 (agora)

- [x] Frontend completo no Lovable
- [x] Schema SQL rodado no Supabase
- [x] Auth funcionando
- [x] Storage configurado
- [ ] Firebase FCM setup
- [ ] PWA + Web Share
- [ ] Seed dos 40 bares confirmado no banco

### Semana 2

- [ ] Domínio customizado
- [ ] Teste beta com 10 amigos
- [ ] Ajustes de bugs
- [ ] Soft launch (stories, grupos WhatsApp)

### Semana 3 (Copa começa)

- [ ] 🚀 Lançamento oficial
- [ ] Monitoramento de uptime
- [ ] Resposta rápida a feedback

---

## 9. Prompts do Lovable (histórico)

### Prompt 0 — Contexto inicial

```
I'm building a mobile-first PWA called "Jogo nas Ruas"...
[Anexar 5 imagens de referência]
DO NOT ask me for hex codes, font names...
```

### Prompt 1 — Main Map

```
Build the Main Map screen for "Jogo nas Ruas".
Full-screen map, floating search bar, filter pills...
```

### Prompt 2 — Venue Detail

```
Build the Venue Detail view...
Hero area, match info, crowd meter, RSVP button...
```

### Prompt 3 — Add Venue

```
Build the "Adicionar Local" flow...
3 steps: address → details → match selector...
```

### Prompt 4 — Profile

```
Build the "Meu Perfil" screen...
Stats, upcoming matches, history, submitted venues...
```

### Prompt 5 — PWA + Share (pendente)

```
Make this a full PWA. Add manifest.json, service worker...
Add native Web Share API to venue detail page...
```

---

## 10. Links e Referências

- **Preview do app**: [URL do Lovable]
- **Projeto Supabase**: [Dashboard URL]
- **Schema SQL**: [jogo_nas_ruas_schema.sql](sandbox:///mnt/agents/output/jogo_nas_ruas_schema.sql)
- **Referências visuais**: 5 imagens (retro TV, cachorro bandeira, 3 screenshots de UI de mapa)

---

## 11. Próximo Passo Imediato

**Firebase Cloud Messaging (FCM)** para notificações push:

1. Criar projeto no [Firebase Console](https://console.firebase.google.com)
2. Ativar Cloud Messaging
3. Copiar `server key` e `sender ID`
4. Integrar no frontend (pedir ao Lovable ou implementar manualmente)
5. Criar tópicos por jogo: `brasil-senegal`, `brasil-franca`, etc.
6. Agendar notificações: "O jogo do Brasil começa em 1h no [Venue]!"

---

_Documento gerado para continuidade entre sessões. Atualizar conforme progresso._
