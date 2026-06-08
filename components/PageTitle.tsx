import type { ReactNode } from "react";

type PageTitleProps = {
  eyebrow: string;
  title: string;
  children?: ReactNode;
};

export function PageTitle({ eyebrow, title, children }: PageTitleProps) {
  return (
    <section className="premium-panel p-5 sm:p-7">
      <div className="paint-stroke absolute -right-10 top-5 h-8 w-36 bg-cris-blue" />
      <p className="text-sm font-black uppercase text-cris-pink">{eyebrow}</p>
      <h1 className="mt-2 text-4xl font-black uppercase leading-none text-cris-navy sm:text-6xl">{title}</h1>
      {children ? <p className="mt-3 text-base font-bold leading-relaxed text-cris-navy/75">{children}</p> : null}
    </section>
  );
}
