-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_boards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boardId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
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
CREATE INDEX "boards_userId_status_idx" ON "boards"("userId", "status");
CREATE UNIQUE INDEX "boards_boardId_version_key" ON "boards"("boardId", "version");
CREATE TABLE "new_cards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cardId" TEXT,
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
INSERT INTO "new_cards" ("createdAt", "description", "dueDate", "id", "listId", "position", "title", "updatedAt") SELECT "createdAt", "description", "dueDate", "id", "listId", "position", "title", "updatedAt" FROM "cards";
DROP TABLE "cards";
ALTER TABLE "new_cards" RENAME TO "cards";
CREATE INDEX "cards_listId_status_idx" ON "cards"("listId", "status");
CREATE UNIQUE INDEX "cards_cardId_version_key" ON "cards"("cardId", "version");
CREATE TABLE "new_lists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "name" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "position" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "lists_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_lists" ("boardId", "createdAt", "id", "name", "position", "updatedAt") SELECT "boardId", "createdAt", "id", "name", "position", "updatedAt" FROM "lists";
DROP TABLE "lists";
ALTER TABLE "new_lists" RENAME TO "lists";
CREATE INDEX "lists_boardId_status_idx" ON "lists"("boardId", "status");
CREATE UNIQUE INDEX "lists_listId_version_key" ON "lists"("listId", "version");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("createdAt", "email", "id", "name", "updatedAt") SELECT "createdAt", "email", "id", "name", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_userId_key" ON "users"("userId");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
