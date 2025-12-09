"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";

interface Customer {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchCustomers();
    }
  }, [session]);

  const fetchCustomers = async () => {
    try {
      // Get the session to access the access token
      const sessionResponse = await fetch('/api/auth/session');
      const sessionData = await sessionResponse.json();
      const accessToken = sessionData?.accessToken;
      
      if (!accessToken) {
        console.error('No access token in session');
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/customers/my-customers`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
        
        // If user has no customers, redirect to onboarding
        if (data.length === 0) {
          router.push("/onboarding");
          return;
        }
        
        if (data.length > 0 && !currentCustomer) {
          const firstCustomer = data[0];
          setCurrentCustomer(firstCustomer);
          // Store in localStorage for persistence
          localStorage.setItem("currentCustomerId", firstCustomer.id);
        }
      } else {
        const errorData = await response.json();
        console.error('API error:', errorData);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (customer: Customer) => {
    setCurrentCustomer(customer);
    // Store in localStorage for persistence
    localStorage.setItem("currentCustomerId", customer.id);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col">
        <DashboardHeader
          user={session.user!}
          customers={customers}
          currentCustomer={currentCustomer}
          onCustomerChange={handleCustomerChange}
        />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

