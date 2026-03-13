import express from "express"
import { verifyJWT } from "../../middlerware/auth.middleware.js"
import { requireEventRole } from "../../middlerware/eventRole.middleware.js"

import {
  createDonation,
  getEventDonations,
  getFinanceSummary,
  createExpense,
  getEventExpenses,
  getEventDonationQR,
  verifyDonation,
  getTopDonors
} from "./donation.controller.js"

const router = express.Router()

router.post(
  "/:eventId/donate",
  verifyJWT,
  requireEventRole("SUPER_ADMIN", "ADMIN", "FINANCE"),
  createDonation
)

router.get(
  "/:eventId/donations",
  verifyJWT,
  getEventDonations
)

router.get(
  "/:eventId/summary",
  verifyJWT,
  getFinanceSummary
)

router.post(
  "/:eventId/expense",
  verifyJWT,
  requireEventRole("SUPER_ADMIN", "ADMIN", "FINANCE"),
  createExpense
)

router.get(
  "/:eventId/expenses",
  verifyJWT,
  getEventExpenses
)

router.get(
  "/:eventId/donation-qr",
  verifyJWT,
  getEventDonationQR
)

router.patch(
  "/donation/:donationId/verify",
  verifyJWT,
  requireEventRole("SUPER_ADMIN", "ADMIN", "FINANCE"),
  verifyDonation
)

router.get(
  "/:eventId/top-donors",
  verifyJWT,
  getTopDonors
)

export default router
