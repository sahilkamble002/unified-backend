import express from "express";
import { registerUser, searchUsers } from "./user.controller.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { verifyJWT } from "../../middlerware/auth.middleware.js";

const router = express.Router();

router.post("/register", asyncHandler(registerUser));
router.get("/search", verifyJWT, searchUsers);

export default router;
