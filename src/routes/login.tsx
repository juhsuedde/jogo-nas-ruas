import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — Jogo nas Ruas" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    const fn = mode === "signin" ? signIn : signUp;
    const { error } = await fn(email, password);
    setBusy(false);
    if (error) {
      setError(error);
      return;
    }
    if (mode === "signup") {
      setInfo("Conta criada! Se a confirmação por e-mail estiver ativa, verifique sua caixa.");
      return;
    }
    navigate({ to: "/mapa" });
  };

  return (
    <main className="absolute inset-0 bg-background overflow-y-auto">
      <div className="max-w-md mx-auto px-5 pt-10 pb-12">
        <Link to="/mapa" className="text-sm font-bold text-brasil-navy">← voltar</Link>
        <div className="mt-6 text-center">
          <div className="text-5xl mb-3">⚽</div>
          <h1 className="font-display text-3xl text-brasil-navy leading-none">
            JOGO NAS RUAS
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            entre pra confirmar presença e cadastrar locais
          </p>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-3">
          <label className="block">
            <span className="text-xs font-bold text-brasil-navy uppercase">E-mail</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-brasil-navy/30 bg-background px-3 py-2.5 focus:border-brasil-green outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-brasil-navy uppercase">Senha</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-brasil-navy/30 bg-background px-3 py-2.5 focus:border-brasil-green outline-none"
            />
          </label>

          {error && (
            <p className="text-sm text-red-600 font-semibold">{error}</p>
          )}
          {info && (
            <p className="text-sm text-brasil-green font-semibold">{info}</p>
          )}

          <button
            disabled={busy}
            type="submit"
            className="w-full rounded-2xl bg-brasil-green text-white font-display text-base py-3 handmade-border disabled:opacity-50"
          >
            {busy ? "..." : mode === "signin" ? "Entrar" : "Criar conta"}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setInfo(null);
            }}
            className="w-full text-sm text-brasil-navy underline"
          >
            {mode === "signin"
              ? "Ainda não tem conta? Criar agora"
              : "Já tenho conta — entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
