import prisma from "../../config/prisma.js"
import { apiError } from "../../utils/apiError.js"
import { apiResponse } from "../../utils/apiResponse.js"
import { asyncHandler } from "../../utils/asyncHandler.js"


const getEventAnalyticsOverview = asyncHandler(async (req, res) => {

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

  const totalExpenses = await prisma.expense.aggregate({
    where: { eventId },
    _sum: {
      amount: true
    }
  })

  const donations = totalDonations._sum.amount || 0
  const expenses = totalExpenses._sum.amount || 0
  const balance = donations - expenses

  return res.status(200).json(
    new apiResponse(200, "Analytics overview fetched", {
      totalDonations: donations,
      totalExpenses: expenses,
      balance
    })
  )

})


const getDonationTrend = asyncHandler(async (req, res) => {

  const { eventId } = req.params

  const trend = await prisma.donation.groupBy({
    by: ["createdAt"],
    where: {
      eventId,
      status: "SUCCESS"
    },
    _sum: {
      amount: true
    }
  })

  const formatted = trend.map((t) => ({
    date: t.createdAt,
    total: t._sum.amount
  }))

  return res.status(200).json(
    new apiResponse(200, "Donation trend fetched", formatted)
  )

})

const getExpenseBreakdown = asyncHandler(async (req, res) => {

  const { eventId } = req.params

  const breakdown = await prisma.expense.groupBy({
    by: ["category"],
    where: {
      eventId
    },
    _sum: {
      amount: true
    },
    orderBy: {
      _sum: {
        amount: "desc"
      }
    }
  })

  const formatted = breakdown.map((item) => ({
    category: item.category,
    total: item._sum.amount
  }))

  return res.status(200).json(
    new apiResponse(200, "Expense breakdown fetched", formatted)
  )

})

const getTopDonorsAnalytics = asyncHandler(async (req, res) => {

  const { eventId } = req.params

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

  const formatted = donors.map(d => ({
    donorName: d.donorName,
    totalDonated: d._sum.amount
  }))

  return res.status(200).json(
    new apiResponse(200, "Top donors analytics fetched", formatted)
  )

})

export {
  getEventAnalyticsOverview,
  getDonationTrend,
  getExpenseBreakdown,
  getTopDonorsAnalytics
}
