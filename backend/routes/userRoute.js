import express from "express";
import { registerUser, resendOtp, verifyUser } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser)

userRouter.post("/verify/:id", verifyUser)

userRouter.get("/resend/:id", resendOtp);

export default userRouter