"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "You do not have permission to sign in.",
    Verification: "The verification token has expired or has already been used.",
    Default: "An error occurred during authentication.",
  };

  const errorMessage = errorMessages[error || "Default"] || errorMessages.Default;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
          </div>
          <CardTitle>Authentication Error</CardTitle>
          <CardDescription>{errorMessage}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error === "Configuration" && (
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-semibold mb-2">Configuration Issue Detected</p>
              <p className="text-muted-foreground">
                Please check your environment variables:
              </p>
              <ul className="list-disc list-inside mt-2 text-muted-foreground">
                <li>OIDC_ISSUER_URL</li>
                <li>OIDC_CLIENT_ID</li>
                <li>OIDC_CLIENT_SECRET</li>
                <li>NEXTAUTH_SECRET</li>
              </ul>
            </div>
          )}
          <Link href="/auth/signin" className="block">
            <Button className="w-full">Try Again</Button>
          </Link>
          <Link href="/" className="block">
            <Button variant="outline" className="w-full">
              Back to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

