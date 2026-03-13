import express from "express"

import {
  createTask,
  getEventTasks,
  assignTask,
  updateTaskProgress,
  updateTaskStatus,
  getTaskDetails,
  deleteTask
} from "./task.controller.js"

import { verifyJWT } from "../../middlerware/auth.middleware.js"
import { requireEventRole } from "../../middlerware/eventRole.middleware.js"

const router = express.Router()

/* ===============================
   EVENT TASK ROUTES
================================= */

router.post(
  "/:eventId/tasks",
  verifyJWT,
  requireEventRole("SUPER_ADMIN", "ADMIN", "MANAGER"),
  createTask
)

router.get(
  "/:eventId/tasks",
  verifyJWT,
  requireEventRole(
    "SUPER_ADMIN",
    "ADMIN",
    "FINANCE",
    "MANAGER",
    "VOLUNTEER",
    "VIEWER"
  ),
  getEventTasks
)

/* ===============================
   TASK ACTION ROUTES
================================= */

router.post(
  "/:taskId/assign",
  verifyJWT,
  requireEventRole("SUPER_ADMIN", "ADMIN", "MANAGER"),
  assignTask
)

router.patch(
  "/:taskId/progress",
  verifyJWT,
  updateTaskProgress
)

router.patch(
  "/:taskId/status",
  verifyJWT,
  updateTaskStatus
)

router.get(
  "/:taskId",
  verifyJWT,
  getTaskDetails
)

router.delete(
  "/:taskId",
  verifyJWT,
  requireEventRole("SUPER_ADMIN", "ADMIN", "MANAGER"),
  deleteTask
)

export default router
