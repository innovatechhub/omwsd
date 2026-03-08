import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { publicServices } from "@/features/public";

export function ServicesPage() {
  return (
    <div className="container space-y-10 py-14">
      <section className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Services
        </p>
        <h1 className="font-serif text-4xl font-bold md:text-5xl">
          Public-facing assistance programs and intake guidance.
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          Each service page outlines the purpose of the assistance type, the usual
          document set, and the review flow residents can expect after submission.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {publicServices.map((service) => (
          <Card key={service.slug} className="h-full">
            <CardHeader>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                {service.category}
              </p>
              <CardTitle>{service.title}</CardTitle>
              <CardDescription>{service.summary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm leading-6 text-muted-foreground">{service.description}</p>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link to={`/services/${service.slug}`}>
                    View details
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/request-assistance">Start request</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
