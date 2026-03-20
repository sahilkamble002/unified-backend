import express from "express"
import { verifyJWT } from "../../middlerware/auth.middleware.js"
import {
  getPushConfig,
  getUserNotifications,
  markNotificationRead,
  createEventNotification,
  registerPushToken,
  unregisterPushToken
} from "./notification.controller.js"
import { requireEventRole } from "../../middlerware/eventRole.middleware.js"

const router = express.Router()

router.get("/push-config", verifyJWT, getPushConfig)
router.get("/", verifyJWT, getUserNotifications)
router.post("/push-token", verifyJWT, registerPushToken)
router.delete("/push-token", verifyJWT, unregisterPushToken)
router.patch("/:notificationId/read", verifyJWT, markNotificationRead)
router.post(
  "/event/:eventId",
  verifyJWT,
  requireEventRole("SUPER_ADMIN", "ADMIN", "FINANCE"),
  createEventNotification
)

export default router
