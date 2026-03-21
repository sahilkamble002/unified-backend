import prisma from "../../config/prisma.js"
import { apiError } from "../../utils/apiError.js"
import { apiResponse } from "../../utils/apiResponse.js"
import { asyncHandler } from "../../utils/asyncHandler.js"

const EVENT_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "FINANCE",
  "MANAGER",
  "VOLUNTEER",
  "VIEWER"
]

const ROLE_LIMITS = {
  SUPER_ADMIN: 1,
  ADMIN: 1,
  MANAGER: 1,
  FINANCE: 2
}

const ROLE_LIMIT_MESSAGES = {
  SUPER_ADMIN: "Only one SUPER_ADMIN is allowed in an event",
  ADMIN: "Only one ADMIN is allowed in an event",
  MANAGER: "Only one MANAGER is allowed in an event",
  FINANCE: "Only two FINANCE members are allowed in an event"
}

const normalizeRole = (role) => role?.trim().toUpperCase()

const assertValidEventRole = (role) => {
  if (!EVENT_ROLES.includes(role)) {
    throw new apiError(400, "Invalid event role")
  }
}

const findUserByUsername = async (username) => {
  const normalizedUsername = username?.trim().toLowerCase()

  if (!normalizedUsername) {
    throw new apiError(400, "Username is required")
  }

  const user = await prisma.user.findUnique({
    where: { username: normalizedUsername }
  })

  if (!user) {
    throw new apiError(404, "User not found")
  }

  return user
}

const getEventMemberByUserId = (eventId, userId) =>
  prisma.eventMember.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId
      }
    }
  })

const assertRoleCapacity = async (eventId, role, excludeUserId = null) => {
  const roleLimit = ROLE_LIMITS[role]

  if (!roleLimit) {
    return
  }

  const roleCount = await prisma.eventMember.count({
    where: {
      eventId,
      role,
      ...(excludeUserId
        ? {
            userId: {
              not: excludeUserId
            }
          }
        : {})
    }
  })

  if (roleCount >= roleLimit) {
    throw new apiError(400, ROLE_LIMIT_MESSAGES[role])
  }
}

const createEvent = asyncHandler(async (req, res) => {
  const { name, description, donationUpiId, fundingGoal } = req.body

  if (!name) {
    throw new apiError(400, "Event name is required")
  }

  const userId = req.user.id

  const event = await prisma.event.create({
    data: {
      name,
      description,
      donationUpiId,
      fundingGoal:
        fundingGoal !== undefined && fundingGoal !== null
          ? Number(fundingGoal)
          : null,
      createdById: userId,
      members: {
        create: {
          userId,
          role: "SUPER_ADMIN"
        }
      }
    }
  })

  return res.status(201).json(
    new apiResponse(201, "Event created successfully", event)
  )
})

const getUserEvents = asyncHandler(async (req, res) => {
  const userId = req.user.id

  const events = await prisma.eventMember.findMany({
    where: {
      userId
    },
    include: {
      event: true
    }
  })

  return res.status(200).json(
    new apiResponse(200, "User events fetched successfully", events)
  )
})

const getEventById = asyncHandler(async (req, res) => {
  const { eventId } = req.params

  const event = await prisma.event.findUnique({
    where: {
      id: eventId
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          username: true,
          email: true
        }
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true
            }
          }
        }
      }
    }
  })

  if (!event) {
    throw new apiError(404, "Event not found")
  }

  return res.status(200).json(
    new apiResponse(200, "Event details fetched successfully", event)
  )
})

const addEventMember = asyncHandler(async (req, res) => {
  const { eventId } = req.params
  const normalizedRole = normalizeRole(req.body?.role)

  if (!req.body?.username || !normalizedRole) {
    throw new apiError(400, "Username and role are required")
  }

  assertValidEventRole(normalizedRole)

  const user = await findUserByUsername(req.body.username)

  const existingMember = await getEventMemberByUserId(eventId, user.id)

  if (existingMember) {
    throw new apiError(400, "User is already a member of this event")
  }

  await assertRoleCapacity(eventId, normalizedRole)

  const eventMember = await prisma.eventMember.create({
    data: {
      eventId,
      userId: user.id,
      role: normalizedRole
    }
  })

  return res.status(201).json(
    new apiResponse(201, "Member added successfully", eventMember)
  )
})

