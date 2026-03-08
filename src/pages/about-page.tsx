import { Building2, HeartHandshake, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const pillars = [
  {
    title: "Resident-centered intake",
    description:
      "The portal is designed to make assistance intake clearer, more trackable, and easier to follow for residents.",
    icon: HeartHandshake,
  },
  {
    title: "Structured verification",
    description:
      "Applications move through a documented verification process so staff can validate residency and supporting records consistently.",
    icon: ShieldCheck,
  },
  {
    title: "Operational visibility",
    description:
      "The system is being shaped to support dashboards, reports, and an auditable application workflow for the office.",
    icon: Building2,
  },
];

export function AboutPage() {
  return (
    <div className="container space-y-12 py-14">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="space-y-5">
          <Badge>About OMSWD</Badge>
          <h1 className="font-serif text-4xl font-bold md:text-5xl">
            A more usable digital front door for social welfare services.
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            The OMSWD Pandan portal is being built as a single system for public
            information, assistance request intake, verification, and resident tracking.
            Its goal is to reduce fragmented communication and give both residents and
            staff a clearer process from submission to resolution.
          </p>
        </div>

        <Card className="bg-[linear-gradient(165deg,rgba(255,255,255,0.96),rgba(235,245,255,0.88))]">
          <CardHeader>
            <CardTitle>What this platform is for</CardTitle>
            <CardDescription>
              Public website content, structured intake, protected staff workflows, and
              resident-side updates are being brought into one modular application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>Residents can understand services before starting a request.</p>
            <p>Staff can process verified cases through protected administrative routes.</p>
            <p>Residents can return later to track application status and document requests.</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {pillars.map(({ title, description, icon: Icon }) => (
          <Card key={title}>
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </div>
  );
}
