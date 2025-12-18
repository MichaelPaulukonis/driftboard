-- CreateTable
CREATE TABLE "board_memberships" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'EDITOR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "board_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("userId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "board_memberships_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards" ("boardId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "board_memberships_boardId_idx" ON "board_memberships"("boardId");

-- CreateIndex
CREATE INDEX "board_memberships_userId_idx" ON "board_memberships"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "board_memberships_userId_boardId_key" ON "board_memberships"("userId", "boardId");