const getEventMembers = asyncHandler(async (req, res) => {
  const { eventId } = req.params

  const members = await prisma.eventMember.findMany({
    where: {
      eventId
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          username: true
        }
      }
    }
  })

  return res.status(200).json(
    new apiResponse(200, "Event members fetched successfully", members)
  )
})

const updateMemberRole = asyncHandler(async (req, res) => {
  const { eventId, username } = req.params
  const normalizedRole = normalizeRole(req.body?.role)

  if (!normalizedRole) {
    throw new apiError(400, "Role is required")
  }

  assertValidEventRole(normalizedRole)

  const user = await findUserByUsername(username)
  const existingMember = await getEventMemberByUserId(eventId, user.id)

  if (!existingMember) {
    throw new apiError(404, "Event member not found")
  }

  if (existingMember.role === normalizedRole) {
    return res.status(200).json(
      new apiResponse(200, "Member role updated successfully", existingMember)
    )
  }

  if (existingMember.role === "SUPER_ADMIN" || normalizedRole === "SUPER_ADMIN") {
    throw new apiError(400, "SUPER_ADMIN role is fixed for this event")
  }

  await assertRoleCapacity(eventId, normalizedRole, user.id)

  const updatedMember = await prisma.eventMember.update({
    where: {
      eventId_userId: {
        eventId,
        userId: user.id
      }
    },
    data: { role: normalizedRole }
  })

  return res.status(200).json(
    new apiResponse(200, "Member role updated successfully", updatedMember)
  )
})

const removeEventMember = asyncHandler(async (req, res) => {
  const { eventId, username } = req.params

  const user = await findUserByUsername(username)
  const existingMember = await getEventMemberByUserId(eventId, user.id)

  if (!existingMember) {
    throw new apiError(404, "Event member not found")
  }

  if (existingMember.role === "SUPER_ADMIN") {
    throw new apiError(400, "SUPER_ADMIN cannot be removed from the event")
  }

  await prisma.eventMember.delete({
    where: {
      eventId_userId: {
        eventId,
        userId: user.id
      }
    }
  })

  return res.status(200).json(
    new apiResponse(200, "Member removed successfully")
  )
})

const updateEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params
  const { name, description, donationUpiId, fundingGoal } = req.body

  const event = await prisma.event.findUnique({
    where: { id: eventId }
  })

  if (!event) {
    throw new apiError(404, "Event not found")
  }

  const updatedEvent = await prisma.event.update({
    where: { id: eventId },
    data: {
      name,
      description,
      donationUpiId,
      fundingGoal:
        fundingGoal !== undefined && fundingGoal !== null
          ? Number(fundingGoal)
          : null
    }
  })

  return res.status(200).json(
    new apiResponse(200, "Event updated successfully", updatedEvent)
  )
})

const deleteEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params
  const userId = req.user.id

  const event = await prisma.event.findUnique({
    where: { id: eventId }
  })

  if (!event) {
    throw new apiError(404, "Event not found")
  }

  if (event.createdById !== userId) {
    const membership = await prisma.eventMember.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId
        }
      }
    })

    if (!membership || membership.role !== "SUPER_ADMIN") {
      throw new apiError(403, "Only the event creator or SUPER_ADMIN can delete this event")
    }
  }

  await prisma.eventMember.deleteMany({
    where: { eventId }
  })

  await prisma.event.delete({
    where: { id: eventId }
  })

  return res.status(200).json(
    new apiResponse(200, "Event deleted successfully")
  )
})

export {
  createEvent,
  getUserEvents,
  getEventById,
  addEventMember,
  getEventMembers,
  updateMemberRole,
  removeEventMember,
  updateEvent,
  deleteEvent
}
