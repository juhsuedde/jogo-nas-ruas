import { Outlet, createFileRoute, Link, useLocation } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Map, User, Plus } from "lucide-react";
import { Toaster as SonnerToaster } from "sonner";
import { AuthProvider } from "@/features/auth/hooks/use-auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export const Route = createFileRoute("/__root")({
  component: RootLayout,
});

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