# Connections Marketplace

## Overview

The Connections page provides a marketplace-style interface for configuring integrations with external service providers.

## Categories

Each customer can connect **one provider per category**:

1. **Identity Provider** - Authentication and user management
2. **CDN** - Content delivery network
3. **Security Provider** - Web application security and protection
4. **IT Service Management (ITSM)** - Ticketing and workflow automation
5. **SMS Provider** - SMS messaging and verification
6. **Email Provider** - Email delivery and management

## Supported Providers

### Identity Providers
- **Auth0**: Enterprise authentication platform
- **Akamai Identity Cloud**: Akamai's identity management solution

### CDN
- **Akamai Edge**: Global CDN with edge computing
- **Cloudflare**: CDN and security platform

### Security
- **Akamai Edge Security**: WAF and DDoS protection

### ITSM
- **ServiceNow**: Enterprise service management platform

### SMS
- **Telesign**: Enterprise SMS and verification
- **Twilio**: Cloud communications platform

### Email
- **SendGrid**: Email delivery platform
- **Duocircle**: Email security and archiving

## UI Features

### Marketplace View

**Category Tabs**:
- All Providers (shows all)
- Individual category tabs (Identity, CDN, Security, ITSM, SMS, Email)

**Provider Cards**:
- Provider logo
- Provider name
- Brief description
- Connection status badge (if connected)
- "View Details" button
- "Configure" / "Reconfigure" button

### Provider Details Dialog

Shows detailed information:
- Large provider logo
- Full description
- Complete installation instructions
- List of required configuration fields

### Configuration Dialog

Interactive form for setup:
- Provider logo and name
- Installation instructions
- Configuration form with required fields:
  - Text inputs (URLs, IDs, usernames)
  - Password inputs (secrets, tokens, keys)
  - Validation and help text
- Save/Cancel buttons

## Provider Configuration

Each provider has specific configuration fields:

### Example: Auth0
```typescript
{
  domain: "dev-xxxxx.us.auth0.com",
  clientId: "your-client-id",
  clientSecret: "your-client-secret"
}
```

### Example: Twilio
```typescript
{
  accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authToken: "your-auth-token",
  phoneNumber: "+1234567890"
}
```

### Example: SendGrid
```typescript
{
  apiKey: "SG.xxxxxxxxxxxxxxxx",
  fromEmail: "noreply@yourdomain.com",
  fromName: "Your Company"
}
```

## Visual Design

### Card Layout
```
┌─────────────────────────────────────┐
│ [Logo]  Provider Name               │
│         [Connected Badge]           │
├─────────────────────────────────────┤
│ Brief description of the provider   │
│ and its main features...            │
│                                     │
│ [View Details] [Configure]          │
└─────────────────────────────────────┘
```

### Grid Layout
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3 columns
- Responsive and adaptive

### Interactive States
- **Hover**: Card lifts with shadow
- **Connected**: Green badge with checkmark
- **Not Connected**: Configure button primary style
- **Configured**: Reconfigure button with settings icon

## User Experience

### Browsing Providers

1. User navigates to Connections page
2. Sees all providers organized by category
3. Can filter by category using tabs
4. Each provider shows logo, name, and description
5. Visual indicator for connected providers

### Viewing Provider Details

1. Click "View Details" on any provider card
2. Modal opens with:
   - Large provider logo
   - Full description
   - Installation instructions
   - Required configuration fields list
3. Can click "Configure Now" to go to config form

### Configuring a Provider

1. Click "Configure" button on provider card
2. Modal opens with configuration form
3. Shows installation instructions at top
4. Form with all required fields:
   - URLs, Client IDs, Secrets, etc.
   - Help text for complex fields
   - Required field indicators
5. Fill in configuration
6. Click "Save Configuration"
7. Provider marked as connected
8. Badge appears on card

### Reconfiguring

1. Connected providers show "Reconfigure" button
2. Opens same config form
3. Can update existing configuration
4. Saves new values

## Connection Rules (Future Backend Implementation)

