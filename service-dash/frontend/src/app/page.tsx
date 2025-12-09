"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/auth/callback");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted">
      <div className="text-center space-y-6 p-8">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/next-reason-logo.png"
            alt="Next Reason"
            className="h-24 w-auto"
          />
          <p className="text-xl font-semibold">Service Dash</p>
        </div>

        <p className="text-lg text-muted-foreground max-w-md">
          A modern, multi-tenant dashboard application for managing your
          services and customers.
        </p>

        <div className="flex gap-4 justify-center">
          <Link href="/auth/signin">
            <Button size="lg">Sign In</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
