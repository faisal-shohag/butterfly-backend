/*
  Warnings:

  - You are about to drop the column `bookId` on the `Like` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,postId,commentId,replyId]` on the table `Like` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_bookId_fkey";

-- DropIndex
DROP INDEX "Like_userId_bookId_postId_commentId_replyId_key";

-- AlterTable
ALTER TABLE "Like" DROP COLUMN "bookId";

-- AlterTable
ALTER TABLE "coins" ALTER COLUMN "value" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "BookLike" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" INTEGER NOT NULL,

    CONSTRAINT "BookLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookLike_userId_idx" ON "BookLike"("userId");

-- CreateIndex
CREATE INDEX "BookLike_bookId_idx" ON "BookLike"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "BookLike_userId_bookId_key" ON "BookLike"("userId", "bookId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_userId_postId_commentId_replyId_key" ON "Like"("userId", "postId", "commentId", "replyId");

-- AddForeignKey
ALTER TABLE "BookLike" ADD CONSTRAINT "BookLike_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookLike" ADD CONSTRAINT "BookLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
