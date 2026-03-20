import prisma from "../../config/prisma.js"
import { apiError } from "../../utils/apiError.js"
import { apiResponse } from "../../utils/apiResponse.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import { sendPushToTokens } from "../../services/firebase.js"


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

  // Get event members
  const members = await prisma.eventMember.findMany({
    where: { eventId },
    select: { userId: true }
  })

  if (!members.length) {
    throw new apiError(404, "No members found for this event")
  }

  // Save notifications
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

  // Get push tokens
  const pushTokensData = await prisma.pushToken.findMany({
    where: {
      userId: {
        in: members.map((m) => m.userId)
      }
    },
    select: { token: true }
  })

  const pushTokens = pushTokensData.map(t => t.token)


  if (!pushTokens.length) {
    return res.status(201).json(
      new apiResponse(201, "Notification saved but no push tokens found", {
        count: payload.length,
        push: {
          attempted: 0,
          delivered: 0,
          skipped: payload.length
        }
      })
    )
  }

  // Send push
  const pushResult = await sendPushToTokens(pushTokens, {
    title: title.trim(),
    body: message.trim(),
    data: {
      eventId,
      type: type?.trim() || "GENERAL",
      link: "/notifications"
    }
  })

  // Remove invalid tokens
  if (pushResult.invalidTokens.length) {
    await prisma.pushToken.deleteMany({
      where: {
        token: {
          in: pushResult.invalidTokens
        }
      }
    })
  }

  return res.status(201).json(
    new apiResponse(201, "Notification sent", {
      count: payload.length,
      push: pushResult
    })
  )

})

const getPushConfig = asyncHandler(async (req, res) => {

  const projectId = process.env.FIREBASE_WEB_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || ""
  const authDomain =
    process.env.FIREBASE_WEB_AUTH_DOMAIN ||
    (projectId ? `${projectId}.firebaseapp.com` : "")
  const storageBucket =
    process.env.FIREBASE_WEB_STORAGE_BUCKET ||
    (projectId ? `${projectId}.firebasestorage.app` : "")

  return res.status(200).json(
    new apiResponse(200, "Push config fetched", {
      apiKey: process.env.FIREBASE_WEB_API_KEY || "",
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId: process.env.FIREBASE_WEB_MESSAGING_SENDER_ID || "",
      appId: process.env.FIREBASE_WEB_APP_ID || "",
      vapidKey: process.env.FIREBASE_WEB_VAPID_KEY || ""
    })
  )

})


const registerPushToken = asyncHandler(async (req, res) => {

  const userId = req.user.id
  const token = req.body?.token?.trim()
  const platform = req.body?.platform?.trim()

  if (!token || !platform) {
    throw new apiError(400, "Token and platform are required")
  }

  if (!["WEB", "ANDROID", "IOS"].includes(platform)) {
    throw new apiError(400, "Invalid platform")
  }

  const pushToken = await prisma.pushToken.upsert({
    where: { token },
    update: {
      userId,
      platform,
      lastSeenAt: new Date()
    },
    create: {
      userId,
      token,
      platform,
      lastSeenAt: new Date()
    }
  })

  return res.status(200).json(
    new apiResponse(200, "Token registered", pushToken)
  )

})


const unregisterPushToken = asyncHandler(async (req, res) => {

  const userId = req.user.id
  const token = req.body?.token?.trim()

  if (!token) {
    throw new apiError(400, "Token required")
  }

  await prisma.pushToken.deleteMany({
    where: {
      userId,
      token
    }
  })

  return res.status(200).json(
    new apiResponse(200, "Token removed", { token })
  )

})


export {
  getPushConfig,
  getUserNotifications,
  markNotificationRead,
  createEventNotification,
  registerPushToken,
  unregisterPushToken
}
