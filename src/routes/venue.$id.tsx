import { createFileRoute, useNavigate, notFound } from "@tanstack/react-router";
import { VENUES } from "@/data/venues";
import { VenueDetail } from "@/components/VenueDetail";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/venue/$id")({
  head: ({ params }) => {
    const v = VENUES.find((x) => x.id === params.id);
    return {
      meta: [
        { title: v ? `${v.name} — Jogo nas Ruas` : "Local — Jogo nas Ruas" },
        ...(v
          ? [{ name: "description", content: `${v.match} no ${v.name}` }]
          : []),
      ],
    };
  },
  loader: ({ params }) => {
    const venue = VENUES.find((v) => v.id === params.id);
    if (!venue) throw notFound();
    return { venue };
  },
  notFoundComponent: () => (
    <div className="p-6 text-center">
      <p className="font-display text-xl text-brasil-navy">local não encontrado</p>
    </div>
  ),
  component: VenuePage,
});

function VenuePage() {
  const { venue } = Route.useLoaderData();
  const navigate = useNavigate();
  return (
    <main className="absolute inset-0 overflow-y-auto bg-background pb-28">
      <div className="max-w-md mx-auto px-4 pt-5">
        <VenueDetail venue={venue} onBack={() => navigate({ to: "/mapa" })} />
      </div>
      <BottomNav />
    </main>
  );
}
