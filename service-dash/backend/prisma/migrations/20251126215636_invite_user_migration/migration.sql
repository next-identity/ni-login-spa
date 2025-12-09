/*
  Warnings:

  - The values [MEMBER] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'READ_ONLY');
ALTER TABLE "public"."CustomerUser" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."Invite" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "CustomerUser" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TABLE "Invite" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "CustomerUser" ALTER COLUMN "role" SET DEFAULT 'READ_ONLY';
ALTER TABLE "Invite" ALTER COLUMN "role" SET DEFAULT 'READ_ONLY';
COMMIT;

-- AlterTable
ALTER TABLE "CustomerUser" ALTER COLUMN "role" SET DEFAULT 'READ_ONLY';

-- AlterTable
ALTER TABLE "Invite" ALTER COLUMN "role" SET DEFAULT 'READ_ONLY';
