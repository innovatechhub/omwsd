import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [
  {
    title: "Information collected",
    body:
      "The portal is designed to collect identity, contact, address, request, and document information needed to evaluate assistance applications and manage follow-up actions.",
  },
  {
    title: "How information is used",
    body:
      "Submitted records are used for residency verification, case assessment, status updates, administrative reporting, and related social welfare processing.",
  },
  {
    title: "Access controls",
    body:
      "Protected routes, role-based permissions, and private storage policies are intended to limit access to resident records and uploaded documents.",
  },
  {
    title: "Retention and auditability",
    body:
      "Administrative workflows are being designed with status history, notification, and audit log support so case actions remain traceable.",
  },
];

export function PrivacyPolicyPage() {
  return (
    <div className="container space-y-10 py-14">
      <section className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Privacy Policy
        </p>
        <h1 className="font-serif text-4xl font-bold md:text-5xl">
          Data handling principles for the OMSWD portal.
        </h1>
      </section>

      <section className="grid gap-6">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-muted-foreground">
              {section.body}
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
