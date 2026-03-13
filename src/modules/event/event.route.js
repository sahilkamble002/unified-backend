import express from "express"

import {
  createEvent,
  getUserEvents,
  getEventById,
  addEventMember,
  getEventMembers,
  updateMemberRole,
  removeEventMember,
  updateEvent,
  deleteEvent
} from "./event.controller.js"

import { verifyJWT } from "../../middlerware/auth.middleware.js"
import { requireEventRole } from "../../middlerware/eventRole.middleware.js"

const router = express.Router()

/* ===============================
   EVENT ROUTES
================================= */

router.post("/", verifyJWT, createEvent)

router.get("/", verifyJWT, getUserEvents)

router.get("/:eventId", verifyJWT, getEventById)

router.patch(
  "/:eventId",
  verifyJWT,
  requireEventRole("SUPER_ADMIN", "ADMIN"),
  updateEvent
)

router.delete(
  "/:eventId",
  verifyJWT,
  deleteEvent
)

/* ===============================
   EVENT MEMBER ROUTES
================================= */

router.post(
  "/:eventId/members",
  verifyJWT,
  requireEventRole("SUPER_ADMIN", "ADMIN"),
  addEventMember
)

router.get(
  "/:eventId/members",
  verifyJWT,
  getEventMembers
)

router.patch(
  "/:eventId/members/:username",
  verifyJWT,
  requireEventRole("SUPER_ADMIN", "ADMIN"),
  updateMemberRole
)

router.delete(
  "/:eventId/members/:username",
  verifyJWT,
  requireEventRole("SUPER_ADMIN", "ADMIN"),
  removeEventMember
)

export default router