### One Provider Per Category
- Each customer can only connect one provider per category
- Connecting a new provider in a category disconnects the previous one
- UI will show which provider is currently active

### Admin-Only Configuration
- Only ADMIN role users can configure connections
- READ_ONLY users can view but not configure
- Enforced at both UI and API level

### Secure Storage
- Credentials encrypted in database
- Never exposed in API responses
- Only decrypted when needed for API calls

## Implementation Status

### ✅ Completed (Frontend Only)
- Marketplace UI with provider cards
- Category filtering with tabs
- Configuration dialogs with forms
- Installation instructions display
- Visual connection status
- Provider logos and branding

### 🚧 Pending (Backend Integration)
- Save configurations to database
- Encrypt sensitive credentials
- API endpoints for connections CRUD
- Test connections functionality
- One-per-category enforcement
- Admin-only protection

## Technical Details

### Provider Data Structure

```typescript
interface Provider {
  id: string;
  name: string;
  category: ProviderCategory;
  logo: string;
  description: string;
  installationInstructions: string;
  configFields: ConfigField[];
}

interface ConfigField {
  name: string;
  label: string;
  type: "text" | "password" | "url";
  placeholder: string;
  required: boolean;
  helpText?: string;
}
```

### Categories

```typescript
type ProviderCategory = 
  | "identity"
  | "cdn"
  | "security"
  | "itsm"
  | "sms"
  | "email";
```

### Provider Registry

All providers are defined in `frontend/src/lib/providers.ts`:
- Centralized provider definitions
- Easy to add new providers
- Configuration field templates
- Installation instructions

## Adding New Providers

To add a new provider:

1. **Add logo** to `frontend/public/providers/`

2. **Add provider definition** to `frontend/src/lib/providers.ts`:

```typescript
{
  id: "new-provider",
  name: "New Provider",
  category: "email", // or other category
  logo: "/providers/new-provider.png",
  description: "Provider description...",
  installationInstructions: `
    Step-by-step instructions...
  `,
  configFields: [
    {
      name: "apiKey",
      label: "API Key",
      type: "password",
      placeholder: "••••••••",
      required: true,
    },
  ],
}
```

3. **Provider automatically appears** in the marketplace

## Future Enhancements

### Backend Integration
1. **Database Schema**: Add Connection model
2. **API Endpoints**: CRUD for connections
3. **Encryption**: Secure credential storage
4. **Validation**: Test connections before saving

### Advanced Features
1. **Connection Health**: Monitor connection status
2. **Usage Analytics**: Track API usage per provider
3. **Webhooks**: Receive events from providers
4. **Batch Operations**: Configure multiple providers
5. **Connection Templates**: Pre-filled configurations
6. **Provider Recommendations**: Suggest providers based on usage

### UI Enhancements
1. **Search**: Filter providers by name
2. **Favorites**: Star frequently used providers
3. **Recent**: Show recently configured
4. **Status Indicators**: Real-time connection health
5. **Activity Log**: Track configuration changes

## Files Created

1. **`frontend/src/lib/providers.ts`**: Provider definitions and utilities
2. **`frontend/src/app/dashboard/connections/page.tsx`**: Main marketplace page
3. **`docs/CONNECTIONS.md`**: This documentation
4. **`frontend/public/providers/`**: Provider logo images

## Files Updated

1. **`frontend/src/components/dashboard/sidebar.tsx`**: Added Connections nav item

## Styling

### Color Scheme
- Cards: Clean white with subtle borders
- Hover: Lift effect with shadow
- Connected: Green badge with checkmark icon
- Logos: Centered in rounded square containers
- Instructions: Muted background code block

### Typography
- Category titles: 2xl bold
- Provider names: lg medium
- Descriptions: sm muted
- Instructions: Monospace, pre-wrap

### Spacing
- Generous padding and gaps
- Consistent spacing throughout
- Proper dialog sizing with scrolling

### Responsive
- Mobile: Single column
- Tablet: 2 columns
- Desktop: 3 columns
- Fluid transitions

---

**The Connections marketplace is ready!** Navigate to `/dashboard/connections` to see it in action. 🎨

