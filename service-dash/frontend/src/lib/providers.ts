export type ProviderCategory = 
  | "identity"
  | "cdn"
  | "security"
  | "itsm"
  | "sms"
  | "email";

export interface Provider {
  id: string;
  name: string;
  category: ProviderCategory;
  logo: string;
  description: string;
  installationInstructions: string;
  configFields: ConfigField[];
}

export interface ConfigField {
  name: string;
  label: string;
  type: "text" | "password" | "url";
  placeholder: string;
  required: boolean;
  helpText?: string;
}

export const categories = {
  identity: "Identity Provider",
  cdn: "CDN",
  security: "Security Provider",
  itsm: "IT Service Management",
  sms: "SMS Provider",
  email: "Email Provider",
};

export const providers: Provider[] = [
  // Identity Providers
  {
    id: "auth0",
    name: "Auth0",
    category: "identity",
    logo: "/providers/auth0.svg",
    description: "Enterprise-grade authentication and authorization platform with support for multiple identity sources and protocols.",
    installationInstructions: `
1. Create an Auth0 account at https://auth0.com
2. Create a new Application in the Auth0 Dashboard
3. Set Application Type to "Regular Web Application"
4. Configure Allowed Callback URLs and Logout URLs
5. Copy your Domain, Client ID, and Client Secret
6. Enter the configuration details below
    `,
    configFields: [
      {
        name: "domain",
        label: "Auth0 Domain",
        type: "text",
        placeholder: "dev-xxxxx.us.auth0.com",
        required: true,
        helpText: "Your Auth0 tenant domain (without https://)",
      },
      {
        name: "clientId",
        label: "Client ID",
        type: "text",
        placeholder: "xxxxxxxxxxxxxxxxxxxx",
        required: true,
      },
      {
        name: "clientSecret",
        label: "Client Secret",
        type: "password",
        placeholder: "••••••••••••••••••••",
        required: true,
      },
    ],
  },
  {
    id: "akamai-identity",
    name: "Akamai Identity Cloud",
    category: "identity",
    logo: "/providers/akamai.png",
    description: "Akamai's comprehensive identity and access management solution with advanced security features and global scale.",
    installationInstructions: `
1. Access your Akamai Identity Cloud admin portal
2. Navigate to Applications section
3. Create a new OAuth application
4. Configure redirect URIs and allowed origins
5. Generate API credentials
6. Enter the configuration details below
    `,
    configFields: [
      {
        name: "apiUrl",
        label: "API URL",
        type: "url",
        placeholder: "https://your-tenant.akamai.com",
        required: true,
      },
      {
        name: "clientId",
        label: "Client ID",
        type: "text",
        placeholder: "xxxxxxxxxxxxxxxxxxxx",
        required: true,
      },
      {
        name: "clientSecret",
        label: "Client Secret",
        type: "password",
        placeholder: "••••••••••••••••••••",
        required: true,
      },
    ],
  },
  
  // CDN Providers
  {
    id: "akamai-cdn",
    name: "Akamai Edge",
    category: "cdn",
    logo: "/providers/akamai.png",
    description: "World's largest and most trusted CDN with advanced edge computing capabilities and security features.",
    installationInstructions: `
1. Log in to Akamai Control Center
2. Navigate to Properties section
3. Create or select your property
4. Generate API credentials from Identity and Access Management
5. Note your API endpoint and credentials
6. Enter the configuration details below
    `,
    configFields: [
      {
        name: "apiEndpoint",
        label: "API Endpoint",
        type: "url",
        placeholder: "https://xxxxx.akamaihd.net",
        required: true,
      },
      {
        name: "accessToken",
        label: "Access Token",
        type: "password",
        placeholder: "••••••••••••••••••••",
        required: true,
      },
      {
        name: "clientToken",
        label: "Client Token",
        type: "password",
        placeholder: "••••••••••••••••••••",
        required: true,
      },
      {
        name: "clientSecret",
        label: "Client Secret",
        type: "password",
        placeholder: "••••••••••••••••••••",
        required: true,
      },
    ],
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    category: "cdn",
    logo: "/providers/cloudflare.png",
    description: "Global CDN and security platform offering performance optimization, DDoS protection, and edge computing.",
    installationInstructions: `
1. Log in to Cloudflare Dashboard
2. Navigate to your domain or create a new site
3. Go to API Tokens section in your profile
4. Create an API token with appropriate permissions
5. Copy your Zone ID and API Token
6. Enter the configuration details below
    `,
    configFields: [
      {
        name: "zoneId",
        label: "Zone ID",
        type: "text",
        placeholder: "xxxxxxxxxxxxxxxxxxxx",
        required: true,
        helpText: "Found in your domain's overview page",
      },
      {
        name: "apiToken",
        label: "API Token",
        type: "password",
        placeholder: "••••••••••••••••••••",
        required: true,
      },
    ],
  },

  // Security Providers
  {
    id: "akamai-security",
    name: "Akamai Edge Security",
    category: "security",
    logo: "/providers/akamai.png",
    description: "Enterprise-grade web application and API security with advanced bot management and DDoS protection.",
    installationInstructions: `
1. Access Akamai Security Center
2. Configure your security policies
3. Generate API credentials from Luna Control Center
4. Note your security configuration ID
5. Enter the configuration details below
    `,
    configFields: [
      {
        name: "configId",
        label: "Security Config ID",
        type: "text",
        placeholder: "sec_xxxxx",
        required: true,
      },
      {
        name: "apiEndpoint",
        label: "API Endpoint",
        type: "url",
        placeholder: "https://xxxxx.akamaihd.net",
        required: true,
      },
      {
        name: "accessToken",
        label: "Access Token",
        type: "password",
        placeholder: "••••••••••••••••••••",
        required: true,
      },
    ],
  },

  // ITSM Providers
  {
    id: "servicenow",
    name: "ServiceNow",
    category: "itsm",
    logo: "/providers/servicenow.png",
    description: "Leading IT service management platform for enterprise workflow automation and service delivery.",
    installationInstructions: `
1. Log in to your ServiceNow instance
2. Navigate to System OAuth > Application Registry
3. Create a new OAuth API endpoint
4. Configure allowed scopes and redirect URIs
5. Copy your instance URL and API credentials
6. Enter the configuration details below
    `,
    configFields: [
      {
        name: "instanceUrl",
        label: "Instance URL",
        type: "url",
        placeholder: "https://your-instance.service-now.com",
        required: true,
      },
      {
        name: "clientId",
        label: "Client ID",
        type: "text",
        placeholder: "xxxxxxxxxxxxxxxxxxxx",
        required: true,
      },
      {
        name: "clientSecret",
        label: "Client Secret",
        type: "password",
        placeholder: "••••••••••••••••••••",
        required: true,
      },
      {
        name: "username",
        label: "API Username",
        type: "text",
        placeholder: "api.user",
        required: false,
        helpText: "Optional: For basic auth API access",
      },
    ],
  },

  // SMS Providers
  {
    id: "telesign",
    name: "Telesign",
    category: "sms",
    logo: "/providers/telesign.png",
    description: "Enterprise communication platform providing SMS, voice, and phone verification services globally.",
    installationInstructions: `
1. Create a Telesign account at https://telesign.com
2. Navigate to the API section in your dashboard
3. Generate API credentials
4. Copy your Customer ID and API Key
5. Enter the configuration details below
    `,
    configFields: [
      {
        name: "customerId",
        label: "Customer ID",
        type: "text",
        placeholder: "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
        required: true,
      },
      {
        name: "apiKey",
        label: "API Key",
        type: "password",
        placeholder: "••••••••••••••••••••",
        required: true,
      },
    ],
  },
  {
    id: "twilio",
    name: "Twilio",
    category: "sms",
    logo: "/providers/twilio.png",
    description: "Cloud communications platform offering SMS, voice, video, and messaging APIs with global reach.",
    installationInstructions: `
1. Sign up for Twilio at https://twilio.com
2. Navigate to Console Dashboard
3. Find your Account SID and Auth Token
4. Purchase a phone number if needed
5. Copy your credentials
6. Enter the configuration details below
    `,
    configFields: [
      {
        name: "accountSid",
        label: "Account SID",
        type: "text",
        placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        required: true,
      },
      {
        name: "authToken",
        label: "Auth Token",
        type: "password",
        placeholder: "••••••••••••••••••••",
        required: true,
      },
      {
        name: "phoneNumber",
        label: "Phone Number",
        type: "text",
        placeholder: "+1234567890",
        required: false,
        helpText: "Your Twilio phone number for sending SMS",
      },
    ],
  },

  // Email Providers
  {
    id: "sendgrid",
    name: "SendGrid",
    category: "email",
    logo: "/providers/sendgrid.png",
    description: "Twilio SendGrid's email delivery platform with robust APIs, analytics, and deliverability tools.",
    installationInstructions: `
1. Create a SendGrid account at https://sendgrid.com
2. Navigate to Settings > API Keys
3. Create a new API key with appropriate permissions
4. Copy the generated API key (shown only once)
5. Configure sender verification
6. Enter the configuration details below
    `,
    configFields: [
      {
        name: "apiKey",
        label: "API Key",
        type: "password",
        placeholder: "SG.••••••••••••••••••••",
        required: true,
      },
      {
        name: "fromEmail",
        label: "From Email",
        type: "text",
        placeholder: "noreply@yourdomain.com",
        required: true,
        helpText: "Must be a verified sender in SendGrid",
      },
      {
        name: "fromName",
        label: "From Name",
        type: "text",
        placeholder: "Your Company",
        required: false,
      },
    ],
  },
  {
    id: "duocircle",
    name: "Duocircle",
    category: "email",
    logo: "/providers/duocircle.png",
    description: "Email security and archiving solution providing spam filtering, encryption, and compliance features.",
    installationInstructions: `
1. Log in to your Duocircle admin portal
2. Navigate to API Settings
3. Generate API credentials
4. Configure allowed IP addresses if required
5. Copy your API endpoint and credentials
6. Enter the configuration details below
    `,
    configFields: [
      {
        name: "apiEndpoint",
        label: "API Endpoint",
        type: "url",
        placeholder: "https://api.duocircle.com",
        required: true,
      },
      {
        name: "apiKey",
        label: "API Key",
        type: "password",
        placeholder: "••••••••••••••••••••",
        required: true,
      },
      {
        name: "accountId",
        label: "Account ID",
        type: "text",
        placeholder: "xxxxx",
        required: true,
      },
    ],
  },
];

export function getProvidersByCategory(category: ProviderCategory) {
  return providers.filter((p) => p.category === category);
}

export function getProviderById(id: string) {
  return providers.find((p) => p.id === id);
}

