import prisma from "../../config/prisma.js"
import { apiError } from "../../utils/apiError.js"
import { apiResponse } from "../../utils/apiResponse.js"
import { asyncHandler } from "../../utils/asyncHandler.js"

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
            fundingGoal: fundingGoal !== undefined && fundingGoal !== null
              ? Number(fundingGoal)
              : null,
            createdById: userId,
            members: {
                create: {
                    userId: userId,
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
            userId: userId
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
    const { username, role } = req.body

    if (!username || !role) {
        throw new apiError(400, "Username and role are required")
    }
    
    const user = await prisma.user.findUnique({
    where: { username: username.trim().toLowerCase() }
  });

  if (!user) {
    throw new apiError(404, "User not found");
  }

    const eventMember = await prisma.eventMember.create({
        data: {
            eventId,
            userId: user.id,
            role
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
            eventId: eventId
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true
                }
            }
        }
    })

    return res.status(200).json(
        new apiResponse(200, "Event members fetched successfully", members)
    )
})

const updateMemberRole = asyncHandler(async (req, res) => {

    const { eventId, username  } = req.params
    const { role } = req.body

   const user = await prisma.user.findUnique({
    where: { username: username.trim().toLowerCase() }
  });

  if (!user) {
    throw new apiError(404, "User not found");
  }

  const updatedMember = await prisma.eventMember.update({
    where: {
      eventId_userId: {
        eventId,
        userId: user.id
      }
    },
    data: { role }
  });

    return res.status(200).json(
        new apiResponse(200, "Member role updated successfully", updatedMember)
    )
})

const removeEventMember = asyncHandler(async (req, res) => {

    const { eventId, username } = req.params;

  const user = await prisma.user.findUnique({
    where: { username: username.trim().toLowerCase() }
  });

  if (!user) {
    throw new apiError(404, "User not found");
  }

  await prisma.eventMember.delete({
    where: {
      eventId_userId: {
        eventId,
        userId: user.id
      }
    }
  });

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
      fundingGoal: fundingGoal !== undefined && fundingGoal !== null
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

    // delete members first
    await prisma.eventMember.deleteMany({
        where: { eventId }
    })

    // then delete event
    await prisma.event.delete({
        where: { id: eventId }
    })

    return res.status(200).json(
        new apiResponse(200, "Event deleted successfully")
    )
})


export { createEvent, getUserEvents, getEventById, addEventMember, getEventMembers, updateMemberRole, removeEventMember, updateEvent, deleteEvent }
