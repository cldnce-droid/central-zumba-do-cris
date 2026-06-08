import Link from "next/link";
import { CalendarIcon, HomeIcon, MegaphoneIcon, MoneyIcon } from "./Icons";

const items = [
  { href: "/", label: "Inicio", icon: HomeIcon },
  { href: "/turmas", label: "Turmas", icon: CalendarIcon },
  { href: "/planos", label: "Planos", icon: MoneyIcon },
  { href: "/avisos", label: "Avisos", icon: MegaphoneIcon }
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+0.55rem)] pt-2 md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 rounded-lg border border-cris-navy/10 bg-white/[0.94] p-1 shadow-[0_-12px_32px_rgba(7,16,70,0.14)] backdrop-blur">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[0.68rem] font-black uppercase text-cris-navy transition hover:bg-cris-yellow/25">
              <Icon className="size-5 text-cris-pink" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
