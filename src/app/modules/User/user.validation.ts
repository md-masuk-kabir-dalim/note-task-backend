import { z } from "zod";
import {
  emailSchema,
  interestsSchema,
  nameSchema,
  objectIdSchema,
  paginationQuerySchema,
  passwordSchema,
  roleSchema,
} from "../shared/validation";

export const UserValidation = {
  updateSelf: z.object({
    name: nameSchema.optional(),
    interests: interestsSchema.optional(),
    phoneNo: z.string().trim().max(30).optional(),
    image: z.string().optional(),
  }),
  idParam: z.object({
    id: objectIdSchema,
  }),
};

export const AdminUserValidation = {
  create: z.object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    role: roleSchema.optional(),
    interests: interestsSchema.optional(),
  }),
  update: z.object({
    name: nameSchema.optional(),
    email: emailSchema.optional(),
    password: passwordSchema.optional(),
    role: roleSchema.optional(),
    interests: interestsSchema.optional(),
  }),
  idParam: z.object({
    id: objectIdSchema,
  }),
  listQuery: paginationQuerySchema,
};
