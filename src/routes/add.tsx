import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AddVenueModal } from "@/components/AddVenueModal";

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
  return <AddVenueModal onClose={() => navigate({ to: "/" })} />;
}
