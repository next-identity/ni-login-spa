"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { providers, categories, type Provider, type ProviderCategory } from "@/lib/providers";
import { Settings, CheckCircle2 } from "lucide-react";

export default function ConnectionsPage() {
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [connectedProviders, setConnectedProviders] = useState<Set<string>>(new Set());

  const handleConfigure = (provider: Provider) => {
    setSelectedProvider(provider);
    setConfigValues({});
    setConfigDialogOpen(true);
  };

  const handleViewDetails = (provider: Provider) => {
    setSelectedProvider(provider);
    setViewDetailsOpen(true);
  };

  const handleSaveConfig = () => {
    if (selectedProvider) {
      // For now, just mark as connected (backend integration later)
      setConnectedProviders(new Set([...connectedProviders, selectedProvider.id]));
      setConfigDialogOpen(false);
      setSelectedProvider(null);
      setConfigValues({});
    }
  };

  const isConnected = (providerId: string) => connectedProviders.has(providerId);

  const ProviderCard = ({ provider }: { provider: Provider }) => {
    const connected = isConnected(provider.id);

    return (
      <Card className="group relative overflow-hidden transition-all hover:shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg border bg-card p-2 flex items-center justify-center">
                <img
                  src={provider.logo}
                  alt={provider.name}
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/next-reason-logo.png";
                  }}
                />
              </div>
              <div>
                <CardTitle className="text-lg">{provider.name}</CardTitle>
                {connected && (
                  <Badge variant="default" className="mt-1">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Connected
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <CardDescription className="line-clamp-2">
            {provider.description}
          </CardDescription>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => handleViewDetails(provider)}
            >
              View Details
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => handleConfigure(provider)}
            >
              <Settings className="mr-2 h-4 w-4" />
              {connected ? "Reconfigure" : "Configure"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const CategorySection = ({ category }: { category: ProviderCategory }) => {
    const categoryProviders = providers.filter((p) => p.category === category);

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">{categories[category]}</h2>
          <p className="text-muted-foreground">
            Connect and configure your {categories[category].toLowerCase()} integration
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categoryProviders.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Connections</h1>
        <p className="text-muted-foreground">
          Connect and manage integrations with external service providers
        </p>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Providers</TabsTrigger>
          <TabsTrigger value="identity">Identity</TabsTrigger>
          <TabsTrigger value="cdn">CDN</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="itsm">ITSM</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-8">
          {(Object.keys(categories) as ProviderCategory[]).map((category) => (
            <CategorySection key={category} category={category} />
          ))}
        </TabsContent>

        {(Object.keys(categories) as ProviderCategory[]).map((category) => (
          <TabsContent key={category} value={category}>
            <CategorySection category={category} />
          </TabsContent>
        ))}
      </Tabs>

      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedProvider && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-lg border bg-card p-2 flex items-center justify-center">
                    <img
                      src={selectedProvider.logo}
                      alt={selectedProvider.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div>
                    <DialogTitle>Configure {selectedProvider.name}</DialogTitle>
                    <DialogDescription>
                      {categories[selectedProvider.category]}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                <div className="rounded-lg bg-muted p-4">
                  <h4 className="font-semibold mb-2">Installation Instructions</h4>
                  <pre className="text-sm whitespace-pre-wrap text-muted-foreground">
                    {selectedProvider.installationInstructions.trim()}
                  </pre>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Configuration</h4>
                  {selectedProvider.configFields.map((field) => (
                    <div key={field.name} className="space-y-2">
                      <Label htmlFor={field.name}>
                        {field.label}
                        {field.required && (
                          <span className="text-destructive ml-1">*</span>
                        )}
                      </Label>
                      <Input
                        id={field.name}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={configValues[field.name] || ""}
                        onChange={(e) =>
                          setConfigValues({
                            ...configValues,
                            [field.name]: e.target.value,
                          })
                        }
                        required={field.required}
                      />
                      {field.helpText && (
                        <p className="text-xs text-muted-foreground">
                          {field.helpText}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setConfigDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveConfig}>
                  Save Configuration
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-2xl">
          {selectedProvider && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-16 w-16 rounded-lg border bg-card p-3 flex items-center justify-center">
                    <img
                      src={selectedProvider.logo}
                      alt={selectedProvider.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl">
                      {selectedProvider.name}
                    </DialogTitle>
                    <DialogDescription>
                      {categories[selectedProvider.category]}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedProvider.description}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Installation Instructions</h4>
                  <pre className="text-sm whitespace-pre-wrap text-muted-foreground bg-muted p-4 rounded-lg">
                    {selectedProvider.installationInstructions.trim()}
                  </pre>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Required Configuration</h4>
                  <ul className="space-y-2">
                    {selectedProvider.configFields.map((field) => (
                      <li key={field.name} className="text-sm flex items-center gap-2">
                        <span className="font-medium">{field.label}</span>
                        {field.required && (
                          <Badge variant="secondary" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setViewDetailsOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setViewDetailsOpen(false);
                    handleConfigure(selectedProvider);
                  }}
                >
                  Configure Now
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

