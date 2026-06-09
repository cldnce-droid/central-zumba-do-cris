import { PageTitle } from "@/components/PageTitle";
import { PixPayment } from "@/components/PixPayment";
import { plans } from "@/lib/data";

export default function PlanosPage() {
  return (
    <div className="flex flex-col gap-5">
      <PageTitle eyebrow="Valores" title="Planos">
        As aulas podem ser feitas em qualquer local disponível.
      </PageTitle>

      <section className="grid gap-4 md:grid-cols-3">
        {plans.map((plan, index) => (
          <article key={plan.name} className={`${index === 2 ? "bg-cris-navy text-white ring-4 ring-cris-yellow shadow-[0_22px_55px_rgba(7,16,70,0.28)] md:-translate-y-2" : "premium-panel"} relative overflow-hidden rounded-lg p-5 shadow-pop`}>
            {index === 2 ? <div className="paint-stroke absolute -right-8 top-5 h-8 w-40 bg-cris-pink" aria-hidden="true" /> : null}
            {index === 2 ? (
              <span className="mb-4 inline-flex rounded-lg bg-cris-yellow px-3 py-1.5 text-xs font-black uppercase text-cris-navy">
                Melhor valor
              </span>
            ) : null}
            <p className="text-sm font-black uppercase text-cris-pink">{plan.name}</p>
            <p className={`mt-3 text-6xl font-black ${index === 2 ? "text-cris-yellow" : "text-cris-navy"}`}>{plan.price}</p>
            <p className={`mt-3 text-sm font-bold ${index === 2 ? "text-white" : "text-cris-navy/65"}`}>{plan.tagline}</p>
            <div className={`paint-stroke mt-5 h-5 w-28 ${index === 0 ? "bg-cris-blue" : index === 1 ? "bg-cris-yellow" : "bg-cris-purple"}`} />
          </article>
        ))}
      </section>

      <PixPayment />
    </div>
  );
}
