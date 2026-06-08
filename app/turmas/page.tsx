import Image from "next/image";
import { PageTitle } from "@/components/PageTitle";
import { CalendarIcon, PinIcon } from "@/components/Icons";
import { classes } from "@/lib/data";

const accentClasses = {
  pink: "bg-cris-pink text-white",
  blue: "bg-cris-blue text-white",
  purple: "bg-cris-purple text-white"
};

export default function TurmasPage() {
  return (
    <div className="flex flex-col gap-5">
      <PageTitle eyebrow="Agenda" title="Turmas">
        Escolha o local que combina com sua rotina e venha dançar.
      </PageTitle>

      <section className="grid gap-4 md:grid-cols-3">
        {classes.map((item) => (
          <article key={item.city} className="premium-panel">
            <div className="relative h-48 overflow-hidden bg-cris-navy">
              <Image src={item.image} alt={`Flyer de referência ${item.city}`} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover object-top opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-cris-navy via-cris-navy/20 to-transparent" />
              <div className={`paint-stroke absolute bottom-4 left-4 inline-flex min-h-11 items-center px-4 text-base font-black uppercase ${accentClasses[item.accent]}`}>
                {item.days}
              </div>
            </div>
            <div className="p-5">
              <h2 className="text-3xl font-black uppercase leading-none text-cris-navy">{item.city}</h2>
              <p className="mt-3 text-sm font-bold leading-relaxed text-cris-navy/70">{item.note}</p>
              <div className="mt-5 flex items-center gap-3 text-cris-pink">
                <CalendarIcon className="size-7 shrink-0" />
                <p className="text-3xl font-black text-cris-navy">{item.time}</p>
              </div>
              <div className="mt-4 flex items-start gap-3 text-cris-purple">
                <PinIcon className="mt-0.5 size-6 shrink-0" />
                <p className="text-base font-bold leading-snug text-cris-navy/75">{item.place}</p>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
