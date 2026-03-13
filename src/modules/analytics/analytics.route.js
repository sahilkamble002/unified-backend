import express from "express"
import { verifyJWT } from "../../middlerware/auth.middleware.js"
import { requireEventRole } from "../../middlerware/eventRole.middleware.js"
import { getEventAnalyticsOverview,
    getDonationTrend,
    getExpenseBreakdown,
    getTopDonorsAnalytics
 } from "./analytics.controller.js"

const router = express.Router()

router.get(
  "/:eventId/overview",
  verifyJWT,
  requireEventRole("SUPER_ADMIN", "ADMIN", "FINANCE"),
  getEventAnalyticsOverview
)

router.get(
  "/:eventId/donation-trend",
  verifyJWT,
  requireEventRole("SUPER_ADMIN", "ADMIN", "FINANCE"),
  getDonationTrend
)

router.get(
  "/:eventId/expense-breakdown",
  verifyJWT,
  requireEventRole("SUPER_ADMIN", "ADMIN", "FINANCE"),
  getExpenseBreakdown
)

router.get(
  "/:eventId/top-donors",
  verifyJWT,
  requireEventRole("SUPER_ADMIN", "ADMIN", "FINANCE"),
  getTopDonorsAnalytics
)
export default router