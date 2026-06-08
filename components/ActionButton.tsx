import Link from "next/link";
import type { ReactNode } from "react";

type ActionButtonProps = {
  href: string;
  children: ReactNode;
  icon: ReactNode;
  variant?: "pink" | "navy" | "blue" | "yellow" | "purple";
  external?: boolean;
};

const variants = {
  pink: "bg-cris-pink text-white shadow-[0_12px_28px_rgba(242,7,114,0.28)]",
  navy: "bg-cris-navy text-white shadow-[0_12px_28px_rgba(7,16,70,0.2)]",
  blue: "bg-cris-blue text-white shadow-[0_12px_28px_rgba(18,158,232,0.25)]",
  yellow: "bg-cris-yellow text-cris-navy shadow-[0_12px_28px_rgba(255,196,0,0.26)]",
  purple: "bg-cris-purple text-white shadow-[0_12px_28px_rgba(109,43,191,0.24)]"
};

export function ActionButton({
  href,
  children,
  icon,
  variant = "pink",
  external = false
}: ActionButtonProps) {
  const className = `inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-lg px-5 py-3 text-center text-base font-black uppercase leading-tight transition duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-cris-yellow/45 ${variants[variant]}`;
  const isPlaceholder = href === "#";

  if (external) {
    return (
      <a className={className} href={href} target={isPlaceholder ? undefined : "_blank"} rel={isPlaceholder ? undefined : "noreferrer"}>
        <span className="grid size-6 shrink-0 place-items-center">{icon}</span>
        <span>{children}</span>
      </a>
    );
  }

  return (
    <Link className={className} href={href}>
      <span className="grid size-6 shrink-0 place-items-center">{icon}</span>
      <span>{children}</span>
    </Link>
  );
}
