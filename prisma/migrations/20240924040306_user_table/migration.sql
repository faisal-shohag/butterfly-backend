-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "photoURL" TEXT NOT NULL DEFAULT 'https://i.postimg.cc/5tqhtjwH/image.png',
    "userId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
