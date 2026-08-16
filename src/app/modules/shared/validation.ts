import { z } from "zod";

export const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid ID");

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const interestSchema = z
  .string()
  .trim()
  .min(1, "Interest cannot be empty")
  .max(50, "Interest is too long");

export const interestsSchema = z.array(interestSchema).max(20).default([]);

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");

export const emailSchema = z.string().trim().toLowerCase().email("Invalid email");

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(80, "Name is too long");

export const roleSchema = z.enum(["USER", "ADMIN"]);
