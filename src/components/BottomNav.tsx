import { Link } from "@tanstack/react-router";
import { Map, Plus, User } from "lucide-react";

const items: Array<{
  to: "/mapa" | "/add" | "/perfil";
  label: string;
  icon: typeof Map;
  primary?: boolean;
}> = [
  { to: "/mapa", label: "Mapa", icon: Map },
  { to: "/add", label: "Adicionar", icon: Plus, primary: true },
  { to: "/perfil", label: "Perfil", icon: User },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-[700] pointer-events-none">
      <div className="mx-auto max-w-md px-3 pb-3 pointer-events-auto">
        <div className="bg-brasil-navy rounded-full handmade-border-yellow flex items-center justify-around px-2 py-2">
          {items.map(({ to, label, icon: Icon, primary }) => (
            <Link
              key={to}
              to={to}
              className="flex-1 flex justify-center"
              activeProps={{ "data-active": "true" } as never}
            >
              {primary ? (
                <div className="-mt-6 size-14 rounded-full bg-brasil-yellow handmade-border flex items-center justify-center">
                  <Icon
                    className="size-6 text-brasil-navy"
                    strokeWidth={3}
                  />
                </div>
              ) : (
                <div
                  className="group flex flex-col items-center gap-0.5 px-3 py-1 rounded-full"
                  data-label={label}
                >
                  <Icon className="size-5 text-white group-data-[active=true]:text-brasil-yellow" />
                  <span className="text-[10px] font-bold text-white/70 group-data-[active=true]:text-brasil-yellow uppercase tracking-wider">
                    {label}
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
