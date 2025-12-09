"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Invite {
  id: string;
  customerId: string;
  role: string;
  status: string;
}

export default function InvitesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchInvites();
    }
  }, [session]);

  const fetchInvites = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/invites/pending`,
        {
          headers: {
            Authorization: `Bearer ${(session as any)?.accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setInvites(data);
        
        // If no invites, redirect to onboarding
        if (data.length === 0) {
          router.push("/onboarding");
        }
      }
    } catch (error) {
      console.error("Error fetching invites:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (inviteId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/invites/${inviteId}/accept`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${(session as any)?.accessToken}`,
          },
        }
      );

      if (response.ok) {
        // Remove from list and check if more invites exist
        const remaining = invites.filter((inv) => inv.id !== inviteId);
        setInvites(remaining);
        
        if (remaining.length === 0) {
          // If no more invites, go to dashboard
          router.push("/dashboard");
        }
      }
    } catch (error) {
      console.error("Error accepting invite:", error);
    }
  };

  const handleDecline = async (inviteId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/invites/${inviteId}/decline`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${(session as any)?.accessToken}`,
          },
        }
      );

      if (response.ok) {
        const remaining = invites.filter((inv) => inv.id !== inviteId);
        setInvites(remaining);
        
        if (remaining.length === 0) {
          // If no more invites, go to onboarding
          router.push("/onboarding");
        }
      }
    } catch (error) {
      console.error("Error declining invite:", error);
    }
  };

  if (loading) {
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <div className="w-full max-w-2xl space-y-4">
        <div className="text-center mb-8">
          <div className="flex flex-col items-center gap-2 mb-4">
            <img
              src="/next-reason-logo.png"
              alt="Next Reason"
              className="h-16 w-auto"
            />
            <span className="text-sm font-medium">Service Dash</span>
          </div>
          <h1 className="text-3xl font-bold">You Have Pending Invites</h1>
          <p className="text-muted-foreground mt-2">
            Accept or decline invitations to join customers
          </p>
        </div>

        {invites.map((invite) => (
          <Card key={invite.id}>
            <CardHeader>
              <CardTitle>Invitation to Join Customer</CardTitle>
              <CardDescription>
                You've been invited to join as a {invite.role}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button onClick={() => handleAccept(invite.id)}>
                Accept Invite
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDecline(invite.id)}
              >
                Decline
              </Button>
            </CardContent>
          </Card>
        ))}

        <div className="text-center mt-6">
          <Button
            variant="link"
            onClick={() => router.push("/onboarding")}
          >
            Skip and create your own customer
          </Button>
        </div>
      </div>
    </div>
  );
}

