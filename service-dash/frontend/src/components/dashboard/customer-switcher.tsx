"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface CustomerSwitcherProps {
  customers: Customer[];
  currentCustomer: Customer | null;
  onCustomerChange: (customer: Customer) => void;
}

export function CustomerSwitcher({
  customers,
  currentCustomer,
  onCustomerChange,
}: CustomerSwitcherProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[250px] justify-between"
        >
          {currentCustomer ? (
            <div className="flex flex-col items-start">
              <span className="font-medium">{currentCustomer.name}</span>
              <span className="text-xs text-muted-foreground">
                {currentCustomer.role}
              </span>
            </div>
          ) : (
            "Select customer..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[250px]">
        <DropdownMenuLabel>Switch Customer</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {customers.map((customer) => (
          <DropdownMenuItem
            key={customer.id}
            onSelect={() => {
              onCustomerChange(customer);
              setOpen(false);
            }}
            className="flex items-center justify-between"
          >
            <div className="flex flex-col">
              <span>{customer.name}</span>
              <span className="text-xs text-muted-foreground">
                {customer.role}
              </span>
            </div>
            {currentCustomer?.id === customer.id && (
              <Check className="h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

