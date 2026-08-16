import express from "express";
import { AuthRoutes } from "../modules/Auth/auth.routes";
import { UserRoutes } from "../modules/User/user.routes";
import { NoteRoutes } from "../modules/Note/note.routes";
import { PostRoutes } from "../modules/Post/post.routes";
import { AdminRoutes } from "../modules/Admin/admin.routes";

const router = express.Router();

const moduleRoutes = [
  { path: "/auth", route: AuthRoutes },
  { path: "/user", route: UserRoutes },
  { path: "/notes", route: NoteRoutes },
  { path: "/posts", route: PostRoutes },
  { path: "/admin", route: AdminRoutes },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
