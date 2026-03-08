import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { publicAnnouncements } from "@/features/public";

export function AnnouncementsPage() {
  return (
    <div className="container space-y-10 py-14">
      <section className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Announcements
        </p>
        <h1 className="font-serif text-4xl font-bold md:text-5xl">
          Updates for residents using the online intake portal.
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          These notices set expectations for document readiness, account registration, and
          the verification steps that continue after digital submission.
        </p>
      </section>

      <section className="grid gap-6">
        {publicAnnouncements.map((announcement) => (
          <Card key={announcement.slug}>
            <CardHeader>
              <CardDescription>{announcement.date}</CardDescription>
              <CardTitle>{announcement.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-muted-foreground">
              {announcement.summary}
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
