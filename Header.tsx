import Link from "next/link";

const links = [
  { href: "/turmas", label: "Turmas" },
  { href: "/planos", label: "Planos" },
  { href: "/avisos", label: "Avisos" },
  { href: "/minha-area", label: "Minha Área" }
];

export function Header() {
  return (
    <header className="relative z-20 mx-auto hidden w-full max-w-5xl items-center justify-between px-5 py-5 md:flex">
      <Link href="/" className="rounded-lg bg-white/80 px-4 py-2 text-sm font-black uppercase text-cris-navy shadow-[0_10px_28px_rgba(7,16,70,0.08)] backdrop-blur">
        Central Zumba do Cris
      </Link>
      <nav className="flex items-center gap-2 rounded-lg bg-white/80 p-1 shadow-[0_10px_28px_rgba(7,16,70,0.08)] backdrop-blur">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="rounded-lg px-4 py-2 text-sm font-black uppercase text-cris-navy hover:bg-cris-yellow/30">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
