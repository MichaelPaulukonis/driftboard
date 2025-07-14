/*
  Warnings:

  - A unique constraint covering the columns `[boardId]` on the table `boards` will be added. If there are existing duplicate values, this will fail.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_cards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cardId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "listId" TEXT NOT NULL,
    "position" REAL NOT NULL,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cards_listId_fkey" FOREIGN KEY ("listId") REFERENCES "lists" ("listId") ON DELETE CASCADE ON UPDATE CASCADE
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
    "boardId" TEXT NOT NULL,
    "position" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "lists_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards" ("boardId") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_lists" ("boardId", "createdAt", "id", "listId", "name", "position", "status", "updatedAt", "version") SELECT "boardId", "createdAt", "id", "listId", "name", "position", "status", "updatedAt", "version" FROM "lists";
DROP TABLE "lists";
ALTER TABLE "new_lists" RENAME TO "lists";
CREATE UNIQUE INDEX "lists_listId_key" ON "lists"("listId");
CREATE INDEX "lists_boardId_status_idx" ON "lists"("boardId", "status");
CREATE UNIQUE INDEX "lists_listId_version_key" ON "lists"("listId", "version");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "boards_boardId_key" ON "boards"("boardId");
