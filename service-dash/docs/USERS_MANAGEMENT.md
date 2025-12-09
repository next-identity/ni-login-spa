# Users Management

## Overview

The Users page allows admins to manage team members within their customer organization.

## Roles

### Admin
- **Permissions**:
  - Invite new users
  - View all users in the customer
  - Manage customer settings
  - Full access to all dashboard features

### Read-Only
- **Permissions**:
  - View dashboard features
  - Cannot invite users
  - Cannot modify settings

## User Invitation Flow

### For Admins

1. **Navigate to Users Page**
   - Click "Users" in the sidebar
   - Only accessible if you're an Admin

2. **Invite a User**
   - Click "Invite User" button
   - Enter the user's email address
   - Select role: Admin or Read-Only
   - Click "Send Invite"

3. **What Happens**
   - Invite created with status: PENDING
   - User doesn't receive email (handled on login)
   - Invite appears in "Pending Invites" section

### For Invited Users

1. **Sign In**
   - User authenticates with OIDC provider
   - System checks for pending invites

2. **Invites Page**
   - Shows all pending invitations
   - Can see which customer and what role
   - Options: Accept or Decline

3. **Accept Invite**
   - User added to customer with specified role
   - Status changed from PENDING to ACCEPTED
   - Redirected to dashboard

4. **Decline Invite**
   - Status changed to DECLINED
   - User not added to customer
   - Can still create own customer if desired

## Users Page UI

### Active Users Section

Shows all users currently part of the customer:

```
┌─────────────────────────────────────────┐
│ Active Users                             │
├─────────────────────────────────────────┤
│ [Avatar] John Doe                        │
│          john@example.com                │
│          [Admin Badge] Joined 11/26/25   │
├─────────────────────────────────────────┤
│ [Avatar] Jane Smith                      │
│          jane@example.com                │
│          [Read-Only Badge] Joined 11/25  │
└─────────────────────────────────────────┘
```

### Pending Invites Section

Shows invitations that haven't been accepted yet:

```
┌─────────────────────────────────────────┐
│ Pending Invites                          │
├─────────────────────────────────────────┤
│ [Clock] bob@example.com                  │
│         Invited 11/26/25                 │
│         [Read-Only Badge]                │
└─────────────────────────────────────────┘
```

### Invite Dialog

Modal form for inviting users:

```
┌─────────────────────────────────┐
│ Invite a User                   │
│                                 │
│ Email Address:                  │
│ [user@example.com        ]      │
│                                 │
│ Role:                          │
│ [Admin ▼]                      │
│   - Admin                      │
│   - Read-Only                  │
│                                 │
│ ℹ️ Admins can invite users and  │
│   manage settings. Read-only   │
│   users can view only.         │
│                                 │
│ [Cancel] [Send Invite]         │
└─────────────────────────────────┘
```

## API Endpoints

### GET /api/customers/:customerId/users

Get all users and pending invites for a customer.

**Authorization**: Admin only

**Response**:
```json
{
  "users": [
    {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name",
      "role": "ADMIN",
      "joinedAt": "2025-11-26T...",
      "status": "ACTIVE"
    }
  ],
  "pendingInvites": [
    {
      "id": "invite-id",
      "email": "pending@example.com",
      "role": "READ_ONLY",
      "invitedAt": "2025-11-26T...",
      "status": "PENDING"
    }
  ]
}
```

### POST /api/invites

Create a new invitation.

**Authorization**: Admin only

**Request**:
```json
{
  "email": "newuser@example.com",
  "customerId": "customer-id",
  "role": "READ_ONLY"
}
```

**Response**:
```json
{
  "id": "invite-id",
  "email": "newuser@example.com",
  "customerId": "customer-id",
  "role": "READ_ONLY",
  "status": "PENDING",
  "inviterId": "inviter-id",
  "createdAt": "2025-11-26T..."
}
```

## Business Rules

### Invitation Rules

1. **Admin-Only Creation**
   - Only users with ADMIN role can create invites
   - Enforced at API level

2. **Email Uniqueness**
   - Cannot invite same email to same customer twice
   - Database constraint prevents duplicates

