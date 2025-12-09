# User Flows

## Authentication & Onboarding Flow

This document describes the complete user journey from first sign-in to dashboard access.

### Flow Diagram

```
┌─────────────┐
│   Landing   │
│    Page     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Sign In    │◄───────── User not authenticated
│    Page     │
└──────┬──────┘
       │
       │ (After OIDC authentication)
       ▼
┌─────────────┐
│   Backend   │
│  Creates    │◄───────── User doesn't exist in DB
│    User     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Check     │
│   Status    │
└──────┬──────┘
       │
       ├────────────────┐
       │                │
       │ Has pending    │ No invites
       │ invites        │
       ▼                ▼
┌─────────────┐  ┌─────────────┐
│   Invites   │  │Has customers│
│    Page     │  │   check     │
└──────┬──────┘  └──────┬──────┘
       │                │
       │                ├────────────────┐
       │                │                │
       │ Accept/Decline │ Has customers  │ No customers
       │                │                │
       ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐ ┌─────────────┐
│  Joined to  │  │  Dashboard  │ │ Onboarding  │
│  Customer   │  │             │ │    Page     │
└──────┬──────┘  └─────────────┘ └──────┬──────┘
       │                               │
       │                               │ Create customer
       │                               │
       └───────────────┬───────────────┘
                       ▼
               ┌─────────────┐
               │  Dashboard  │
               │             │
               └─────────────┘
```

## Detailed User Journeys

### 1. Brand New User (No Invites)

1. **Landing Page** (`/`)
   - User sees branding and "Sign In" button
   - Clicks "Sign In"

2. **Sign In Page** (`/auth/signin`)
   - Clicks "Sign In with OIDC"
   - Redirected to OIDC provider

3. **OIDC Authentication**
   - User authenticates with their IDP
   - Redirected back to `/auth/callback`

4. **Backend Creates User**
   - Backend API automatically creates user record
   - Uses IDP's `sub` (subject) as unique identifier
   - Stores email and name from IDP

5. **Status Check** (`/auth/callback`)
   - Frontend fetches user data from `/api/users/me`
   - Checks for pending invites: None found
   - Checks for customers: None found
   - Redirects to `/onboarding`

6. **Onboarding Page** (`/onboarding`)
   - User prompted to create their first customer
   - Enters customer name (e.g., "My Company")
   - Slug auto-generated (e.g., "my-company")
   - Submits form

7. **Customer Created**
   - Backend creates customer
   - Automatically assigns user as ADMIN role
   - Redirects to `/dashboard`

8. **Dashboard Access**
   - User can now access full dashboard
   - Customer dropdown shows their customer
   - Role displayed as "ADMIN"

### 2. User with Pending Invites

1. **Landing → Sign In → OIDC**
   - Same as above (steps 1-3)

2. **Backend Creates/Finds User**
   - If new user: creates record
   - If existing user: fetches data

3. **Status Check** (`/auth/callback`)
   - Fetches user data
   - Finds pending invites exist
   - Redirects to `/invites`

4. **Invites Page** (`/invites`)
   - Shows list of pending invitations
   - Each shows the role they'd be assigned
   - Options: Accept, Decline, or Skip

5. **User Actions**
   - **Accept**: Joins customer with specified role → Dashboard
   - **Decline**: Removes invite → Check for more invites
   - **Skip**: Goes to onboarding to create own customer

6. **After Processing Invites**
   - If accepted any: Goes to dashboard
   - If declined all: Goes to onboarding
   - Can still create own customer even if joined others

### 3. Returning User

1. **Landing Page**
   - Already authenticated
   - Auto-redirects to `/auth/callback`

2. **Status Check**
   - Has customers: → `/dashboard`
   - No customers: → `/onboarding` or `/invites`

3. **Dashboard**
   - Normal dashboard access
   - Can switch between customers if belongs to multiple

### 4. Admin Inviting a New User

1. **Admin in Dashboard**
   - Navigates to Users page
   - Clicks "Invite User"

2. **Invite Creation**
   - Enters email address
   - Selects role (ADMIN or MEMBER)
   - Submits

3. **Backend Processing**
   - Validates admin has permission
   - Creates invite record with status PENDING
   - No email sent (user will see on sign-in)

4. **Invited User Signs In**
   - Follows "User with Pending Invites" flow above
   - Sees invite on their first sign-in
   - Can accept to join

## API Endpoints

### User Management

**GET /api/users/me**
- Returns current user info
- Auto-creates user if doesn't exist
- Returns:
  ```json
  {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "customers": [...],
    "pendingInvites": 2,
    "hasCustomers": false
  }
  ```

### Customer Management

**GET /api/customers/my-customers**
- Returns all customers user belongs to
- Includes role for each customer

**POST /api/customers**
- Creates new customer
- Assigns creator as ADMIN
- Requires: `name`, `slug`

**GET /api/customers/:customerId**
- Gets specific customer details
- Checks user has access

### Invite Management

**GET /api/invites/pending**
- Returns pending invites for current user's email

**POST /api/invites**
- Creates invite (Admin only)
- Requires: `email`, `customerId`, `role`

**POST /api/invites/:inviteId/accept**
- Accepts invite
- Adds user to customer with specified role

**POST /api/invites/:inviteId/decline**
- Declines invite
- Updates status to DECLINED

## Business Rules

### User Creation
- ✅ Automatically created on first authentication
- ✅ Uses IDP's `sub` as unique identifier
- ✅ Stores email and name from IDP
- ✅ Can exist without any customers temporarily

### Customer Association
- ✅ All users MUST be associated with at least 1 customer
- ✅ Cannot access dashboard without customer association
- ✅ Can belong to multiple customers
- ✅ Role is per-customer (not global)

### Invites
- ✅ Admins can invite anyone by email
- ✅ Invited user may not exist in system yet
- ✅ Invite stored as PENDING until user signs in
- ✅ User sees invites on first sign-in after being invited
- ✅ Can accept or decline
- ✅ Accepting adds them to customer

### Roles
- **ADMIN**: 
  - Can invite users
  - Can manage customer settings
  - Full access to all features
  
- **MEMBER**:
  - Can access dashboard
  - Can use features
  - Cannot invite or manage

### Customer Switching
- Users see dropdown with all their customers
- Clearly shows current customer name
- Shows their role for each customer
- Persisted in localStorage

## Security

### Token Validation
- All API requests require valid OIDC access token
- Backend validates token against IDP's JWKS
- Token extracted and verified on every request

### Permission Checking
1. Backend validates OIDC token
2. Extracts user's IDP ID
3. Looks up user in database
4. Checks CustomerUser table for requested customer
5. Verifies role allows requested action
6. Allows or denies request

### No Direct Customer Access
- Users can only access customers they belong to
- Customer data isolated by CustomerUser relationships
- API enforces these boundaries

## Edge Cases Handled

### User Exists But No Customers
- Redirected to onboarding
- Must create or accept invite

### Multiple Pending Invites
- Shows all invites
- Can process one by one
- Can skip and create own customer

### User Already Belongs to Customer
- Duplicate invites prevented by database constraint
- `unique([email, customerId])` on Invite model

### Concurrent Customer Creation
- Handled by database constraints
- Slug must be unique across all customers

## Future Enhancements

### Possible Additions
1. Email notifications for invites
2. Invite expiration dates
3. Bulk user import
4. Customer transfer/ownership change
5. Audit log for customer actions
6. Multi-role per customer (e.g., ADMIN + BILLING)

### Additional Pages to Build
- User management (list, invite, remove)
- Customer settings
- Analytics dashboard
- Documents/files
- Activity logs

