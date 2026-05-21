import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AddVenueModal } from "@/features/venues/components/AddVenueModal";
import { useAddVenue } from "@/shared/lib/venues";
import { toast } from "sonner";

export const Route = createFileRoute("/add")({
  head: () => {
    const url = "https://jogonasruas.lovable.app/add";
    const title = "Cadastrar local — Jogo nas Ruas";
    const description =
      "Adicione um bar, restaurante ou praça que vai transmitir os jogos da Copa 2026.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: AddPage,
});

function AddPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const addVenue = useAddVenue();

  const MATCH_MAP: Record<string, { match: string; time: string; isBrazil: boolean }> = {
    "bra-x-arg": { match: "Brasil x Argentina", time: "16:00", isBrazil: true },
    "bra-x-uru": { match: "Brasil x Uruguai", time: "16:00", isBrazil: true },
    "bra-x-col": { match: "Brasil x Colômbia", time: "16:00", isBrazil: true },
  };

  function extractCity(address: string): string {
    const parts = address.split(",");
    return parts[parts.length - 1]?.trim() || "São Paulo";
  }

  async function handleSubmit(venue: {
    name: string;
    address: { title: string; subtitle: string; lat: number; lng: number };
    perks: string[];
    matches: string[];
  }) {
    try {
      const firstMatch = venue.matches[0] ? MATCH_MAP[venue.matches[0]] : null;
      const promo = venue.perks.includes("promo") ? "Promoção disponível" : undefined;

      await addVenue.mutateAsync({
        name: venue.name,
        address: `${venue.address.title} - ${venue.address.subtitle}`,
        lat: venue.address.lat,
        lng: venue.address.lng,
        city: extractCity(venue.address.subtitle),
        match: firstMatch?.match || "",
        matchTime: firstMatch?.time || "",
        isBrazilMatch: firstMatch?.isBrazil || false,
        bigScreen: venue.perks.includes("big-screen"),
        promo,
      });

      toast.success("Local cadastrado com sucesso!");
      setOpen(false);
      navigate({ to: "/" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao cadastrar local";
      toast.error(message);
    }
  }

  return (
    <AddVenueModal
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) navigate({ to: "/" });
      }}
      onSubmit={handleSubmit}
    />
  );
}
