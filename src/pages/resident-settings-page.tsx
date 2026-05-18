import { Bell, KeyRound, Link as LinkIcon, ShieldCheck, UserCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

import { ResidentPageHeader } from "@/components/resident/resident-page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const settingsSections = [
  {
    icon: UserCircle2,
    title: "Personal profile",
    description: "Update your full name, contact number, address, and household details.",
    to: "/resident/profile",
    linkLabel: "Edit profile",
  },
  {
    icon: Bell,
    title: "Notification preferences",
    description: "Notifications are sent to your portal inbox whenever your application status changes or follow-up action is needed.",
    to: null,
    note: "Currently managed by OMSWD administrators. Check your Notifications page for all updates.",
  },
  {
    icon: KeyRound,
    title: "Password and security",
    description: "Change your account password or update your email address through the portal.",
    to: "/resident/profile",
    linkLabel: "Go to profile",
  },
  {
    icon: ShieldCheck,
    title: "Account verification",
    description: "Your identity is verified by OMSWD staff after profile review. Visit the OMSWD office if you need to update your verification status.",
    to: null,
    note: "Verification is handled by OMSWD staff — no action required from you.",
  },
];

export function ResidentSettingsPage() {
  return (
    <div className="space-y-6">
      <ResidentPageHeader
        eyebrow="Settings"
        title="Account settings"
        description="Manage your personal profile, notification preferences, and account security."
        chips={["Profile", "Account"]}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {settingsSections.map(({ icon: Icon, title, description, to, linkLabel, note }) => (
          <Card key={title} className="portal-card border-[var(--portal-outline)] shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--portal-surface-soft)]">
                  <Icon className="h-5 w-5 text-[var(--portal-accent)]" />
                </div>
                <CardTitle className="text-base">{title}</CardTitle>
              </div>
              <CardDescription className="mt-2 text-sm leading-6">{description}</CardDescription>
            </CardHeader>
            <CardContent>
              {to ? (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-[var(--portal-outline)] bg-white hover:bg-[var(--portal-surface-soft)]"
                >
                  <Link to={to}>
                    <LinkIcon className="h-3.5 w-3.5" />
                    {linkLabel}
                  </Link>
                </Button>
              ) : (
                <p className="rounded-lg border border-[var(--portal-outline)] bg-[var(--portal-surface-soft)] px-3 py-2 text-xs text-[var(--portal-muted)]">
                  {note}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="portal-card border-[var(--portal-outline)] shadow-none">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="font-semibold text-[var(--portal-ink)]">Need more help?</p>
            <p className="mt-1 text-sm text-[var(--portal-muted)]">
              Contact the OMSWD office directly for account issues or identity corrections.
            </p>
          </div>
          <Button
            asChild
            className="bg-[var(--portal-accent)] text-white hover:bg-[var(--portal-accent-strong)]"
          >
            <Link to="/contact">Contact OMSWD</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
