import express from "express"


import {
  getPublicEvent,
  getDonationProgress,
  getRecentDonations,
  getPublicEvents,
  getPublicTopDonors
} from "./public.controller.js"

const router = express.Router()

router.get(
  "/event/:eventId",
  getPublicEvent
)

router.get(
  "/event/:eventId/donation-progress",
  getDonationProgress
)

router.get(
  "/event/:eventId/recent-donations",
  getRecentDonations
)

router.get(
  "/events",
  getPublicEvents
)

router.get(
  "/event/:eventId/top-donors",
  getPublicTopDonors
)

export default router