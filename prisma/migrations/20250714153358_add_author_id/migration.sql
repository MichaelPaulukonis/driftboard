/*
  Warnings:

  - You are about to drop the column `userId` on the `boards` table. All the data in the column will be lost.
  - Added the required column `authorId` to the `boards` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_boards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boardId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "archivedAt" DATETIME,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "boards_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_boards" ("archivedAt", "boardId", "createdAt", "description", "id", "name", "status", "updatedAt", "version") SELECT "archivedAt", "boardId", "createdAt", "description", "id", "name", "status", "updatedAt", "version" FROM "boards";
DROP TABLE "boards";
ALTER TABLE "new_boards" RENAME TO "boards";
CREATE INDEX "boards_authorId_status_idx" ON "boards"("authorId", "status");
CREATE UNIQUE INDEX "boards_boardId_version_key" ON "boards"("boardId", "version");
CREATE TABLE "new_cards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cardId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "position" REAL NOT NULL,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "listId" TEXT NOT NULL,
    CONSTRAINT "cards_listId_fkey" FOREIGN KEY ("listId") REFERENCES "lists" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_cards" ("cardId", "createdAt", "description", "dueDate", "id", "listId", "position", "status", "title", "updatedAt", "version") SELECT "cardId", "createdAt", "description", "dueDate", "id", "listId", "position", "status", "title", "updatedAt", "version" FROM "cards";
DROP TABLE "cards";
ALTER TABLE "new_cards" RENAME TO "cards";
CREATE INDEX "cards_listId_status_idx" ON "cards"("listId", "status");
CREATE UNIQUE INDEX "cards_cardId_version_key" ON "cards"("cardId", "version");
CREATE TABLE "new_lists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "name" TEXT NOT NULL,
    "position" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "boardId" TEXT NOT NULL,
    CONSTRAINT "lists_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_lists" ("boardId", "createdAt", "id", "listId", "name", "position", "status", "updatedAt", "version") SELECT "boardId", "createdAt", "id", "listId", "name", "position", "status", "updatedAt", "version" FROM "lists";
DROP TABLE "lists";
ALTER TABLE "new_lists" RENAME TO "lists";
CREATE INDEX "lists_boardId_status_idx" ON "lists"("boardId", "status");
CREATE UNIQUE INDEX "lists_listId_version_key" ON "lists"("listId", "version");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
