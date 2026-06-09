import { MegaphoneIcon } from "@/components/Icons";
import { NotificationOptIn } from "@/components/NotificationOptIn";
import { notices } from "@/lib/data";

const accentStyles = {
  pink: "bg-cris-pink text-white",
  blue: "bg-cris-blue text-white",
  purple: "bg-cris-purple text-white",
  yellow: "bg-cris-yellow text-cris-navy"
};

export default function AvisosPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="relative overflow-hidden px-1 py-4 sm:py-7">
        <div
          aria-hidden="true"
          className="paint-stroke absolute right-0 top-2 h-8 w-40 bg-cris-yellow opacity-90"
        />
        <p className="text-sm font-black uppercase text-cris-pink">
          O que está acontecendo por aqui
        </p>
        <h1 className="text-balance mt-2 max-w-3xl text-4xl font-black uppercase leading-none text-cris-navy sm:text-6xl">
          📢 Mural da Comunidade
        </h1>
        <p className="mt-4 max-w-2xl text-lg font-bold leading-relaxed text-cris-navy/70">
          Acompanhe novidades, lembretes e tudo o que acontece no Zumba do Cris.
        </p>
      </header>

      <NotificationOptIn />

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase text-cris-blue">
              Novidades da nossa comunidade
            </p>
            <h2 className="mt-1 text-3xl font-black uppercase text-cris-navy">
              Últimos recados
            </h2>
          </div>
          <span aria-hidden="true" className="text-3xl">
            💃
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {notices.map((notice, index) => (
            <article
              key={notice.title}
              className={`relative overflow-hidden rounded-lg border border-cris-navy/10 bg-white p-5 shadow-[0_16px_42px_rgba(7,16,70,0.1)] ${
                index % 3 === 1 ? "sm:translate-y-3" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 py-2 text-xs font-black uppercase ${accentStyles[notice.accent]}`}
                >
                  <MegaphoneIcon className="size-4" />
                  {notice.category}
                </span>
                {"date" in notice ? (
                  <time className="pt-2 text-xs font-bold text-cris-navy/45">
                    {notice.date}
                  </time>
                ) : null}
              </div>

              <h3 className="mt-5 text-2xl font-black leading-tight text-cris-navy">
                {notice.title}
              </h3>
              <p className="mt-3 text-base font-bold leading-relaxed text-cris-navy/70">
                {notice.description}
              </p>

              <div
                aria-hidden="true"
                className={`paint-stroke mt-6 h-3 w-28 ${
                  notice.accent === "pink"
                    ? "bg-cris-pink"
                    : notice.accent === "blue"
                      ? "bg-cris-blue"
                      : notice.accent === "purple"
                        ? "bg-cris-purple"
                        : "bg-cris-yellow"
                }`}
              />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
