import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { officeContacts } from "@/features/public";

export function ContactPage() {
  return (
    <div className="container space-y-10 py-14">
      <section className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Contact
        </p>
        <h1 className="font-serif text-4xl font-bold md:text-5xl">
          Reach the OMSWD office for assistance follow-up.
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          The public website and resident portal are designed to reduce back-and-forth, but
          office staff still handle case review, verification, and release coordination.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{officeContacts.office}</CardTitle>
            <CardDescription>{officeContacts.municipality}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>{officeContacts.hours}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current communication channels</CardTitle>
            <CardDescription>
              These are the main contact points while the platform continues expanding.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            {officeContacts.channels.map((channel) => (
              <div key={channel} className="rounded-2xl bg-muted/60 px-4 py-3">
                {channel}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
