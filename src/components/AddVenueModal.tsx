import { useState } from "react";
import { X } from "lucide-react";

export function AddVenueModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [match, setMatch] = useState("Brasil x Argentina");
  const [screen, setScreen] = useState(true);
  const [promo, setPromo] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(onClose, 1400);
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-brasil-navy/40 flex items-end sm:items-center justify-center p-3">
      <div className="w-full max-w-md bg-card rounded-3xl p-5 handmade-border-yellow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-brasil-navy">
            Cadastrar local
          </h2>
          <button
            onClick={onClose}
            className="size-9 rounded-full bg-muted flex items-center justify-center"
          >
            <X className="size-4" />
          </button>
        </div>

        {sent ? (
          <div className="py-8 text-center">
            <div className="text-5xl mb-3">⚽</div>
            <p className="font-display text-lg text-brasil-green">
              Local cadastrado!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Já aparece no mapa como "Novo".
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="text-xs font-bold text-brasil-navy uppercase">
                Nome do local
              </span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Boteco do Zé"
                className="mt-1 w-full rounded-xl border-2 border-brasil-navy/30 bg-background px-3 py-2.5 focus:border-brasil-green outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-brasil-navy uppercase">
                Endereço
              </span>
              <input
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número, bairro"
                className="mt-1 w-full rounded-xl border-2 border-brasil-navy/30 bg-background px-3 py-2.5 focus:border-brasil-green outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-brasil-navy uppercase">
                Jogo
              </span>
              <select
                value={match}
                onChange={(e) => setMatch(e.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-brasil-navy/30 bg-background px-3 py-2.5 focus:border-brasil-green outline-none"
              >
                <option>Brasil x Argentina — Hoje 16:00</option>
                <option>França x Alemanha — Hoje 13:00</option>
                <option>Portugal x Espanha — Amanhã 10:00</option>
              </select>
            </label>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setScreen(!screen)}
                className="chip flex-1 justify-center"
                data-active={screen}
              >
                📺 Telão
              </button>
              <button
                type="button"
                onClick={() => setPromo(!promo)}
                className="chip flex-1 justify-center"
                data-active={promo}
              >
                🎁 Promoção
              </button>
            </div>
            <button
              type="submit"
              className="w-full mt-2 rounded-2xl bg-brasil-green text-white font-display text-lg py-3 handmade-border"
            >
              Bora! Cadastrar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
