# 🔧 Fixes de Performance — Jogo nas Ruas

## Arquivos modificados (5)

### 1. `src/shared/lib/firebase.ts` ✅ JÁ ESTÁ CORRETO
O Firebase já está com lazy load via `import()` dinâmico. Não precisa mudar nada.
- `getMessagingSafe()` só inicializa quando chamada
- `requestNotificationPermission()` só carrega o bundle do Firebase quando o usuário opta-in

---

### 2. `src/shared/lib/venues.ts` — FIX: useVenues() não joga erro quando vazio
**Problema:** Quando o banco estava vazio, `useVenues()` lançava `throw new Error("Nenhum local encontrado...")`, quebrando o React Query e causando re-renders infinitos.

**Mudança:**
```typescript
// ANTES
if (!data || data.length === 0) {
  throw new Error("Nenhum local encontrado. O banco de dados está vazio.");
}

// DEPOIS
if (!data || data.length === 0) {
  return [];  // ✅ React Query fica estável
}
```

---

### 3. `src/routes/venue.$id.tsx` — FIX: dynamic import do Firebase
**Problema:** `requestNotificationPermission` era importado estaticamente no topo do arquivo, puxando o bundle do Firebase no initial load.

**Mudança:**
```typescript
// ANTES (topo do arquivo)
import { requestNotificationPermission } from "@/shared/lib/firebase";

// DEPOIS (dentro do handler, só quando usuário clica em "vou")
const { requestNotificationPermission } = await import("@/shared/lib/firebase");
```

---

### 4. `src/features/profile/hooks/use-profile-data.ts` — FIX: N+1 queries
**Problema:** Para cada venue criado pelo usuário, fazia uma query separada de contagem de RSVPs:
```typescript
// ANTES — N+1 queries
const myVenues = await Promise.all(
  venuesCreated.map(async (v) => {
    const { count } = await supabase.from("rsvps").select("*", { count: "exact", head: true }).eq("venue_id", v.id);
    return { ...v, rsvps: count || 0 };
  }),
);
```

**Mudança:**
```typescript
// DEPOIS — JOIN em uma query só
supabase
  .from("venues")
  .select("id, name, address, unverified, rsvps(count)")  // ✅ count no JOIN
  .eq("created_by", user.id)

// E no map:
const myVenues = venuesCreated.map((v) => ({
  ...v,
  rsvps: (v as any).rsvps?.[0]?.count ?? 0,  // ✅ já veio no resultado
}));
```

---

### 5. `src/routes/mapa.tsx` + `src/features/map/components/MapView.tsx` — FIX: lazy load Leaflet
**Problema:** O MapView com Leaflet era importado estaticamente, carregando ~150KB+ de bundle no initial load.

**Mudança em `mapa.tsx`:**
```typescript
// ANTES
import { MapView } from "@/features/map/components/MapView";

// DEPOIS
const MapView = lazy(() => import("@/features/map/components/MapView").then(m => ({ default: m.MapView })));

// E no JSX:
<Suspense fallback={<div className="animate-pulse">carregando mapa…</div>}>
  <MapView ... />
</Suspense>
```

---

## Como aplicar

1. Copie cada arquivo da pasta `output/` para o caminho correspondente no seu repo
2. Rode `bun run build` para verificar se compila
3. Teste:
   - Acesse a home com banco vazio → não deve crashar
   - Acesse `/mapa` → mapa deve carregar lazy (ver no Network tab)
   - Acesse `/perfil` → deve carregar rápido sem N+1 queries
   - Clique em "vou" num venue → só aí o Firebase deve carregar

## Bônus: verificar bundle

Rode o analyzer:
```bash
bun run build
# ou se tiver vite-bundle-visualizer:
npx vite-bundle-visualizer
```

Você deve ver o chunk do `leaflet` separado do bundle principal.
