import jwt from "jsonwebtoken";
import {
  accessTokenExpiry,
  accessTokenSecret,
  refreshTokenExpiry,
  refreshTokenSecret
} from "../config/auth.js";

export const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    accessTokenSecret,
    { expiresIn: accessTokenExpiry }
  );
};

export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    refreshTokenSecret,
    { expiresIn: refreshTokenExpiry }
  );
};
