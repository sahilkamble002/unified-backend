import prisma from "../../config/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { apiError } from "../../utils/apiError.js";
import { apiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { generateAccessToken, generateRefreshToken } from "../../utils/token.js";

const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new apiError(400, "Username and password are required");
  }

  const user = await prisma.user.findUnique({
    where: { username }
  });

  if (!user) {
    throw new apiError(401, "Invalid username or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new apiError(401, "Invalid username or password");
  }

  // Generate tokens
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  // Store refresh token in DB
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken }
  });

  return res.status(200).json(
    new apiResponse(200, "Login successful", {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email
      }
    })
  );
});


const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new apiError(401, "Refresh token required");
  }

  // verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    throw new apiError(401, "Invalid refresh token");
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId }
  });

  if (!user || user.refreshToken !== refreshToken) {
    throw new apiError(401, "Refresh token expired or invalid");
  }

  // generate new access token
  const newAccessToken = generateAccessToken(user.id);

  return res.status(200).json(
    new apiResponse(200, "Access token refreshed", {
      accessToken: newAccessToken
    })
  );
});


const logoutUser = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new apiError(400, "Refresh token required");
  }

  await prisma.user.updateMany({
    where: { refreshToken },
    data: { refreshToken: null }
  });

  return res.status(200).json(
    new apiResponse(200, "Logout successful")
  );
});

export { loginUser, refreshAccessToken, logoutUser };