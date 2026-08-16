import * as bcrypt from "bcrypt";
import config from "../config";

export const hashPassword = async (password: string): Promise<string> => {
  const configuredSalt = Number(config.password.password_salt || 12);
  const saltRounds =
    config.env === "test" ? 4 : Math.max(configuredSalt, 10);
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const validatePasswordComplexity = (password: string): boolean => {
  if (!password || password.length < 8) return false;
  const complexity = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
  return complexity.test(password);
};
