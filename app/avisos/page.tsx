import { MegaphoneIcon } from "@/components/Icons";
import { PageTitle } from "@/components/PageTitle";
import { notices } from "@/lib/data";

export default function AvisosPage() {
  return (
    <div className="flex flex-col gap-5">
      <PageTitle eyebrow="Recados" title="Avisos">
        Cards simples para atualizar direto no código.
      </PageTitle>

      <section className="grid gap-4 md:grid-cols-3">
        {notices.map((notice) => (
          <article key={notice.title} className="premium-panel p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-cris-pink text-white">
                <MegaphoneIcon className="size-6" />
              </span>
              <span className="text-xs font-black uppercase text-cris-blue">{notice.tag}</span>
            </div>
            <h2 className="text-2xl font-black uppercase leading-tight text-cris-navy">{notice.title}</h2>
            <p className="mt-3 text-base font-bold leading-relaxed text-cris-navy/70">{notice.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
