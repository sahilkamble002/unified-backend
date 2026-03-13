import prisma from "../../config/prisma.js"
import { apiError } from "../../utils/apiError.js"
import { apiResponse } from "../../utils/apiResponse.js"
import { asyncHandler } from "../../utils/asyncHandler.js"



const getUserNotifications = asyncHandler(async (req, res) => {

  const userId = req.user.id

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  })

  return res.status(200).json(
    new apiResponse(200, "Notifications fetched", notifications)
  )

})


const markNotificationRead = asyncHandler(async (req, res) => {

  const { notificationId } = req.params

  const notification = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true }
  })

  return res.status(200).json(
    new apiResponse(200, "Notification marked as read", notification)
  )

})

const createEventNotification = asyncHandler(async (req, res) => {

  const { eventId } = req.params
  const { title, message, type } = req.body

  if (!title || !message) {
    throw new apiError(400, "Title and message are required")
  }

  const members = await prisma.eventMember.findMany({
    where: { eventId },
    select: { userId: true }
  })

  if (!members.length) {
    throw new apiError(404, "No members found for this event")
  }

  const payload = members.map((member) => ({
    userId: member.userId,
    eventId,
    title: title.trim(),
    message: message.trim(),
    type: type?.trim() || "GENERAL"
  }))

  await prisma.notification.createMany({
    data: payload
  })

  return res.status(201).json(
    new apiResponse(201, "Notification sent to event members", {
      count: payload.length
    })
  )

})

export {
  getUserNotifications,
  markNotificationRead,
  createEventNotification
}
