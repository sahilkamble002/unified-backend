import express from "express"
import { verifyJWT } from "../../middlerware/auth.middleware.js"
import {
  getUserNotifications,
  markNotificationRead,
  createEventNotification
} from "./notification.controller.js"
import { requireEventRole } from "../../middlerware/eventRole.middleware.js"

const router = express.Router()

router.get("/", verifyJWT, getUserNotifications)
router.patch("/:notificationId/read", verifyJWT, markNotificationRead)
router.post(
  "/event/:eventId",
  verifyJWT,
  requireEventRole("SUPER_ADMIN", "ADMIN", "MANAGER"),
  createEventNotification
)

export default router
