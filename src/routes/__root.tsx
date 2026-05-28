import {
  Outlet,
  createRootRoute,
  Link,
  HeadContent,
  Scripts,
  ErrorComponentProps,
  useNavigate,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Frown, RefreshCw, Home, Map as MapIcon, Plus, User } from "lucide-react";
import { Toaster as SonnerToaster } from "sonner";
import { AuthProvider } from "@/features/auth/hooks/use-auth";
import { BottomNav } from "@/components/BottomNav";
import { PwaRegister } from "@/components/PwaRegister";
import { FcmForegroundToast } from "@/components/FcmForegroundToast";
import appCss from "@/styles.css?url";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { name: "theme-color", content: "#1F2C6B" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Jogo nas Ruas" },
      { name: "application-name", content: "Jogo nas Ruas" },
      { title: "Jogo nas Ruas" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-192.png", sizes: "192x192" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" as never },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bungee&family=Nunito:wght@400;600;700;800;900&display=swap",
      },
    ],
  }),
  component: RootDocument,
  errorComponent: ({ error, reset }: ErrorComponentProps) => {
    const message =
      error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    return (
      <div className="h-[100dvh] w-full flex flex-col bg-brasil-cream">
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="size-20 rounded-full bg-brasil-navy handmade-border-yellow flex items-center justify-center mb-4">
            <Frown className="size-8 text-brasil-yellow" />
          </div>
          <h1 className="font-display text-2xl text-brasil-navy mb-2">Algo deu errado</h1>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={() => reset()}
              className="rounded-xl bg-brasil-navy text-white font-bold px-5 py-3 font-display text-sm tracking-wider flex items-center gap-2"
            >
              <RefreshCw className="size-4" />
              Tentar novamente
            </button>
            <Link
              to="/"
              className="rounded-xl bg-brasil-green text-white font-bold px-5 py-3 font-display text-sm tracking-wider flex items-center gap-2"
            >
              <Home className="size-4" />
              Início
            </Link>
          </div>
        </div>
        <StaticBottomNav />
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="h-[100dvh] w-full flex flex-col bg-brasil-cream">
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <div className="size-20 rounded-full bg-brasil-navy handmade-border-yellow flex items-center justify-center text-3xl mb-4">
          ⚽
        </div>
        <h1 className="font-display text-2xl text-brasil-navy mb-2">Página não encontrada</h1>
        <p className="text-sm text-muted-foreground mb-6">Essa página não existe ou foi removida.</p>
        <Link
          to="/"
          className="rounded-xl bg-brasil-green text-white font-bold px-6 py-3 font-display tracking-wider"
        >
          VOLTAR PRO INÍCIO
        </Link>
      </div>
      <StaticBottomNav />
    </div>
  ),
});

function RootDocument() {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        <RootLayout />
        <Scripts />
      </body>
    </html>
  );
}

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Layout />
        <PwaRegister />
        <FcmForegroundToast />
        <SonnerToaster position="top-center" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function StaticBottomNav() {
  const navigate = useNavigate();
  return (
    <nav className="absolute bottom-0 inset-x-0 z-[700] pointer-events-none">
      <div className="mx-auto max-w-md px-3 pb-3 pointer-events-auto">
        <div className="bg-brasil-navy rounded-full handmade-border-yellow flex items-center justify-around px-2 py-2">
          <Link
            to="/mapa"
            aria-label="Abrir mapa"
            className="flex-1 flex justify-center"
            activeProps={{ "data-active": "true" } as never}
          >
            <div className="group flex flex-col items-center gap-0.5 px-3 py-1 rounded-full">
              <MapIcon className="size-5 text-white" />
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Mapa</span>
            </div>
          </Link>

          <button
            onClick={() => navigate({ to: "/login", search: { redirectTo: "/add" } })}
            aria-label="Cadastrar novo local"
            className="flex-1 flex justify-center"
          >
            <div className="-mt-6 size-14 rounded-full bg-brasil-yellow handmade-border flex items-center justify-center">
              <Plus className="size-6 text-brasil-navy" strokeWidth={3} />
            </div>
          </button>

          <Link
            to="/perfil"
            aria-label="Abrir perfil"
            className="flex-1 flex justify-center"
            activeProps={{ "data-active": "true" } as never}
          >
            <div className="group flex flex-col items-center gap-0.5 px-3 py-1 rounded-full">
              <User className="size-5 text-white" />
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Perfil</span>
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Layout() {
  return (
    <div className="h-[100dvh] w-full flex flex-col bg-brasil-cream">
      <div className="flex-1 overflow-y-auto *:animate-fade-in">
        <Outlet />
      </div>

      <BottomNav />
    </div>
  );
}
