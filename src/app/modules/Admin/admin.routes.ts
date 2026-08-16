import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { AdminController } from "./admin.controller";
import { AdminUserValidation } from "../User/user.validation";
import { NoteValidation } from "../Note/note.validation";
import { UserRole } from "../User/user.model";

const router = express.Router();
const adminOnly = auth(UserRole.ADMIN);

router.get(
  "/users",
  adminOnly,
  validateRequest(AdminUserValidation.listQuery, "query"),
  AdminController.getUsers
);

router.post(
  "/users",
  adminOnly,
  validateRequest(AdminUserValidation.create),
  AdminController.createUser
);

router.get(
  "/users/grouped-by-interests",
  adminOnly,
  AdminController.groupUsersByInterests
);

router.get(
  "/users/:id",
  adminOnly,
  validateRequest(AdminUserValidation.idParam, "params"),
  AdminController.getUserById
);

router.patch(
  "/users/:id",
  adminOnly,
  validateRequest(AdminUserValidation.idParam, "params"),
  validateRequest(AdminUserValidation.update),
  AdminController.updateUser
);

router.delete(
  "/users/:id",
  adminOnly,
  validateRequest(AdminUserValidation.idParam, "params"),
  AdminController.deleteUser
);

router.get(
  "/notes",
  adminOnly,
  validateRequest(NoteValidation.listQuery, "query"),
  AdminController.listAllNotes
);

export const AdminRoutes = router;
