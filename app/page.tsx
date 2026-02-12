import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16">
      <section className="w-full rounded-3xl border border-slate-800/80 bg-slate-950/60 p-8 shadow-[0_0_120px_-20px_rgba(34,211,238,0.35)] backdrop-blur">
        <p className="mb-2 text-xs uppercase tracking-[0.25em] text-cyan-300">
          SimpleClaw BR
        </p>
        <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
          Deploy 1-click do OpenClaw para o mercado brasileiro
        </h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          Crie seu agente, conecte Telegram, escolha modelo e publique em poucos
          segundos com painel de gestão centralizado.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/dashboard"
            className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300"
          >
            Ir para Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
