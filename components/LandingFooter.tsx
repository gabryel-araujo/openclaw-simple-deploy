"use client";

import { ExternalLink } from "lucide-react";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
  badge?: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

const COLUMNS: FooterColumn[] = [
  {
    title: "Produto",
    links: [
      { label: "Configurar deploy", href: "#" },
      { label: "Modelos de IA", href: "#" },
      { label: "Canais suportados", href: "#" },
      { label: "Segurança", href: "#" },
    ],
  },
  {
    title: "Modelos",
    links: [
      { label: "GPT-5.2", href: "#" },
      { label: "Claude Opus 4.5", href: "#" },
      { label: "Gemini Flash", href: "#" },
      { label: "Llama 3.3 70B", href: "#" },
    ],
  },
  {
    title: "Canais",
    links: [
      { label: "Telegram", href: "#" },
      { label: "Discord", href: "#", badge: "Em breve" },
      { label: "WhatsApp", href: "#", badge: "Em breve" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre a Adapta", href: "https://adapta.org", external: true },
      { label: "adapta.org", href: "https://adapta.org", external: true },
      { label: "Blog", href: "https://adapta.org", external: true },
      { label: "Contato", href: "https://adapta.org", external: true },
    ],
  },
];

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-4 w-full overflow-hidden">
      {/* ── Top glow divider ── */}
      <div className="relative h-px w-full">
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-cyan-400/60 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-cyan-400/20 to-transparent blur-sm" />
      </div>

      {/* ── Main footer body ── */}
      <div className="relative bg-[#04070d] px-6 pt-14 pb-8">
        {/* Subtle grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Ambient glow blobs */}
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-cyan-500/5 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-violet-500/5 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          {/* ── Top row: branding + nav ── */}
          <div className="grid gap-12 lg:grid-cols-[1fr_auto]">
            {/* Left: product identity */}
            <div className="flex flex-col gap-5 max-w-xs">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                  Um produto
                </p>
                <a
                  href="https://adapta.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group mt-1 inline-flex items-end gap-2"
                >
                  <span
                    className="text-4xl font-black tracking-tight text-white transition-colors group-hover:text-cyan-300"
                    style={{
                      background:
                        "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    ADAPTA
                  </span>
                  <ExternalLink className="mb-1.5 h-4 w-4 text-slate-600 transition-colors group-hover:text-cyan-400" />
                </a>
              </div>

              <p className="text-sm leading-relaxed text-slate-500">
                Simpleclaw Sync é a solução de deploy 1-click de agentes
                OpenClaw
              </p>

              {/* Trust badge */}
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-slate-800" />
                <span className="text-[10px] uppercase tracking-widest text-slate-700">
                  adapta.org
                </span>
                <div className="h-px flex-1 bg-slate-800" />
              </div>
            </div>

            {/* Right: link columns */}
            <div className="grid grid-cols-2 gap-x-12 gap-y-8 sm:grid-cols-4">
              {COLUMNS.map((col) => (
                <div key={col.title}>
                  <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {col.title}
                  </p>
                  <ul className="flex flex-col gap-2.5">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          target={link.external ? "_blank" : undefined}
                          rel={
                            link.external ? "noopener noreferrer" : undefined
                          }
                          className="group inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-200"
                        >
                          {link.label}
                          {link.external && (
                            <ExternalLink className="h-2.5 w-2.5 opacity-0 transition-opacity group-hover:opacity-60" />
                          )}
                          {link.badge && (
                            <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-amber-400/70">
                              {link.badge}
                            </span>
                          )}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* ── Bottom bar ── */}
          <div className="mt-14 flex flex-col items-center gap-4 border-t border-slate-800/60 pt-8 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3">
              {/* Adapta dot */}
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              </span>
              <p className="text-xs text-slate-600">
                &copy; {year}{" "}
                <a
                  href="https://adapta.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Adapta
                </a>{" "}
                · Todos os direitos reservados
              </p>
            </div>

            <div className="flex items-center gap-5">
              {["Privacidade", "Termos", "Cookies"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-[11px] text-slate-700 transition-colors hover:text-slate-400"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
