import { faqItems } from "@/features/public";

export function FaqPage() {
  return (
    <div className="container space-y-10 py-14">
      <section className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">FAQ</p>
        <h1 className="font-serif text-4xl font-bold md:text-5xl">
          Common questions about the OMSWD request workflow.
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          Residents can use this as a quick guide before creating an account, preparing
          documents, and starting a request.
        </p>
      </section>

      <section className="space-y-4">
        {faqItems.map((item) => (
          <details key={item.question} className="panel p-6">
            <summary className="cursor-pointer list-none font-semibold">{item.question}</summary>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">{item.answer}</p>
          </details>
        ))}
      </section>
    </div>
  );
}
