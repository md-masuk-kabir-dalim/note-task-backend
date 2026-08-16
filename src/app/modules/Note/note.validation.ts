import { z } from "zod";
import { objectIdSchema, paginationQuerySchema } from "../shared/validation";

export const NoteValidation = {
  create: z.object({
    title: z.string().trim().min(1, "Title is required").max(200),
    content: z.string().trim().min(1, "Content is required").max(20000),
    userId: z.string().optional(),
    ownerId: z.string().optional(),
  }),
  update: z.object({
    title: z.string().trim().min(1).max(200).optional(),
    content: z.string().trim().min(1).max(20000).optional(),
    userId: z.string().optional(),
    ownerId: z.string().optional(),
  }),
  idParam: z.object({
    id: objectIdSchema,
  }),
  listQuery: paginationQuerySchema,
};
