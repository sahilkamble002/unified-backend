import prisma from "../config/prisma.js"
import { apiError } from "../utils/apiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const requireEventRole = (...allowedRoles) => {

  return asyncHandler(async (req, res, next) => {

    const userId = req.user.id
    let { eventId } = req.params

    // 🔹 Resolve eventId from task
    if (!eventId && req.params.taskId) {

      const task = await prisma.task.findUnique({
        where: { id: req.params.taskId },
        select: { eventId: true }
      })

      if (!task) {
        throw new apiError(404, "Task not found")
      }

      eventId = task.eventId
    }

    // 🔹 Resolve eventId from donation
    if (!eventId && req.params.donationId) {

      const donation = await prisma.donation.findUnique({
        where: { id: req.params.donationId },
        select: { eventId: true }
      })

      if (!donation) {
        throw new apiError(404, "Donation not found")
      }

      eventId = donation.eventId
    }

    // ❗ NOW check if eventId exists
    if (!eventId) {
      throw new apiError(400, "EventId is required")
    }

    const membership = await prisma.eventMember.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId
        }
      }
    })

    if (!membership) {
      throw new apiError(403, "You are not a member of this event")
    }

    if (!allowedRoles.includes(membership.role)) {
      throw new apiError(403, "You do not have permission for this action")
    }

    req.eventRole = membership.role

    next()

  })
}

export { requireEventRole }