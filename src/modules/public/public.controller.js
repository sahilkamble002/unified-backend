import prisma from "../../config/prisma.js"
import { apiError } from "../../utils/apiError.js"
import { apiResponse } from "../../utils/apiResponse.js"
import { asyncHandler } from "../../utils/asyncHandler.js"



const getPublicEvent = asyncHandler(async (req, res) => {

  const { eventId } = req.params

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      name: true,
      description: true,
      fundingGoal: true,
      donationUpiId: true,
      createdAt: true
    }
  })

  if (!event) {
    throw new apiError(404, "Event not found")
  }

  return res.status(200).json(
    new apiResponse(200, "Event fetched successfully", event)
  )

})

const getDonationProgress = asyncHandler(async (req, res) => {

  const { eventId } = req.params

  const totalDonations = await prisma.donation.aggregate({
    where: {
      eventId,
      status: "SUCCESS"
    },
    _sum: {
      amount: true
    }
  })

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      fundingGoal: true
    }
  })

  const raised = totalDonations._sum.amount || 0
  const goal = event?.fundingGoal || 0

  const progress = goal > 0 ? (raised / goal) * 100 : 0

  return res.status(200).json(
    new apiResponse(200, "Progress fetched", {
      raised,
      goal,
      progress
    })
  )

})


const getRecentDonations = asyncHandler(async (req, res) => {

  const { eventId } = req.params

  const donations = await prisma.donation.findMany({
    where: {
      eventId,
      status: "SUCCESS"
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 10,
    select: {
      donorName: true,
      amount: true,
      createdAt: true
    }
  })

  return res.status(200).json(
    new apiResponse(200, "Recent donations fetched", donations)
  )

})

const getPublicEvents = asyncHandler(async (req, res) => {

  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 10
  const skip = (page - 1) * limit

  const events = await prisma.event.findMany({
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc"
    },
    select: {
      id: true,
      name: true,
      description: true,
      fundingGoal: true,
      donationUpiId: true,
      createdAt: true
    }
  })

  const total = await prisma.event.count()

  return res.status(200).json(
    new apiResponse(200, "Public events fetched", {
      events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  )

})

const getPublicTopDonors = asyncHandler(async (req, res) => {

  const { eventId } = req.params

  const event = await prisma.event.findUnique({
    where: { id: eventId }
  })

  if (!event) {
    throw new apiError(404, "Event not found")
  }

  const donors = await prisma.donation.groupBy({
    by: ["donorName"],
    where: {
      eventId,
      status: "SUCCESS"
    },
    _sum: {
      amount: true
    },
    orderBy: {
      _sum: {
        amount: "desc"
      }
    },
    take: 10
  })

  const formatted = donors.map((d) => ({
    donorName: d.donorName,
    totalDonated: d._sum.amount
  }))

  return res.status(200).json(
    new apiResponse(200, "Top donors fetched successfully", formatted)
  )

})

export { getPublicEvent, getDonationProgress, getRecentDonations, getPublicEvents, getPublicTopDonors }
