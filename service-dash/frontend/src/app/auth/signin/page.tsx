"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn } from "next-auth/react";

export default function SignIn() {
  const handleSignIn = () => {
    signIn("oidc", { callbackUrl: "/auth/callback" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex flex-col items-center gap-2 mb-4">
            <img
              src="/next-reason-logo.png"
              alt="Next Reason"
              className="h-16 w-auto"
            />
            <span className="text-sm font-medium">Service Dash</span>
          </div>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Sign in with your organization's identity provider
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            size="lg"
            onClick={handleSignIn}
          >
            Sign In with OIDC
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

