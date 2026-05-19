import { Outlet, createFileRoute, Link, useLocation } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Map, User, Plus } from "lucide-react";
import { Toaster as SonnerToaster } from "sonner";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { createContext, useContext } from "react";

export const Route = createFileRoute("/__root")({
  component: AppProviders,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
    },
  },
});

function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProviderWrapper>
        <Layout />
        <SonnerToaster position="top-center" richColors />
      </AuthProviderWrapper>
    </QueryClientProvider>
  );
}

const AuthContext = createContext<{
  user: { id: string; email: string; user_metadata: Record<string, unknown> } | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
} | null>(null);

function AuthProviderWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading, signIn, signOut } = useAuth();
  
  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProviderWrapper");
  }
  return context;
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