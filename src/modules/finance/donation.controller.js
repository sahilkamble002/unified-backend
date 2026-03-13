import prisma from "../../config/prisma.js"
import { apiError } from "../../utils/apiError.js"
import { apiResponse } from "../../utils/apiResponse.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import QRCode from "qrcode"

const createDonation = asyncHandler(async (req, res) => {

  const { eventId } = req.params
  const { donorName, amount, paymentMethod, referenceId } = req.body

  if (!donorName || !amount) {
    throw new apiError(400, "Donor name and amount are required")
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId }
  })

  if (!event) {
    throw new apiError(404, "Event not found")
  }

  // Prevent duplicate transactions
  if (referenceId) {

    const existing = await prisma.donation.findUnique({
      where: { referenceId }
    })

    if (existing) {
      throw new apiError(400, "This payment reference already exists")
    }

  }

  const donation = await prisma.donation.create({
    data: {
      eventId,
      donorName,
      amount: Number(amount),
      paymentMethod,
      referenceId,
      status: "PENDING" // 👈 important
    }
  })

  return res.status(201).json(
    new apiResponse(201, "Donation submitted for verification", donation)
  )

})

const getEventDonations = asyncHandler(async (req, res) => {

  const { eventId } = req.params

  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 20
  const skip = (page - 1) * limit

  const event = await prisma.event.findUnique({
    where: { id: eventId }
  })

  if (!event) {
    throw new apiError(404, "Event not found")
  }

  const donations = await prisma.donation.findMany({
    where: { eventId },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit
  })

  const totalDonations = await prisma.donation.count({
    where: { eventId }
  })

  return res.status(200).json(
    new apiResponse(200, "Donations fetched successfully", {
      donations,
      pagination: {
        total: totalDonations,
        page,
        limit,
        totalPages: Math.ceil(totalDonations / limit)
      }
    })
  )

})



const getFinanceSummary = asyncHandler(async (req, res) => {

  const { eventId } = req.params

  const event = await prisma.event.findUnique({
    where: { id: eventId }
  })

  if (!event) {
    throw new apiError(404, "Event not found")
  }

  const donations = await prisma.donation.aggregate({
    where: { eventId, status: "SUCCESS" },
    _sum: {
      amount: true
    }
  })

  const expenses = await prisma.expense.aggregate({
    where: { eventId },
    _sum: {
      amount: true
    }
  })

  const totalDonations = donations._sum.amount || 0
  const totalExpenses = expenses._sum.amount || 0

  const balance = totalDonations - totalExpenses

  return res.status(200).json(
    new apiResponse(200, "Finance summary fetched", {
      totalDonations,
      totalExpenses,
      balance
    })
  )

})

const createExpense = asyncHandler(async (req, res) => {

  const { eventId } = req.params
  const { title, amount } = req.body

  const userId = req.user.id

  if (!title || !amount) {
    throw new apiError(400, "Title and amount are required")
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId }
  })

  if (!event) {
    throw new apiError(404, "Event not found")
  }

  const expense = await prisma.expense.create({
    data: {
      eventId,
      title,
      amount: Number(amount),
      paidBy: userId
    }
  })

  return res.status(201).json(
    new apiResponse(201, "Expense recorded successfully", expense)
  )

})

const getEventExpenses = asyncHandler(async (req, res) => {

  const { eventId } = req.params

  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 20
  const skip = (page - 1) * limit

  const event = await prisma.event.findUnique({
    where: { id: eventId }
  })

  if (!event) {
    throw new apiError(404, "Event not found")
  }

  const expenses = await prisma.expense.findMany({
    where: { eventId },
    orderBy: {
      createdAt: "desc"
    },
    skip,
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true
        }
      }
    }
  })

  const totalExpenses = await prisma.expense.count({
    where: { eventId }
  })

  return res.status(200).json(
    new apiResponse(200, "Expenses fetched successfully", {
      expenses,
      pagination: {
        total: totalExpenses,
        page,
        limit,
        totalPages: Math.ceil(totalExpenses / limit)
      }
    })
  )

})

const getEventDonationQR = asyncHandler(async (req, res) => {

  const { eventId } = req.params

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      name: true,
      donationUpiId: true
    }
  })

  if (!event) {
    throw new apiError(404, "Event not found")
  }

  if (!event.donationUpiId) {
    throw new apiError(400, "Event UPI ID not configured")
  }

  const upiLink =
    `upi://pay?pa=${encodeURIComponent(event.donationUpiId)}&pn=${encodeURIComponent(event.name)}&cu=INR`

  const qrCode = await QRCode.toDataURL(upiLink, {
    width: 320,
    margin: 1
  })

  return res.status(200).json(
    new apiResponse(200, "Donation QR generated", {
      qrCode
    })
  )

})

const verifyDonation = asyncHandler(async (req, res) => {

  const { donationId } = req.params

  const donation = await prisma.donation.findUnique({
    where: { id: donationId }
  })

  if (!donation) {
    throw new apiError(404, "Donation not found")
  }

  const updatedDonation = await prisma.donation.update({
    where: { id: donationId },
    data: {
      status: "SUCCESS"
    }
  })

  return res.status(200).json(
    new apiResponse(200, "Donation verified successfully", updatedDonation)
  )

})

const getTopDonors = asyncHandler(async (req, res) => {

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

  return res.status(200).json(
    new apiResponse(200, "Top donors fetched successfully", donors)
  )

})


export { createDonation,
        getEventDonations,
        getFinanceSummary, 
        createExpense, 
        getEventExpenses, 
        getEventDonationQR, 
        verifyDonation, 
        getTopDonors 
    }
