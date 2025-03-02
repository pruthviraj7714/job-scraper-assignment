/*
  Warnings:

  - A unique constraint covering the columns `[url]` on the table `Job` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Job_url_key" ON "Job"("url");
