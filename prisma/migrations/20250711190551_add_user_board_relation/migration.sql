/*
  Warnings:

  - You are about to drop the column `position` on the `boards` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_boards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "archivedAt" DATETIME,
    "userId" TEXT NOT NULL,
    CONSTRAINT "boards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_boards" ("archivedAt", "createdAt", "description", "id", "name", "updatedAt", "userId") SELECT "archivedAt", "createdAt", "description", "id", "name", "updatedAt", "userId" FROM "boards";
DROP TABLE "boards";
ALTER TABLE "new_boards" RENAME TO "boards";
CREATE INDEX "boards_userId_idx" ON "boards"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
