import {
  Outlet,
  createRootRoute,
  Link,
  useLocation,
  HeadContent,
  Scripts,
  NotFoundRoute,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { User, Plus, Frown } from "lucide-react";
import { Toaster as SonnerToaster } from "sonner";
import { AuthProvider } from "@/features/auth/hooks/use-auth";
import { BottomNav } from "@/components/BottomNav";
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
  notFoundComponent: () => (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
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
        <SonnerToaster position="top-center" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function Layout() {
  return (
    <div className="h-[100dvh] w-full flex flex-col bg-brasil-cream">
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      <BottomNav />
    </div>
  );
}
