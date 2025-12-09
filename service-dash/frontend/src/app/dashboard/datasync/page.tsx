"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  Settings2,
  FileCode2,
  BarChart3,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Server,
  ArrowRight,
  Play,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Copy,
  Code,
  Eye,
  GripVertical,
  ArrowRightLeft,
  Variable,
  GitBranch,
  Type,
  Eraser,
} from "lucide-react";

// Types
interface CustomerConfig {
  customerId: string;
  inputSystems: any[];
  outputSystem: any;
  transformRules?: TransformRule[];
  planId?: string;
  planAssignedAt?: number;
  createdAt?: number;
  updatedAt?: number;
  pk?: string;
  sk?: string;
}

interface Plan {
  id: string;
  name: string;
  rate_limit: number;
  burst_limit: number;
  quota: number;
}

interface TransformRule {
  id: string;
  version: string;
  description: string;
  sourceSystem: string;
  steps: any[];
}

interface UsageRecord {
  windowId: string;
  tokensUsed: number;
  syncCount: number;
  failedSyncCount: number;
  lastSyncAt: number;
}

interface DlqStats {
  queueName: string;
  approximateNumberOfMessages: number;
  approximateNumberOfMessagesNotVisible: number;
  queueUrl: string;
}

interface DlqMessage {
  messageId: string;
  receiptHandle: string;
  body: any;
  attributes: any;
  approximateReceiveCount: number;
  sentTimestamp: number;
}

interface HealthStatus {
  status: "healthy" | "unhealthy";
  version?: string;
  timestamp?: number;
  dependencies?: Record<string, { status: string; latency: number }>;
}

