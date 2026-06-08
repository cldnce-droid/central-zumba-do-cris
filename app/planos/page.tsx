import { ActionButton } from "@/components/ActionButton";
import { MoneyIcon } from "@/components/Icons";
import { PageTitle } from "@/components/PageTitle";
import { links, plans } from "@/lib/data";

export default function PlanosPage() {
  return (
    <div className="flex flex-col gap-5">
      <PageTitle eyebrow="Valores" title="Planos">
        As aulas podem ser feitas em qualquer local disponível.
      </PageTitle>

      <section className="grid gap-4 md:grid-cols-3">
        {plans.map((plan, index) => (
          <article key={plan.name} className={`${index === 2 ? "bg-cris-navy text-white" : "premium-panel"} relative overflow-hidden rounded-lg p-5 shadow-pop`}>
            {index === 2 ? <div className="paint-stroke absolute -right-8 top-5 h-8 w-40 bg-cris-pink" aria-hidden="true" /> : null}
            <p className="text-sm font-black uppercase text-cris-pink">{plan.name}</p>
            <p className={`mt-3 text-6xl font-black ${index === 2 ? "text-cris-yellow" : "text-cris-navy"}`}>{plan.price}</p>
            <p className={`mt-3 text-sm font-bold ${index === 2 ? "text-white/75" : "text-cris-navy/65"}`}>Mensalidade para manter a rotina no ritmo.</p>
            <div className={`paint-stroke mt-5 h-5 w-28 ${index === 0 ? "bg-cris-blue" : index === 1 ? "bg-cris-yellow" : "bg-cris-purple"}`} />
          </article>
        ))}
      </section>

      <section className="ink-frame p-5 text-white">
        <p className="text-sm font-bold uppercase text-white/70">Pagamento</p>
        <h2 className="mt-2 text-4xl font-black uppercase text-cris-yellow">PIX</h2>
        <p className="mt-2 max-w-xl text-base font-bold text-white/80">Placeholder para inserir a chave depois. Quando tiver a chave pronta, troque em lib/data.ts.</p>
        <div className="mt-4">
          <ActionButton href={links.pix} icon={<MoneyIcon className="size-6" />} variant="yellow" external>
            Pagar com PIX
          </ActionButton>
        </div>
      </section>
    </div>
  );
}
