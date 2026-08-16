import { z } from "zod";
import { objectIdSchema } from "../shared/validation";

export const PostValidation = {
  create: z.object({
    title: z.string().trim().min(1, "Title is required").max(200),
    content: z.string().trim().min(1, "Content is required").max(20000),
  }),
  userIdParam: z.object({
    userId: objectIdSchema,
  }),
};
