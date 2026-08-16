import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const generateToken = (
  payload: Record<string, unknown>,
  secret: Secret,
  expiresIn: string
): string => {
  const jwtId = uuidv4();

  return jwt.sign(payload, secret, {
    algorithm: "HS256",
    expiresIn,
    jwtid: jwtId,
  } as SignOptions);
};

const verifyToken = (token: string, secret: Secret): JwtPayload => {
  return jwt.verify(token, secret) as JwtPayload;
};

export const jwtHelpers = {
  generateToken,
  verifyToken,
};
