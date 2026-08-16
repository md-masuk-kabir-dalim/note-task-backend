export const USER_PUBLIC_FIELDS =
  "name email role interests phoneNo image isVerified status createdAt updatedAt";

export const USER_SENSITIVE_FIELDS = ["password", "tokenVersion"] as const;
