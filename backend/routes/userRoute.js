import express from "express";
import { registerUser, verifyUser } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser)

userRouter.post("/verify/:id", verifyUser)

export default userRouter