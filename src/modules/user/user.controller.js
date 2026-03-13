import prisma from "../../config/prisma.js";
import bcrypt from "bcrypt";
import { apiError } from "../../utils/apiError.js";
import { apiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
  const { name, username,email, password, phone } = req.body;

  // 1️⃣ Basic validation
  if (!name || !username || !email || !password || !phone) {
    throw new apiError(400, "All fields are required");
  }

  if (password.length < 6) {
    throw new apiError(400, "Password must be at least 6 characters long");
  }

  const normalizedName = name.trim();
  const normalizedUsername = username.trim().toLowerCase();
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedPhone = phone.trim();

  // 2️⃣ Hash password first (no DB call yet)
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // 3️⃣ Create user directly (let DB handle uniqueness)
    const user = await prisma.user.create({
      data: {
        name: normalizedName,
        username: normalizedUsername,
        email: normalizedEmail,
        passwordHash: hashedPassword,
        phone: normalizedPhone,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });

    return res
      .status(201)
      .json(new apiResponse(201, "User registered successfully", user));

  } catch (error) {
    // 4️⃣ Handle unique constraint safely
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(", ")
        : error.meta?.target;
      if (target) {
        throw new apiError(400, `${target} already registered`);
      }
      throw new apiError(400, "username or phone already registered");
    }

    throw new apiError(500, "User registration failed");
  }
});

const searchUsers = asyncHandler(async (req, res) => {
  const query = String(req.query.q || "").trim();

  if (!query) {
    throw new apiError(400, "Search query is required");
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { username: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } }
      ]
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true
    },
    take: 10,
    orderBy: {
      name: "asc"
    }
  });

  return res
    .status(200)
    .json(new apiResponse(200, "Users fetched successfully", users));
});

export { registerUser, searchUsers };
