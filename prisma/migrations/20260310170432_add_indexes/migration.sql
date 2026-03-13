-- CreateIndex
CREATE INDEX "Donation_eventId_createdAt_idx" ON "Donation"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "Expense_eventId_idx" ON "Expense"("eventId");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
