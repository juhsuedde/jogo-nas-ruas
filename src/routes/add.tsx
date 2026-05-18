import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AddVenueModal } from "@/components/AddVenueModal";

export const Route = createFileRoute("/add")({
  head: () => ({
    meta: [{ title: "Adicionar local — Jogo nas Ruas" }],
  }),
  component: AddPage,
});

function AddPage() {
  const navigate = useNavigate();
  return <AddVenueModal onClose={() => navigate({ to: "/" })} />;
}
