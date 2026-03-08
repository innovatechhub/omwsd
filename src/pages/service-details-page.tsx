import { BadgeCheck, FileText, ShieldCheck, Stethoscope } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServiceBySlug } from "@/features/public";

export function ServiceDetailsPage() {
  const { serviceSlug } = useParams();
  const service = getServiceBySlug(serviceSlug ?? "");

  if (!service) {
    return <Navigate to="/services" replace />;
  }

  return (
    <div className="container space-y-10 py-14">
      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            {service.category}
          </p>
          <h1 className="font-serif text-4xl font-bold md:text-5xl">{service.title}</h1>
          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            {service.description}
          </p>
        </div>

        <Card className="bg-[linear-gradient(165deg,rgba(255,255,255,0.96),rgba(235,245,255,0.88))]">
          <CardHeader>
            <CardTitle>Typical review pace</CardTitle>
            <CardDescription>{service.turnaround}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" asChild>
              <Link to="/request-assistance">Request this service</Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/requirements">View requirements guide</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Common requirements</CardTitle>
            <CardDescription>Prepare these before starting the request.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            {service.requirements.map((item, index) => {
              const icons = [FileText, Stethoscope, BadgeCheck, ShieldCheck];
              const Icon = icons[index % icons.length];

              return (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-muted/60 px-4 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span>{item}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How the process works</CardTitle>
            <CardDescription>What usually happens after you submit.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            {service.process.map((item, index) => (
              <div key={item} className="flex gap-4 rounded-2xl bg-muted/60 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {index + 1}
                </div>
                <p>{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
