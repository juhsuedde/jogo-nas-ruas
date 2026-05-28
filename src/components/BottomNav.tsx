import { Link, useNavigate } from "@tanstack/react-router";
import { Map, Plus, User, Shield } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useIsAdmin } from "@/shared/lib/admin";

export function BottomNav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: isAdmin } = useIsAdmin();

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
              <Map className="size-5 text-white group-data-[active=true]:text-brasil-yellow" />
              <span className="text-[10px] font-bold text-white/70 group-data-[active=true]:text-brasil-yellow uppercase tracking-wider">
                Mapa
              </span>
            </div>
          </Link>

          <button
            onClick={() => {
              if (!user) {
                navigate({ to: "/login", search: { redirectTo: "/add" } });
                return;
              }
              navigate({ to: "/add" });
            }}
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
              <User className="size-5 text-white group-data-[active=true]:text-brasil-yellow" />
              <span className="text-[10px] font-bold text-white/70 group-data-[active=true]:text-brasil-yellow uppercase tracking-wider">
                Perfil
              </span>
            </div>
          </Link>

          {isAdmin && (
            <Link
              to="/admin"
              aria-label="Moderação"
              className="flex-1 flex justify-center"
              activeProps={{ "data-active": "true" } as never}
            >
              <div className="group flex flex-col items-center gap-0.5 px-3 py-1 rounded-full">
                <Shield className="size-5 text-white group-data-[active=true]:text-brasil-yellow" />
                <span className="text-[10px] font-bold text-white/70 group-data-[active=true]:text-brasil-yellow uppercase tracking-wider">
                  Admin
                </span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
