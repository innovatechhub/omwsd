import { BadgeCheck, FileCheck2, FolderOpen, Landmark, UserSquare2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirementsChecklist } from "@/features/public";

export function RequirementsPage() {
  const groupIcons = [UserSquare2, FileCheck2, FolderOpen];
  const itemIcons = [BadgeCheck, Landmark, FileCheck2, FolderOpen];

  return (
    <div className="container space-y-10 py-14">
      <section className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Requirements
        </p>
        <h1 className="font-serif text-4xl font-bold md:text-5xl">
          Prepare documents before you start the request form.
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          The exact checklist depends on the assistance type, but these categories cover
          the core records commonly used during intake and follow-up.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {requirementsChecklist.map((group) => (
          <Card key={group.title}>
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                {(() => {
                  const Icon = groupIcons[requirementsChecklist.indexOf(group)] ?? FileCheck2;
                  return <Icon className="h-6 w-6" />;
                })()}
              </div>
              <CardTitle>{group.title}</CardTitle>
              <CardDescription>Review this before uploading files.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              {group.items.map((item, index) => {
                const Icon = itemIcons[index % itemIcons.length];

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
        ))}
      </section>
    </div>
  );
}