export default function DataSyncPage() {
  const { data: session } = useSession();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Data states
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [datasyncCustomers, setDatasyncCustomers] = useState<string[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [customerConfig, setCustomerConfig] = useState<CustomerConfig | null>(null);
  const [plans, setPlans] = useState<Record<string, Plan>>({});
  const [customerPlan, setCustomerPlan] = useState<any>(null);
  const [transformRules, setTransformRules] = useState<TransformRule[]>([]);
  const [usageData, setUsageData] = useState<UsageRecord[]>([]);
  const [dlqStats, setDlqStats] = useState<Record<string, DlqStats>>({});
  const [dlqMessages, setDlqMessages] = useState<Record<string, DlqMessage[]>>({});
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  
  // Dialog states
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<TransformRule | null>(null);
  
  // Form states
  const [configForm, setConfigForm] = useState({
    akamaiEndpoint: "",
    akamaiCredentialsArn: "",
    auth0Domain: "",
    auth0CredentialsArn: "",
  });
  const [ruleForm, setRuleForm] = useState({
    id: "",
    version: "1.0",
    description: "",
    sourceSystem: "AKAMAI_IDENTITY_CLOUD",
    steps: [] as any[],
  });
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState("[]");

  // Fetch access token
  useEffect(() => {
    const fetchToken = async () => {
      const sessionResponse = await fetch("/api/auth/session");
      const sessionData = await sessionResponse.json();
      setAccessToken(sessionData?.accessToken || null);
    };
    if (session) fetchToken();
  }, [session]);

  // Fetch initial data - customers from DataSync API
  useEffect(() => {
    if (accessToken) {
      fetchHealthStatus();
      fetchDatasyncCustomers();
      fetchPlans();
    }
  }, [accessToken]);

  // Fetch customer-specific data when selected customer changes
  useEffect(() => {
    if (accessToken && selectedCustomer) {
      fetchCustomerConfig();
      fetchCustomerPlan();
      fetchUsageData();
    } else {
      // Clear customer-specific data when no customer is selected
      setCustomerConfig(null);
      setTransformRules([]);
      setCustomerPlan(null);
      setUsageData([]);
    }
  }, [accessToken, selectedCustomer]);

  // Fetch DLQ data when on DLQ tab
  useEffect(() => {
    if (accessToken && activeTab === "dlq") {
      fetchDlqStats();
    }
  }, [accessToken, activeTab]);

  const apiHeaders = () => ({
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "x-customer-id": selectedCustomer,
  });

  // API Functions
  const fetchHealthStatus = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/datasync/health?deep=true`,
        { headers: apiHeaders() }
      );
      if (response.ok) {
        const data = await response.json();
        setHealthStatus(data);
      }
    } catch (error) {
      console.error("Error fetching health status:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDatasyncCustomers = async () => {
    setCustomersLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/datasync/config/customers`,
        { headers: apiHeaders() }
      );
      if (response.ok) {
        const data = await response.json();
        // API returns { customerIds: [...] }
        const customerList = data.customerIds || data.customers || [];
        setDatasyncCustomers(customerList);
        // Auto-select first customer if none selected
        if (customerList.length > 0 && !selectedCustomer) {
          setSelectedCustomer(customerList[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching DataSync customers:", error);
    } finally {
      setCustomersLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/datasync/config/plans`,
        { headers: apiHeaders() }
      );
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || {});
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    }
  };

  const fetchCustomerConfig = async () => {
    setConfigLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/datasync/config/customer/${selectedCustomer}`,
        { headers: apiHeaders() }
      );
      if (response.ok) {
        const data = await response.json();
        const config = data.config;
        setCustomerConfig(config);
        
        // Extract transform rules from config (they're embedded in the response)
        if (config?.transformRules) {
          setTransformRules(config.transformRules);
        } else {
          setTransformRules([]);
        }
        
        // Populate form with existing config
        if (config) {
          const input = config.inputSystems?.[0]?.akamaiIdentityCloud || {};
          const output = config.outputSystem || {};
          setConfigForm({
            akamaiEndpoint: input.apiEndpoint || "",
            akamaiCredentialsArn: input.credentialsSecretArn || "",
            auth0Domain: output.auth0Domain || "",
            auth0CredentialsArn: output.credentialsSecretArn || "",
          });
        }
      } else if (response.status === 404) {
        setCustomerConfig(null);
        setTransformRules([]);
      }
    } catch (error) {
      console.error("Error fetching customer config:", error);
    } finally {
      setConfigLoading(false);
    }
  };

  const fetchCustomerPlan = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/datasync/config/customer/${selectedCustomer}/plan`,
        { headers: apiHeaders() }
      );
      if (response.ok) {
        const data = await response.json();
        setCustomerPlan(data);
      }
    } catch (error) {
      console.error("Error fetching customer plan:", error);
    }
  };

  const fetchUsageData = async () => {
    try {
      // Get last 30 days
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/datasync/usage/customer/${selectedCustomer}?startWindow=${startDate}&endWindow=${endDate}`,
        { headers: apiHeaders() }
      );
      if (response.ok) {
        const data = await response.json();
        setUsageData(data.usage || []);
      }
    } catch (error) {
      console.error("Error fetching usage data:", error);
    }
  };

  const fetchDlqStats = async () => {
    const queues = ["listen", "transform", "send"];
    const stats: Record<string, DlqStats> = {};
    const messages: Record<string, DlqMessage[]> = {};
    
    for (const queue of queues) {
      try {
        const statsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/datasync/dlq/${queue}/stats`,
          { headers: apiHeaders() }
        );
        if (statsResponse.ok) {
          stats[queue] = await statsResponse.json();
        }
        
        const messagesResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/datasync/dlq/${queue}?maxMessages=10`,
          { headers: apiHeaders() }
        );
        if (messagesResponse.ok) {
          const data = await messagesResponse.json();
          messages[queue] = data.messages || [];
        }
      } catch (error) {
        console.error(`Error fetching DLQ ${queue}:`, error);
      }
    }
    
    setDlqStats(stats);
    setDlqMessages(messages);
  };

  const saveCustomerConfig = async () => {
    setSavingConfig(true);
    try {
      const configData = {
        config: {
          customerId: selectedCustomer,
          inputSystems: [
            {
              akamaiIdentityCloud: {
                systemType: "AKAMAI_IDENTITY_CLOUD",
                apiEndpoint: configForm.akamaiEndpoint,
                credentialsSecretArn: configForm.akamaiCredentialsArn,
              },
            },
          ],
          outputSystem: {
            systemType: "AUTH0",
            auth0Domain: configForm.auth0Domain,
            credentialsSecretArn: configForm.auth0CredentialsArn,
          },
        },
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/datasync/config/customer/${selectedCustomer}`,
        {
          method: "PUT",
          headers: apiHeaders(),
          body: JSON.stringify(configData),
        }
      );

      if (response.ok) {
        setConfigDialogOpen(false);
        fetchCustomerConfig();
      } else {
        const error = await response.json();
        alert(`Error saving configuration: ${error.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error saving config:", error);
      alert("Failed to save configuration");
    } finally {
      setSavingConfig(false);
    }
  };

  const assignPlan = async (planId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/datasync/config/customer/${selectedCustomer}/plan`,
        {
          method: "PUT",
          headers: apiHeaders(),
          body: JSON.stringify({ planId }),
        }
      );
      if (response.ok) {
        fetchCustomerPlan();
      }
    } catch (error) {
      console.error("Error assigning plan:", error);
    }
  };

  const saveTransformRule = async () => {
    try {
      // Get steps from either JSON mode or visual mode
      let steps;
      if (jsonMode) {
        try {
          steps = JSON.parse(jsonText);
        } catch (e) {
          alert("Invalid JSON in steps editor");
          return;
        }
      } else {
        steps = ruleForm.steps;
      }

      const ruleData = {
        rule: {
          id: ruleForm.id,
          version: ruleForm.version,
          description: ruleForm.description,
          sourceSystem: ruleForm.sourceSystem,
          steps,
        },
      };

      const isUpdate = editingRule !== null;
      const url = isUpdate
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/datasync/config/transform-rule/${ruleForm.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/datasync/config/transform-rule`;

      const response = await fetch(url, {
        method: isUpdate ? "PUT" : "POST",
        headers: apiHeaders(),
        body: JSON.stringify(ruleData),
      });

      if (response.ok) {
        setRuleDialogOpen(false);
        setEditingRule(null);
        resetRuleForm();
        fetchCustomerConfig();
      } else {
        const error = await response.json();
        alert(`Error saving rule: ${error.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error saving transform rule:", error);
      alert("Failed to save transform rule");
    }
  };

  const resetRuleForm = () => {
    setRuleForm({ id: "", version: "1.0", description: "", sourceSystem: "AKAMAI_IDENTITY_CLOUD", steps: [] });
    setJsonMode(false);
    setJsonText("[]");
  };

  const addStep = (type: string) => {
    const newStep: any = {};
    switch (type) {
      case "pick":
        newStep.pick = { from: "", to: "" };
        break;
      case "set":
        newStep.set = { value: "", to: "" };
        break;
      case "rename":
        newStep.rename = { from: "", to: "" };
        break;
      case "template":
        newStep.template = { to: "", expr: "" };
        break;
      case "condition":
        newStep.condition = {
          condition: { exists: { field: "" } },
          to: "",
          thenValue: true,
          elseValue: false,
        };
        break;
      case "convert":
        newStep.convert = { from: "", to: "", toType: "string", defaultValue: "" };
        break;
      case "remove":
        newStep.remove = { path: "", onlyIfNull: false, removeEmptyParents: false };
        break;
    }
    setRuleForm({ ...ruleForm, steps: [...ruleForm.steps, newStep] });
  };

  const updateStep = (index: number, step: any) => {
    const newSteps = [...ruleForm.steps];
    newSteps[index] = step;
    setRuleForm({ ...ruleForm, steps: newSteps });
  };

  const removeStep = (index: number) => {
    const newSteps = ruleForm.steps.filter((_, i) => i !== index);
    setRuleForm({ ...ruleForm, steps: newSteps });
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    const newSteps = [...ruleForm.steps];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSteps.length) return;
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    setRuleForm({ ...ruleForm, steps: newSteps });
  };

  const getStepType = (step: any): string => {
    if (step.pick) return "pick";
    if (step.set) return "set";
    if (step.rename) return "rename";
    if (step.template) return "template";
    if (step.condition) return "condition";
    if (step.convert) return "convert";
    if (step.remove) return "remove";
    return "unknown";
  };

  const deleteTransformRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this transform rule?")) return;
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/datasync/config/transform-rule/${ruleId}`,
        {
          method: "DELETE",
          headers: apiHeaders(),
        }
      );
      if (response.ok) {
        fetchTransformRules();
      }
    } catch (error) {
      console.error("Error deleting transform rule:", error);
    }
  };

  const resendDlqMessage = async (queueName: string, receiptHandle: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/datasync/dlq/${queueName}/resend`,
        {
          method: "POST",
          headers: apiHeaders(),
          body: JSON.stringify({ receiptHandle }),
        }
      );
      if (response.ok) {
        fetchDlqStats();
      }
    } catch (error) {
      console.error("Error resending message:", error);
    }
  };

  const resendAllDlqMessages = async (queueName: string) => {
    if (!confirm(`Are you sure you want to resend all messages in the ${queueName} DLQ?`)) return;
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/datasync/dlq/${queueName}/resend-all`,
        {
          method: "POST",
          headers: apiHeaders(),
        }
      );
      if (response.ok) {
        fetchDlqStats();
      }
    } catch (error) {
      console.error("Error resending all messages:", error);
    }
  };

  const purgeDlq = async (queueName: string) => {
    if (!confirm(`Are you sure you want to purge all messages in the ${queueName} DLQ? This cannot be undone.`)) return;
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/datasync/dlq/${queueName}/purge`,
        {
          method: "DELETE",
          headers: apiHeaders(),
        }
      );
      if (response.ok) {
        fetchDlqStats();
      }
    } catch (error) {
      console.error("Error purging DLQ:", error);
    }
  };

  // Calculate usage totals
  const usageTotals = usageData.reduce(
    (acc, record) => ({
      totalSyncs: acc.totalSyncs + record.syncCount,
      totalFailed: acc.totalFailed + record.failedSyncCount,
      totalTokens: acc.totalTokens + record.tokensUsed,
    }),
    { totalSyncs: 0, totalFailed: 0, totalTokens: 0 }
  );

  const totalDlqMessages = Object.values(dlqStats).reduce(
    (sum, stat) => sum + (stat?.approximateNumberOfMessages || 0),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">DataSync</h1>
          <p className="text-muted-foreground">
            Manage data synchronization configurations and monitor usage
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder={customersLoading ? "Loading customers..." : "Select a DataSync customer"} />
            </SelectTrigger>
            <SelectContent>
              {datasyncCustomers.length === 0 && !customersLoading && (
                <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                  No DataSync customers found
                </div>
              )}
              {datasyncCustomers.map((customerId) => (
                <SelectItem key={customerId} value={customerId}>
                  {customerId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => {
              fetchHealthStatus();
              fetchDatasyncCustomers();
              if (selectedCustomer) {
                fetchCustomerConfig();
                fetchUsageData();
              }
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Health Status Banner */}
      {healthStatus && (
        <Card className={healthStatus.status === "healthy" ? "border-green-500/50 bg-green-500/5" : "border-red-500/50 bg-red-500/5"}>
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {healthStatus.status === "healthy" ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">
                  DataSync Service: {healthStatus.status === "healthy" ? "Operational" : "Degraded"}
                </span>
                {healthStatus.version && (
                  <Badge variant="outline" className="ml-2">v{healthStatus.version}</Badge>
                )}
              </div>
              {healthStatus.dependencies && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {Object.entries(healthStatus.dependencies).map(([name, dep]) => (
                    <span key={name} className="flex items-center gap-1">
                      {dep.status === "healthy" ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500" />
                      )}
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="transforms" className="flex items-center gap-2">
            <FileCode2 className="h-4 w-4" />
            Transform Rules
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Usage
          </TabsTrigger>
          <TabsTrigger value="dlq" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            DLQ
            {totalDlqMessages > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                {totalDlqMessages}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {!selectedCustomer ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select a Customer</h3>
                  <p className="text-muted-foreground">
                    Choose a DataSync customer from the dropdown above to view their overview.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
          <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Syncs (30d)</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageTotals.totalSyncs.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {usageTotals.totalFailed} failed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageTotals.totalSyncs > 0
                    ? ((1 - usageTotals.totalFailed / usageTotals.totalSyncs) * 100).toFixed(1)
                    : 100}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">
                  {customerPlan?.planName || "None"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {customerPlan?.limits?.quotaLimit?.toLocaleString() || 0} requests/month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">DLQ Messages</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDlqMessages}</div>
                <p className="text-xs text-muted-foreground">
                  Pending retry
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Status Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configuration Status</CardTitle>
              </CardHeader>
              <CardContent>
                {customerConfig ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Input System</span>
                      <Badge variant="secondary">
                        {customerConfig.inputSystems?.[0]?.akamaiIdentityCloud ? "Akamai Identity Cloud" : "Not configured"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Output System</span>
                      <Badge variant="secondary">
                        {customerConfig.outputSystem?.systemType || "Not configured"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Transform Rules</span>
                      <Badge variant="secondary">{transformRules.length} rules</Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-4">No configuration found</p>
                    <Button onClick={() => {
                      setActiveTab("configuration");
                      setConfigDialogOpen(true);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Configuration
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center gap-4 py-4">
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
                      <Server className="h-6 w-6 text-blue-500" />
                    </div>
                    <span className="text-xs text-muted-foreground">Akamai</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-2">
                      <FileCode2 className="h-6 w-6 text-purple-500" />
                    </div>
                    <span className="text-xs text-muted-foreground">Transform</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-2">
                      <Server className="h-6 w-6 text-orange-500" />
                    </div>
                    <span className="text-xs text-muted-foreground">Auth0</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          </>
          )}
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Customer Configuration</h2>
            <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  {customerConfig ? (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Configuration
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Configuration
                    </>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {customerConfig ? "Edit" : "Create"} Customer Configuration
                  </DialogTitle>
                  <DialogDescription>
                    Configure the input and output systems for data synchronization.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-4">
                    <h3 className="font-medium">Input System (Akamai Identity Cloud)</h3>
                    <div className="grid gap-2">
                      <Label htmlFor="akamaiEndpoint">API Endpoint</Label>
                      <Input
                        id="akamaiEndpoint"
                        placeholder="https://api.akamai.com/v1"
                        value={configForm.akamaiEndpoint}
                        onChange={(e) => setConfigForm({ ...configForm, akamaiEndpoint: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="akamaiCredentials">Credentials Secret ARN</Label>
                      <Input
                        id="akamaiCredentials"
                        placeholder="arn:aws:secretsmanager:..."
                        value={configForm.akamaiCredentialsArn}
                        onChange={(e) => setConfigForm({ ...configForm, akamaiCredentialsArn: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-medium">Output System (Auth0)</h3>
                    <div className="grid gap-2">
                      <Label htmlFor="auth0Domain">Auth0 Domain</Label>
                      <Input
                        id="auth0Domain"
                        placeholder="your-tenant.auth0.com"
                        value={configForm.auth0Domain}
                        onChange={(e) => setConfigForm({ ...configForm, auth0Domain: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="auth0Credentials">Credentials Secret ARN</Label>
                      <Input
                        id="auth0Credentials"
                        placeholder="arn:aws:secretsmanager:..."
                        value={configForm.auth0CredentialsArn}
                        onChange={(e) => setConfigForm({ ...configForm, auth0CredentialsArn: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveCustomerConfig} disabled={savingConfig}>
                    {savingConfig ? "Saving..." : "Save Configuration"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {!selectedCustomer ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <Settings2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select a Customer</h3>
                  <p className="text-muted-foreground">
                    Choose a DataSync customer from the dropdown above to view their configuration.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : configLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : customerConfig ? (
            <div className="space-y-4">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <span className="text-sm text-muted-foreground block">Customer ID</span>
                      <span className="font-mono font-medium">{customerConfig.customerId}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground block">Created</span>
                      <span className="font-medium">
                        {customerConfig.createdAt 
                          ? new Date(customerConfig.createdAt).toLocaleString() 
                          : "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground block">Last Updated</span>
                      <span className="font-medium">
                        {customerConfig.updatedAt 
                          ? new Date(customerConfig.updatedAt).toLocaleString() 
                          : "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground block">Transform Rules</span>
                      <Badge variant="secondary">{transformRules.length} rules</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Input System */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Server className="h-5 w-5 text-blue-500" />
                      Input System
                    </CardTitle>
                    <CardDescription>Source system configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {customerConfig.inputSystems?.map((input, idx) => {
                      const akamai = input.akamaiIdentityCloud;
                      return (
                        <div key={idx} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Type</span>
                            <Badge variant="outline">{akamai?.systemType || "Unknown"}</Badge>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground block mb-1">API Endpoint</span>
                            <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
                              {akamai?.apiEndpoint || "Not set"}
                            </code>
                          </div>
                          {akamai?.apiVersion && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">API Version</span>
                              <span className="text-sm">{akamai.apiVersion}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-sm text-muted-foreground block mb-1">Credentials Secret</span>
                            <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
                              {akamai?.credentialsSecretArn || "Not set"}
                            </code>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Output System */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Server className="h-5 w-5 text-orange-500" />
                      Output System
                    </CardTitle>
                    <CardDescription>Destination system configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Type</span>
                      <Badge variant="outline">{customerConfig.outputSystem?.systemType || "Not set"}</Badge>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground block mb-1">Auth0 Domain</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
                        {customerConfig.outputSystem?.auth0Domain || "Not set"}
                      </code>
                    </div>
                    {customerConfig.outputSystem?.managementApiEndpoint && (
                      <div>
                        <span className="text-sm text-muted-foreground block mb-1">Management API</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
                          {customerConfig.outputSystem.managementApiEndpoint}
                        </code>
                      </div>
                    )}
                    <div>
                      <span className="text-sm text-muted-foreground block mb-1">Credentials Secret</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
                        {customerConfig.outputSystem?.credentialsSecretArn || "Not set"}
                      </code>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <Settings2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Configuration Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Create a configuration to start syncing data for this customer.
                  </p>
                  <Button onClick={() => setConfigDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plan Management */}
          {selectedCustomer && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Plan Management</CardTitle>
              <CardDescription>
                View current plan limits and assign a new plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Plan Details */}
              {customerPlan ? (
                <div className="space-y-4">
                  <h3 className="font-medium">Current Plan</h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <span className="text-sm text-muted-foreground block">Plan ID</span>
                      <span className="font-semibold capitalize">{customerPlan.planId}</span>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <span className="text-sm text-muted-foreground block">Rate Limit</span>
                      <span className="font-semibold">{customerPlan.limits?.rateLimit || 0} req/sec</span>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <span className="text-sm text-muted-foreground block">Burst Limit</span>
                      <span className="font-semibold">{customerPlan.limits?.burstLimit || 0}</span>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <span className="text-sm text-muted-foreground block">Quota Limit</span>
                      <span className="font-semibold">{customerPlan.limits?.quotaLimit?.toLocaleString() || 0} / {customerPlan.limits?.quotaPeriod || 'MONTH'}</span>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <span className="text-sm text-muted-foreground block">Assigned</span>
                      <span className="font-semibold text-sm">
                        {customerPlan.assignedAt 
                          ? new Date(customerPlan.assignedAt).toLocaleDateString() 
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No plan assigned to this customer
                </div>
              )}

              {/* Plan Selection */}
              <div className="space-y-4">
                <h3 className="font-medium">Assign Plan</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {['basic', 'pro', 'business', 'enterprise'].map((planId) => (
                    <Card
                      key={planId}
                      className={`cursor-pointer transition-all ${
                        customerPlan?.planId === planId
                          ? "border-primary bg-primary/5 ring-2 ring-primary"
                          : "hover:border-primary/50 hover:shadow-md"
                      }`}
                      onClick={() => assignPlan(planId)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center justify-between capitalize">
                          {planId}
                          {customerPlan?.planId === planId && (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground">
                        {planId === 'basic' && (
                          <>
                            <div>10 req/sec</div>
                            <div>20 burst</div>
                            <div>10,000 req/month</div>
                          </>
                        )}
                        {planId === 'pro' && (
                          <>
                            <div>100 req/sec</div>
                            <div>200 burst</div>
                            <div>500,000 req/month</div>
                          </>
                        )}
                        {planId === 'business' && (
                          <>
                            <div>500 req/sec</div>
                            <div>1,000 burst</div>
                            <div>2,000,000 req/month</div>
                          </>
                        )}
                        {planId === 'enterprise' && (
                          <>
                            <div>1,000 req/sec</div>
                            <div>2,000 burst</div>
                            <div>Unlimited</div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          )}
        </TabsContent>

        {/* Transform Rules Tab */}
        <TabsContent value="transforms" className="space-y-4">
          {!selectedCustomer ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <FileCode2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select a Customer</h3>
                  <p className="text-muted-foreground">
                    Choose a DataSync customer from the dropdown above to view their transform rules.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
          <>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Transform Rules</h2>
            <Dialog open={ruleDialogOpen} onOpenChange={(open) => {
              setRuleDialogOpen(open);
              if (!open) {
                setEditingRule(null);
                resetRuleForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle>
                    {editingRule ? "Edit" : "Create"} Transform Rule
                  </DialogTitle>
                  <DialogDescription>
                    Define how data is transformed from source to destination system.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-2">
                  {/* Rule Metadata */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="ruleId">Rule ID</Label>
                      <Input
                        id="ruleId"
                        placeholder="rule-akamai-to-auth0"
                        value={ruleForm.id}
                        onChange={(e) => setRuleForm({ ...ruleForm, id: e.target.value })}
                        disabled={!!editingRule}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="version">Version</Label>
                      <Input
                        id="version"
                        placeholder="1.0"
                        value={ruleForm.version}
                        onChange={(e) => setRuleForm({ ...ruleForm, version: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="sourceSystem">Source System</Label>
                      <Select
                        value={ruleForm.sourceSystem}
                        onValueChange={(value) => setRuleForm({ ...ruleForm, sourceSystem: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AKAMAI_IDENTITY_CLOUD">Akamai Identity Cloud</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Transform Akamai Identity Cloud data to Auth0 format"
                      value={ruleForm.description}
                      onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                    />
                  </div>

                  {/* Mode Toggle */}
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-medium">Transform Steps ({jsonMode ? "JSON" : "Visual"} Editor)</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={jsonMode ? "outline" : "default"}
                        size="sm"
                        onClick={() => {
                          if (jsonMode) {
                            // Switching from JSON to Visual - parse JSON
                            try {
                              const parsed = JSON.parse(jsonText);
                              setRuleForm({ ...ruleForm, steps: parsed });
                              setJsonMode(false);
                            } catch (e) {
                              alert("Invalid JSON - cannot switch to visual mode");
                            }
                          } else {
                            setJsonMode(false);
                          }
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Visual
                      </Button>
                      <Button
                        variant={jsonMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (!jsonMode) {
                            // Switching from Visual to JSON
                            setJsonText(JSON.stringify(ruleForm.steps, null, 2));
                          }
                          setJsonMode(true);
                        }}
                      >
                        <Code className="h-4 w-4 mr-1" />
                        JSON
                      </Button>
                    </div>
                  </div>

                  {jsonMode ? (
                    /* JSON Editor Mode */
                    <div className="grid gap-2">
                      <textarea
                        className="min-h-[300px] w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={jsonText}
                        onChange={(e) => setJsonText(e.target.value)}
                        placeholder='[{"pick": {"from": "email", "to": "email"}}]'
                      />
                    </div>
                  ) : (
                    /* Visual Editor Mode */
                    <div className="space-y-3">
                      {/* Add Step Buttons */}
                      <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm text-muted-foreground mr-2 self-center">Add step:</span>
                        <Button variant="outline" size="sm" onClick={() => addStep("pick")}>
                          <Copy className="h-3 w-3 mr-1" />
                          Pick
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => addStep("set")}>
                          <Variable className="h-3 w-3 mr-1" />
                          Set
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => addStep("rename")}>
                          <ArrowRightLeft className="h-3 w-3 mr-1" />
                          Rename
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => addStep("template")}>
                          <Type className="h-3 w-3 mr-1" />
                          Template
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => addStep("condition")}>
                          <GitBranch className="h-3 w-3 mr-1" />
                          Condition
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => addStep("convert")}>
                          <ArrowRight className="h-3 w-3 mr-1" />
                          Convert
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => addStep("remove")}>
                          <Eraser className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      </div>

                      {/* Steps List */}
                      {ruleForm.steps.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                          <FileCode2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No transform steps yet</p>
                          <p className="text-sm">Click a button above to add your first step</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {ruleForm.steps.map((step, index) => {
                            const stepType = getStepType(step);
                            return (
                              <div key={index} className="flex items-start gap-2 p-3 border rounded-lg bg-card">
                                {/* Step Number & Controls */}
                                <div className="flex flex-col items-center gap-1 pt-1">
                                  <span className="text-xs text-muted-foreground w-6 text-center">{index + 1}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => moveStep(index, "up")}
                                    disabled={index === 0}
                                  >
                                    <ChevronUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => moveStep(index, "down")}
                                    disabled={index === ruleForm.steps.length - 1}
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                  </Button>
                                </div>

                                {/* Step Content */}
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="capitalize">{stepType}</Badge>
                                  </div>
                                  
                                  {/* Pick Step */}
                                  {stepType === "pick" && (
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <Label className="text-xs">From (source field)</Label>
                                        <Input
                                          placeholder="email"
                                          value={step.pick?.from || ""}
                                          onChange={(e) => updateStep(index, { pick: { ...step.pick, from: e.target.value } })}
                                          className="h-8 text-sm"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs">To (destination field)</Label>
                                        <Input
                                          placeholder="email"
                                          value={step.pick?.to || ""}
                                          onChange={(e) => updateStep(index, { pick: { ...step.pick, to: e.target.value } })}
                                          className="h-8 text-sm"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Set Step */}
                                  {stepType === "set" && (
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <Label className="text-xs">Value</Label>
                                        <Input
                                          placeholder="Username-Password-Authentication"
                                          value={step.set?.value || ""}
                                          onChange={(e) => updateStep(index, { set: { ...step.set, value: e.target.value } })}
                                          className="h-8 text-sm"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs">To (destination field)</Label>
                                        <Input
                                          placeholder="connection"
                                          value={step.set?.to || ""}
                                          onChange={(e) => updateStep(index, { set: { ...step.set, to: e.target.value } })}
                                          className="h-8 text-sm"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Rename Step */}
                                  {stepType === "rename" && (
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <Label className="text-xs">From</Label>
                                        <Input
                                          placeholder="givenName"
                                          value={step.rename?.from || ""}
                                          onChange={(e) => updateStep(index, { rename: { ...step.rename, from: e.target.value } })}
                                          className="h-8 text-sm"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs">To</Label>
                                        <Input
                                          placeholder="firstName"
                                          value={step.rename?.to || ""}
                                          onChange={(e) => updateStep(index, { rename: { ...step.rename, to: e.target.value } })}
                                          className="h-8 text-sm"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Template Step */}
                                  {stepType === "template" && (
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <Label className="text-xs">Expression</Label>
                                        <Input
                                          placeholder="${givenName} ${familyName}"
                                          value={step.template?.expr || ""}
                                          onChange={(e) => updateStep(index, { template: { ...step.template, expr: e.target.value } })}
                                          className="h-8 text-sm font-mono"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs">To</Label>
                                        <Input
                                          placeholder="name"
                                          value={step.template?.to || ""}
                                          onChange={(e) => updateStep(index, { template: { ...step.template, to: e.target.value } })}
                                          className="h-8 text-sm"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Condition Step */}
                                  {stepType === "condition" && (
                                    <div className="space-y-2">
                                      <div className="grid grid-cols-3 gap-2">
                                        <div>
                                          <Label className="text-xs">Condition Type</Label>
                                          <Select
                                            value={step.condition?.condition?.equals ? "equals" : step.condition?.condition?.exists ? "exists" : "equals"}
                                            onValueChange={(value) => {
                                              const newCondition = value === "exists" 
                                                ? { exists: { field: "" } }
                                                : { equals: { field: "", value: "" } };
                                              updateStep(index, { 
                                                condition: { ...step.condition, condition: newCondition }
                                              });
                                            }}
                                          >
                                            <SelectTrigger className="h-8 text-sm">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="equals">Equals</SelectItem>
                                              <SelectItem value="exists">Exists</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div>
                                          <Label className="text-xs">Field</Label>
                                          <Input
                                            placeholder="userstatus"
                                            value={step.condition?.condition?.equals?.field || step.condition?.condition?.exists?.field || ""}
                                            onChange={(e) => {
                                              const cond = step.condition?.condition;
                                              if (cond?.equals) {
                                                updateStep(index, { 
                                                  condition: { 
                                                    ...step.condition, 
                                                    condition: { equals: { ...cond.equals, field: e.target.value } }
                                                  }
                                                });
                                              } else if (cond?.exists) {
                                                updateStep(index, { 
                                                  condition: { 
                                                    ...step.condition, 
                                                    condition: { exists: { field: e.target.value } }
                                                  }
                                                });
                                              }
                                            }}
                                            className="h-8 text-sm"
                                          />
                                        </div>
                                        {step.condition?.condition?.equals && (
                                          <div>
                                            <Label className="text-xs">Value</Label>
                                            <Input
                                              placeholder="BLOCKED"
                                              value={step.condition?.condition?.equals?.value || ""}
                                              onChange={(e) => {
                                                updateStep(index, { 
                                                  condition: { 
                                                    ...step.condition, 
                                                    condition: { equals: { ...step.condition.condition.equals, value: e.target.value } }
                                                  }
                                                });
                                              }}
                                              className="h-8 text-sm"
                                            />
                                          </div>
                                        )}
                                      </div>
                                      <div className="grid grid-cols-3 gap-2">
                                        <div>
                                          <Label className="text-xs">Output Field</Label>
                                          <Input
                                            placeholder="blocked"
                                            value={step.condition?.to || ""}
                                            onChange={(e) => updateStep(index, { condition: { ...step.condition, to: e.target.value } })}
                                            className="h-8 text-sm"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-xs">Then Value</Label>
                                          <Input
                                            placeholder="true"
                                            value={String(step.condition?.thenValue ?? "")}
                                            onChange={(e) => {
                                              let val: any = e.target.value;
                                              if (val === "true") val = true;
                                              else if (val === "false") val = false;
                                              else if (!isNaN(Number(val)) && val !== "") val = Number(val);
                                              updateStep(index, { condition: { ...step.condition, thenValue: val } });
                                            }}
                                            className="h-8 text-sm"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-xs">Else Value</Label>
                                          <Input
                                            placeholder="false"
                                            value={String(step.condition?.elseValue ?? "")}
                                            onChange={(e) => {
                                              let val: any = e.target.value;
                                              if (val === "true") val = true;
                                              else if (val === "false") val = false;
                                              else if (!isNaN(Number(val)) && val !== "") val = Number(val);
                                              updateStep(index, { condition: { ...step.condition, elseValue: val } });
                                            }}
                                            className="h-8 text-sm"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Convert Step */}
                                  {stepType === "convert" && (
                                    <div className="grid grid-cols-4 gap-2">
                                      <div>
                                        <Label className="text-xs">From</Label>
                                        <Input
                                          placeholder="emailVerified"
                                          value={step.convert?.from || ""}
                                          onChange={(e) => updateStep(index, { convert: { ...step.convert, from: e.target.value } })}
                                          className="h-8 text-sm"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs">To</Label>
                                        <Input
                                          placeholder="email_verified"
                                          value={step.convert?.to || ""}
                                          onChange={(e) => updateStep(index, { convert: { ...step.convert, to: e.target.value } })}
                                          className="h-8 text-sm"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs">Type</Label>
                                        <Select
                                          value={step.convert?.toType || "string"}
                                          onValueChange={(value) => updateStep(index, { convert: { ...step.convert, toType: value } })}
                                        >
                                          <SelectTrigger className="h-8 text-sm">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="string">String</SelectItem>
                                            <SelectItem value="boolean">Boolean</SelectItem>
                                            <SelectItem value="number">Number</SelectItem>
                                            <SelectItem value="date">Date</SelectItem>
                                            <SelectItem value="iso8601">ISO 8601</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label className="text-xs">Default</Label>
                                        <Input
                                          placeholder="false"
                                          value={step.convert?.defaultValue || ""}
                                          onChange={(e) => updateStep(index, { convert: { ...step.convert, defaultValue: e.target.value } })}
                                          className="h-8 text-sm"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Remove Step */}
                                  {stepType === "remove" && (
                                    <div className="grid grid-cols-3 gap-2">
                                      <div>
                                        <Label className="text-xs">Path</Label>
                                        <Input
                                          placeholder="password.value"
                                          value={step.remove?.path || ""}
                                          onChange={(e) => updateStep(index, { remove: { ...step.remove, path: e.target.value } })}
                                          className="h-8 text-sm"
                                        />
                                      </div>
                                      <div className="flex items-end gap-2">
                                        <label className="flex items-center gap-1 text-xs cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={step.remove?.onlyIfNull || false}
                                            onChange={(e) => updateStep(index, { remove: { ...step.remove, onlyIfNull: e.target.checked } })}
                                            className="rounded"
                                          />
                                          Only if null
                                        </label>
                                      </div>
                                      <div className="flex items-end gap-2">
                                        <label className="flex items-center gap-1 text-xs cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={step.remove?.removeEmptyParents || false}
                                            onChange={(e) => updateStep(index, { remove: { ...step.remove, removeEmptyParents: e.target.checked } })}
                                            className="rounded"
                                          />
                                          Remove empty parents
                                        </label>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Delete Button */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => removeStep(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <DialogFooter className="border-t pt-4">
                  <div className="flex items-center gap-2 mr-auto text-sm text-muted-foreground">
                    <FileCode2 className="h-4 w-4" />
                    {ruleForm.steps.length} step{ruleForm.steps.length !== 1 ? "s" : ""}
                  </div>
                  <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveTransformRule}>
                    {editingRule ? "Update Rule" : "Create Rule"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {transformRules.length > 0 ? (
            <div className="grid gap-4">
              {transformRules.map((rule) => (
                <Card key={rule.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileCode2 className="h-4 w-4" />
                          {rule.id}
                          <Badge variant="outline" className="ml-2">v{rule.version}</Badge>
                        </CardTitle>
                        <CardDescription>{rule.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingRule(rule);
                            setRuleForm({
                              id: rule.id,
                              version: rule.version,
                              description: rule.description,
                              sourceSystem: rule.sourceSystem,
                              steps: rule.steps || [],
                            });
                            setJsonText(JSON.stringify(rule.steps || [], null, 2));
                            setJsonMode(false);
                            setRuleDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTransformRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Source: {rule.sourceSystem}</span>
                      <span>•</span>
                      <span>{rule.steps?.length || 0} steps</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <FileCode2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Transform Rules</h3>
                  <p className="text-muted-foreground mb-4">
                    Create transform rules to define how data is mapped during synchronization.
                  </p>
                  <Button onClick={() => setRuleDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Rule
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          </>
          )}
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-4">
          {!selectedCustomer ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select a Customer</h3>
                  <p className="text-muted-foreground">
                    Choose a DataSync customer from the dropdown above to view their usage statistics.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
          <>
          <h2 className="text-xl font-semibold">Usage Statistics</h2>
          
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Syncs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageTotals.totalSyncs.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Failed Syncs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  {usageTotals.totalFailed.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageTotals.totalTokens.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Daily Usage</CardTitle>
              <CardDescription>Sync activity over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {usageData.length > 0 ? (
                <div className="space-y-2">
                  {usageData.slice(-14).map((record) => (
                    <div
                      key={record.windowId}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-mono w-24">{record.windowId}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{record.syncCount} syncs</Badge>
                          {record.failedSyncCount > 0 && (
                            <Badge variant="destructive">{record.failedSyncCount} failed</Badge>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {record.tokensUsed} tokens
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No usage data available</p>
                </div>
              )}
            </CardContent>
          </Card>
          </>
          )}
        </TabsContent>

        {/* DLQ Tab */}
        <TabsContent value="dlq" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Dead Letter Queues</h2>
            <Button variant="outline" onClick={fetchDlqStats}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {["listen", "transform", "send"].map((queueName) => (
              <Card key={queueName}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="capitalize">{queueName} DLQ</span>
                    <Badge variant={dlqStats[queueName]?.approximateNumberOfMessages > 0 ? "destructive" : "secondary"}>
                      {dlqStats[queueName]?.approximateNumberOfMessages || 0}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {dlqStats[queueName]?.approximateNumberOfMessagesNotVisible || 0} processing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => resendAllDlqMessages(queueName)}
                      disabled={!dlqStats[queueName]?.approximateNumberOfMessages}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Resend All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => purgeDlq(queueName)}
                      disabled={!dlqStats[queueName]?.approximateNumberOfMessages}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Purge
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* DLQ Messages */}
          {Object.entries(dlqMessages).map(([queueName, messages]) => (
            messages.length > 0 && (
              <Card key={queueName}>
                <CardHeader>
                  <CardTitle className="text-lg capitalize">{queueName} Queue Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {messages.map((message) => (
                      <div
                        key={message.messageId}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-muted-foreground truncate">
                              {message.messageId}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {message.approximateReceiveCount} attempts
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(message.sentTimestamp).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resendDlqMessage(queueName, message.receiptHandle)}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Retry
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

