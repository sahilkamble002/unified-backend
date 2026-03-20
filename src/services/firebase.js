import admin from "firebase-admin"

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  })
}

export const sendPushToTokens = async (tokens, payload) => {

  if (!tokens.length) {
    return {
      attempted: 0,
      delivered: 0,
      skipped: 0,
      invalidTokens: []
    }
  }

  const message = {
    tokens,
    notification: {
      title: payload.title,
      body: payload.body
    },
    data: {
      ...payload.data,
      eventId: String(payload.data?.eventId || "")
    }
  }

  try {
    const response = await admin.messaging().sendEachForMulticast(message)

    const invalidTokens = []

    response.responses.forEach((res, index) => {
      if (!res.success) {
        const code = res.error?.code

        if (
          code === "messaging/invalid-registration-token" ||
          code === "messaging/registration-token-not-registered"
        ) {
          invalidTokens.push(tokens[index])
        }
      }
    })

    return {
      attempted: tokens.length,
      delivered: response.successCount,
      skipped: tokens.length - response.successCount,
      invalidTokens
    }

  } catch (error) {
    console.error("FCM Error:", error)

    return {
      attempted: tokens.length,
      delivered: 0,
      skipped: tokens.length,
      invalidTokens: []
    }
  }
}