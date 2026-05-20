import {
  Outlet,
  createRootRoute,
  Link,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Map, User, Plus } from "lucide-react";
import { Toaster as SonnerToaster } from "sonner";
import { AuthProvider } from "@/features/auth/hooks/use-auth";
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
      { title: "Jogo nas Ruas" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico" },
    ],
  }),
  component: RootDocument,
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
        <SonnerToaster position="top-center" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function Layout() {
  const location = useLocation();
  const pathname = location.pathname;
  const isMapa = pathname === "/mapa" || pathname === "/";
  const isPerfil = pathname === "/perfil";

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-brasil-cream">
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      <nav className="shrink-0 bg-brasil-navy rounded-t-3xl px-6 py-3 flex items-center justify-around z-[9999]">
        <Link
          to="/mapa"
          className={`flex flex-col items-center gap-1 transition-colors ${
            isMapa ? "text-brasil-yellow" : "text-white/60"
          }`}
        >
          <Map className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Mapa</span>
        </Link>

        <Link
          to="/add"
          className="relative -top-6 w-14 h-14 bg-brasil-yellow rounded-full flex items-center justify-center shadow-lg border-4 border-brasil-navy"
        >
          <Plus className="w-7 h-7 text-brasil-navy" />
        </Link>

        <Link
          to="/perfil"
          className={`flex flex-col items-center gap-1 transition-colors ${
            isPerfil ? "text-brasil-yellow" : "text-white/60"
          }`}
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Perfil</span>
        </Link>
      </nav>
    </div>
  );
}
