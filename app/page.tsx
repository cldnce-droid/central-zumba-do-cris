import Image from "next/image";
import { ActionButton } from "@/components/ActionButton";
import { InstallPrompt } from "@/components/InstallPrompt";
import { CalendarIcon, MessageIcon, MoneyIcon, PinIcon, UsersIcon } from "@/components/Icons";
import { classes, highlights, links, plans } from "@/lib/data";

export default function Home() {
  return (
    <div className="flex flex-col gap-5 md:gap-8">
      <InstallPrompt />

      <section className="grid gap-5 md:grid-cols-[0.92fr_1.08fr] md:items-stretch md:gap-7">
        <div className="ink-frame min-h-[25rem] overflow-hidden p-3">
          <div className="relative flex h-full min-h-[24rem] items-center justify-center overflow-hidden rounded-lg bg-white">
            <Image
              src={links.officialLogo}
              alt="Logo oficial Zumba do Cris"
              width={1536}
              height={1024}
              priority
              className="h-auto w-full scale-[2] object-contain"
            />
          </div>
        </div>

        <div className="flex flex-col justify-between gap-5">
          <div className="premium-panel p-5 sm:p-7">
            <div className="paint-stroke absolute -right-8 top-7 h-9 w-44 bg-cris-pink" aria-hidden="true" />
            <p className="text-sm font-black uppercase text-cris-blue">Central premium</p>
            <h1 className="text-balance mt-2 text-5xl font-black uppercase leading-none text-cris-navy sm:text-7xl">
              Zumba do Cris
            </h1>
            <p className="mt-4 max-w-xl text-lg font-black uppercase leading-tight text-cris-navy/80">
              Turmas, planos, avisos e contato em uma central feita para abrir no celular como app.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-2">
              {highlights.map((item) => (
                <div key={item.label} className="rounded-lg bg-cris-navy px-3 py-4 text-center text-white">
                  <p className="text-2xl font-black text-cris-yellow">{item.value}</p>
                  <p className="mt-1 text-[0.68rem] font-black uppercase tracking-wide text-white/70">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ActionButton href="/turmas" icon={<CalendarIcon className="size-6" />} variant="pink">
              Ver Turmas
            </ActionButton>
            <ActionButton href="/planos" icon={<MoneyIcon className="size-6" />} variant="yellow">
              Planos
            </ActionButton>
            <ActionButton href={links.group} icon={<UsersIcon className="size-6" />} variant="purple" external>
              Entrar no Grupo
            </ActionButton>
            <ActionButton href={links.whatsapp} icon={<MessageIcon className="size-6" />} variant="blue" external>
              Falar no WhatsApp
            </ActionButton>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {classes.map((item) => (
          <article key={item.city} className="premium-panel grid min-h-28 place-items-center p-5 text-center">
            <div>
              <h2 className="text-2xl font-black uppercase text-cris-navy sm:text-3xl">{item.city}</h2>
              <p className="mt-2 text-sm font-black uppercase text-cris-pink">{item.days}</p>
              <p className="mt-1 text-2xl font-black text-cris-blue">{item.time}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-5 md:grid-cols-[0.8fr_1.2fr] md:items-stretch">
        <div className="rounded-lg bg-cris-navy p-5 text-white shadow-pop">
          <p className="text-sm font-bold uppercase text-white/70">Planos a partir de</p>
          <p className="mt-2 text-6xl font-black text-cris-yellow">{plans[0].price}</p>
          <p className="mt-3 text-base font-bold text-white/80">Aulas em qualquer local disponível.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {classes.map((item) => (
            <a
              key={item.city}
              href={item.mapUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Abrir ${item.city} no Google Maps`}
              className="group relative min-h-52 overflow-hidden rounded-lg bg-cris-navy shadow-pop transition duration-200 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-cris-yellow/60"
            >
              <Image
                src={item.image}
                alt={`Foto do local da turma em ${item.city}`}
                fill
                sizes="(min-width: 768px) 20vw, 100vw"
                className="object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-cris-navy via-cris-navy/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-white">
                <div>
                  <p className="text-xl font-black uppercase">{item.city}</p>
                  <p className="mt-1 text-xs font-bold text-white/80">{item.place}</p>
                </div>
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-cris-yellow text-cris-navy">
                  <PinIcon className="size-5" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
