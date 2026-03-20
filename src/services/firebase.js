import admin from "firebase-admin"

let firebaseInitAttempted = false
let firebaseReady = false

const getFirebaseCredentialConfig = () => {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim()
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim()
  const privateKey = process.env.FIREBASE_PRIVATE_KEY

  if (!projectId || !clientEmail || !privateKey) {
    return null
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n")
  }
}

const ensureFirebaseInitialized = () => {
  if (admin.apps.length) {
    firebaseReady = true
    return true
  }

  if (firebaseInitAttempted) {
    return firebaseReady
  }

  firebaseInitAttempted = true

  const credentialConfig = getFirebaseCredentialConfig()

  if (!credentialConfig) {
    console.warn("FCM skipped: Firebase Admin credentials are missing")
    firebaseReady = false
    return false
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(credentialConfig)
    })
    firebaseReady = true
    return true
  } catch (error) {
    console.error("FCM initialization failed:", error)
    firebaseReady = false
    return false
  }
}

const normalizeDataPayload = (payload = {}) =>
  Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, String(value ?? "")])
  )

export const sendPushToTokens = async (tokens, payload = {}) => {
  if (!Array.isArray(tokens) || !tokens.length) {
    return {
      attempted: 0,
      delivered: 0,
      skipped: 0,
      invalidTokens: []
    }
  }

  if (!ensureFirebaseInitialized()) {
    return {
      attempted: tokens.length,
      delivered: 0,
      skipped: tokens.length,
      invalidTokens: []
    }
  }

  const notificationBody = payload.body || payload.message || ""

  const message = {
    tokens,
    notification: {
      title: payload.title || "",
      body: notificationBody
    },
    data: normalizeDataPayload({
      ...payload.data,
      eventId: payload.data?.eventId || ""
    })
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