3. **No Notification**
   - Invites don't send emails
   - User sees invite on next sign-in

4. **Pending Status**
   - All new invites start as PENDING
   - Changed to ACCEPTED or DECLINED by user

### Role Permissions

| Feature | Admin | Read-Only |
|---------|-------|-----------|
| View Dashboard | ✅ | ✅ |
| View Users Page | ✅ | ❌ |
| Invite Users | ✅ | ❌ |
| Manage Settings | ✅ | ❌ |
| View Analytics | ✅ | ✅ |
| View Documents | ✅ | ✅ |

## Access Control

### Frontend Protection

```typescript
// Users page checks if user is admin
const customerUser = await prisma.customerUser.findUnique({
  where: {
    userId_customerId: {
      userId: user.id,
      customerId,
    },
  },
});

if (!customerUser || customerUser.role !== 'ADMIN') {
  return res.status(403).json({ error: 'Only admins can view users' });
}
```

### Backend Enforcement

All user management endpoints:
1. Validate OIDC token
2. Find user in database
3. Check CustomerUser relationship
4. Verify ADMIN role
5. Allow or deny action

## UI Components

### User Card

Shows user information:
- Avatar with initial
- Name and email
- Role badge (Admin/Read-Only)
- Join date

### Invite Card

Shows pending invitation:
- Clock icon
- Email address
- Role badge
- Invitation date
- Dashed border for visual distinction

### Invite Button

Primary action button:
- Icon: UserPlus
- Text: "Invite User"
- Opens modal dialog
- Only visible to admins

## Future Enhancements

### Possible Features
1. **Remove Users**: Allow admins to remove users
2. **Change Roles**: Update user roles
3. **Resend Invites**: Re-invite declined users
4. **Bulk Import**: Upload CSV of users
5. **Email Notifications**: Send invite emails
6. **Invite Links**: Generate shareable invite URLs
7. **Expiration**: Auto-expire old invites

### Additional Roles
- BILLING: Can manage billing only
- SUPPORT: Limited access for support staff
- VIEWER: More restricted than READ_ONLY

## Security

### Data Isolation
- Users only see their own customer's users
- Cannot access other customers' user lists
- Enforced at database query level

### Permission Validation
- Every request validates token
- Checks user's role for that specific customer
- Global admin doesn't exist (admin is per-customer)

### Audit Trail
- CreatedAt timestamps on invites
- UpdatedAt timestamps on status changes
- Can extend for full audit log

## Database Schema

### CustomerUser Model
```prisma
model CustomerUser {
  id         String   @id @default(cuid())
  userId     String
  customerId String
  role       Role     @default(READ_ONLY)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  user     User     @relation(...)
  customer Customer @relation(...)
  
  @@unique([userId, customerId])
}
```

### Invite Model
```prisma
model Invite {
  id         String       @id @default(cuid())
  email      String
  customerId String
  role       Role         @default(READ_ONLY)
  status     InviteStatus @default(PENDING)
  inviterId  String
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @updatedAt
  
  inviter User @relation(...)
  
  @@unique([email, customerId])
}
```

### InviteStatus Enum
```prisma
enum InviteStatus {
  PENDING
  ACCEPTED
  DECLINED
}
```

## Testing

### Test as Admin

1. Sign in as an admin user
2. Go to Users page
3. Click "Invite User"
4. Enter email and select role
5. Submit
6. Verify invite appears in Pending Invites

### Test as Read-Only User

1. Sign in as read-only user
2. Try to access /dashboard/users
3. Should see "Access Denied" or be redirected

### Test Invite Acceptance

1. Use invite email to sign in
2. See pending invites page
3. Accept invite
4. Verify added to customer
5. Check role is correct

## Error Messages

- **"Only admins can view users"**: User doesn't have ADMIN role
- **"Only admins can send invites"**: User tried to invite without permission
- **"Email and customer ID are required"**: Missing required fields
- **"Failed to send invite"**: Database or validation error
- **"Invite not found"**: Invalid invite ID or wrong user
- **"Invite already processed"**: Trying to accept/decline twice

