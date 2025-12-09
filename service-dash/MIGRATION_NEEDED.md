# ⚠️ Database Migration Required

The database schema has been updated to change role names from `MEMBER` to `READ_ONLY`.

## Run This Command

```bash
cd backend
npm run prisma:migrate
```

When prompted for a migration name, use:
```
rename_member_to_read_only
```

This will:
1. Update the Role enum from MEMBER to READ_ONLY
2. Update all existing data
3. Update foreign key constraints

## Alternative: Reset Database (Development Only)

If you're in development and haven't created important data yet:

```bash
cd backend

# Reset database and run all migrations fresh
npx prisma migrate reset

# Generate Prisma Client
npm run prisma:generate
```

**Warning**: This will delete all existing data!

## After Migration

1. Restart the backend server
2. Sign in and test the users page
3. The role dropdown should show "Admin" and "Read-Only"

---

**This file can be deleted after running the migration.**

