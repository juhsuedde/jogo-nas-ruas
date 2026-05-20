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
