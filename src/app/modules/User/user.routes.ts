import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { UserController } from "./user.controller";
import { UserRole } from "./user.model";
import { UserValidation } from "./user.validation";

const router = express.Router();

router.patch(
  "/update-user",
  auth(UserRole.USER, UserRole.ADMIN),
  validateRequest(UserValidation.updateSelf),
  UserController.updateUser
);

router.get("/:id", auth(), validateRequest(UserValidation.idParam, "params"), UserController.getUserById);

export const UserRoutes = router;
