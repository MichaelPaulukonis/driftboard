-- DropIndex
DROP INDEX "lists_listId_key";

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
    CONSTRAINT "cards_listId_fkey" FOREIGN KEY ("listId") REFERENCES "lists" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_cards" ("cardId", "createdAt", "description", "dueDate", "id", "listId", "position", "status", "title", "updatedAt", "version") SELECT "cardId", "createdAt", "description", "dueDate", "id", "listId", "position", "status", "title", "updatedAt", "version" FROM "cards";
DROP TABLE "cards";
ALTER TABLE "new_cards" RENAME TO "cards";
CREATE INDEX "cards_listId_status_idx" ON "cards"("listId", "status");
CREATE UNIQUE INDEX "cards_cardId_version_key" ON "cards"("cardId", "version");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
