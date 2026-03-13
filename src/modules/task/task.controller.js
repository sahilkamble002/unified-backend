import prisma from "../../config/prisma.js"
import { apiError } from "../../utils/apiError.js"
import { apiResponse } from "../../utils/apiResponse.js"
import { asyncHandler } from "../../utils/asyncHandler.js"

const createTask = asyncHandler(async (req, res) => {

    const { eventId } = req.params
    const { title, description } = req.body

    if (!title) {
        throw new apiError(400, "Task title is required")
    }

    const userId = req.user.id

    const task = await prisma.task.create({
        data: {
            eventId,
            title,
            description,
            createdBy: userId
        }
    })

    return res.status(201).json(
        new apiResponse(201, "Task created successfully", task)
    )
})

const getEventTasks = asyncHandler(async (req, res) => {

    const { eventId } = req.params
    const userId = req.user.id

    const canViewAllTasks = ["SUPER_ADMIN", "ADMIN", "FINANCE"].includes(
        req.eventRole
    )

    const tasks = await prisma.task.findMany({
        where: {
            eventId,
            ...(canViewAllTasks
                ? {}
                : {
                    assignments: {
                        some: { userId }
                    }
                })
        },
        orderBy: {
            createdAt: "desc"
        }
    })

    return res.status(200).json(
        new apiResponse(200, "Tasks fetched successfully", tasks)
    )
})

const assignTask = asyncHandler(async (req, res) => {

  const { taskId } = req.params;
  const { username } = req.body;

  if (!username) {
    throw new apiError(400, "Username is required");
  }

  const normalizedUsername = username.trim().toLowerCase();

  // 1️⃣ find user
  const user = await prisma.user.findUnique({
    where: { username: normalizedUsername }
  });

  if (!user) {
    throw new apiError(404, "User not found");
  }

  // 2️⃣ find task + eventId
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      eventId: true
    }
  });

  if (!task) {
    throw new apiError(404, "Task not found");
  }

  // 3️⃣ check event membership
  const membership = await prisma.eventMember.findUnique({
    where: {
      eventId_userId: {
        eventId: task.eventId,
        userId: user.id
      }
    }
  });

  if (!membership) {
    throw new apiError(403, "User is not a member of this event");
  }

  // 4️⃣ prevent duplicate assignment
  const existing = await prisma.taskAssignment.findUnique({
    where: {
      taskId_userId: {
        taskId: task.id,
        userId: user.id
      }
    }
  });

  if (existing) {
    throw new apiError(400, "User already assigned to this task");
  }

  // 5️⃣ create assignment
  const assignment = await prisma.taskAssignment.create({
    data: {
      taskId: task.id,
      userId: user.id
    }
  });

  return res.status(201).json(
    new apiResponse(201, "Task assigned successfully", assignment)
  );

});

const updateTaskProgress = asyncHandler(async (req, res) => {

    const { taskId } = req.params
    const { progress } = req.body

    const userId = req.user.id

    if (progress === undefined) {
        throw new apiError(400, "Progress value required")
    }

    const assignment = await prisma.taskAssignment.findUnique({
        where: {
            taskId_userId: {
                taskId,
                userId
            }
        }
    })

    if (!assignment) {
        throw new apiError(403, "You are not assigned to this task")
    }

    const updatedAssignment = await prisma.taskAssignment.update({
        where: {
            taskId_userId: {
                taskId,
                userId
            }
        },
        data: {
            progress
        }
    })

    return res.status(200).json(
        new apiResponse(200, "Task progress updated", updatedAssignment)
    )
})

const updateTaskStatus = asyncHandler(async (req, res) => {

    const { taskId } = req.params
    const { status } = req.body
    const userId = req.user.id

    if (!status) {
        throw new apiError(400, "Status is required")
    }

    const assignment = await prisma.taskAssignment.findUnique({
        where: {
            taskId_userId: {
                taskId,
                userId
            }
        }
    })

    if (!assignment) {
        throw new apiError(403, "You are not assigned to this task")
    }

    const task = await prisma.task.findUnique({
        where: { id: taskId }
    })

    if (!task) {
        throw new apiError(404, "Task not found")
    }

    const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: { status }
    })

    return res.status(200).json(
        new apiResponse(200, "Task status updated", updatedTask)
    )
})

const getTaskDetails = asyncHandler(async (req, res) => {

    const { taskId } = req.params

    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
            assignments: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            }
        }
    })

    if (!task) {
        throw new apiError(404, "Task not found")
    }

    return res.status(200).json(
        new apiResponse(200, "Task details fetched", task)
    )
})

const deleteTask = asyncHandler(async (req, res) => {

    const { taskId } = req.params
    const userId = req.user.id

    const task = await prisma.task.findUnique({
        where: { id: taskId }
    })

    if (!task) {
        throw new apiError(404, "Task not found")
    }

    const membership = await prisma.eventMember.findUnique({
        where: {
            eventId_userId: {
                eventId: task.eventId,
                userId
            }
        }
    })

    if (!membership) {
        throw new apiError(403, "You are not part of this event")
    }

    if (!["SUPER_ADMIN","ADMIN","MANAGER"].includes(membership.role)) {
        throw new apiError(403, "You do not have permission to delete tasks")
    }

    await prisma.taskAssignment.deleteMany({
        where: { taskId }
    })

    await prisma.task.delete({
        where: { id: taskId }
    })

    return res.status(200).json(
        new apiResponse(200, "Task deleted successfully")
    )
})

export { createTask, getEventTasks, assignTask, updateTaskProgress, updateTaskStatus, getTaskDetails, deleteTask }
