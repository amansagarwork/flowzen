-- AlterTable
ALTER TABLE "users" ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "projectInterests" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "username" DROP NOT NULL;
