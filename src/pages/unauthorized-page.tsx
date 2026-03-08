import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function UnauthorizedPage() {
  return (
    <div className="container flex min-h-[calc(100vh-14rem)] items-center justify-center py-12">
      <Card className="w-full max-w-2xl bg-white/95">
        <CardHeader className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Access Control
          </p>
          <CardTitle>Access denied for this portal</CardTitle>
          <CardDescription className="text-base leading-7">
            Your account is signed in, but the current role does not match the route you tried
            to open.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/">Return to home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/login">Switch account</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
