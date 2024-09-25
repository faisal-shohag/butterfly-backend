/*
  Warnings:

  - You are about to drop the `LookingFor` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `lookingFor` to the `Book` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "lookingFor" JSONB NOT NULL;

-- DropTable
DROP TABLE "LookingFor";
