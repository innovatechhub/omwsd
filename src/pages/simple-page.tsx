interface SimplePageProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function SimplePage({ eyebrow, title, description }: SimplePageProps) {
  return (
    <section className="container py-16">
      <div className="panel max-w-3xl p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          {eyebrow}
        </p>
        <h1 className="mt-4 font-serif text-4xl font-bold">{title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{description}</p>
      </div>
    </section>
  );
}
