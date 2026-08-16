import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { NoteController } from "./note.controller";
import { NoteValidation } from "./note.validation";
import { UserRole } from "../User/user.model";

const router = express.Router();

router.post(
  "/",
  auth(UserRole.USER, UserRole.ADMIN),
  validateRequest(NoteValidation.create),
  NoteController.createNote
);

router.get(
  "/",
  auth(UserRole.USER, UserRole.ADMIN),
  validateRequest(NoteValidation.listQuery, "query"),
  NoteController.listNotes
);

router.get(
  "/:id",
  auth(UserRole.USER, UserRole.ADMIN),
  validateRequest(NoteValidation.idParam, "params"),
  NoteController.getNoteById
);

router.patch(
  "/:id",
  auth(UserRole.USER, UserRole.ADMIN),
  validateRequest(NoteValidation.idParam, "params"),
  validateRequest(NoteValidation.update),
  NoteController.updateNote
);

router.delete(
  "/:id",
  auth(UserRole.USER, UserRole.ADMIN),
  validateRequest(NoteValidation.idParam, "params"),
  NoteController.deleteNote
);

export const NoteRoutes = router;
