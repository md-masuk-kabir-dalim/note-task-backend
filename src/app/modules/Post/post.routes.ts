import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { PostController } from "./post.controller";
import { PostValidation } from "./post.validation";
import { UserRole } from "../User/user.model";

const router = express.Router();

router.post(
  "/",
  auth(UserRole.USER, UserRole.ADMIN),
  validateRequest(PostValidation.create),
  PostController.createPost
);

router.get(
  "/user/:userId",
  validateRequest(PostValidation.userIdParam, "params"),
  PostController.getUserPosts
);

export const PostRoutes = router;
