"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function AuthCallback() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session) {
      checkUserStatus();
    }
  }, [status, session]);

  const checkUserStatus = async () => {
    try {
      // Fetch user info to check customers and invites
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/me`,
        {
          headers: {
            Authorization: `Bearer ${(session as any)?.accessToken}`,
          },
        }
      );

      if (response.ok) {
        const userData = await response.json();

        // Check for pending invites first
        if (userData.pendingInvites > 0) {
          router.push("/invites");
          return;
        }

        // If no customers, go to onboarding
        if (!userData.hasCustomers) {
          router.push("/onboarding");
          return;
        }

        // Otherwise go to dashboard
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error checking user status:", error);
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Setting up your account...</p>
      </div>
    </div>
  );
}

