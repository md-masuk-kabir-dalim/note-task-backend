import { USER_SENSITIVE_FIELDS } from "../app/modules/User/user.constants";

type PlainRecord = Record<string, unknown>;

const toPlain = (value: unknown): PlainRecord => {
  if (value && typeof value === "object" && "toObject" in value) {
    return (value as { toObject: () => PlainRecord }).toObject();
  }

  return { ...(value as PlainRecord) };
};

export const sanitizeUser = <T>(user: T): Omit<T, "password" | "tokenVersion"> => {
  const plain = toPlain(user);

  for (const field of USER_SENSITIVE_FIELDS) {
    delete plain[field];
  }

  return plain as Omit<T, "password" | "tokenVersion">;
};
