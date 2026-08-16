import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";
import { rateLimiter } from "../../middlewares/rate_limiter";

const router = express.Router();

router.post("/admin/login", rateLimiter(10), AuthController.loginAdmin);

router.post(
  "/register",
  rateLimiter(10),
  validateRequest(AuthValidation.register),
  AuthController.registerUser
);

router.post(
  "/login",
  rateLimiter(10),
  validateRequest(AuthValidation.login),
  AuthController.loginUser
);

router.post("/forgot-password", rateLimiter(10), AuthController.forgetPassword);

router.patch(
  "/reset-password",
  auth(),
  rateLimiter(10),
  AuthController.resetPassword
);

router.patch(
  "/verify-otp",
  auth(),
  rateLimiter(10),
  AuthController.verifyUserByOTP
);

router.post("/refresh-token", AuthController.refreshToken);

router.get("/me", auth(), AuthController.getMyProfile);

router.patch(
  "/change-password",
  rateLimiter(10),
  auth(),
  AuthController.changePassword
);

router.post("/send-otp", rateLimiter(10), AuthController.otpSend);

router.post("/logout", auth(), rateLimiter(10), AuthController.logout);

export const AuthRoutes = router;
