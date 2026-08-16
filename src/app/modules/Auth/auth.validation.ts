import { z } from "zod";
import {
  emailSchema,
  interestsSchema,
  nameSchema,
  passwordSchema,
} from "../shared/validation";

const registerBody = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  interests: interestsSchema.optional(),
  role: z.string().optional(),
});

const loginBody = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const AuthValidation = {
  register: registerBody,
  login: loginBody,
};
