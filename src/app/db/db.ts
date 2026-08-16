import config from "../../config";
import { hashPassword } from "../../utils/passwordHelpers";
import { UserModel, UserRole } from "../modules/User/user.model";

export const initiateSuperAdmin = async () => {
  const payload = {
    name: "Super Admin",
    fullName: "Super Admin",
    email: config.password.admin_email,
    phoneNo: "+1234567890",
    password: config.password.superadmin_password,
    role: UserRole.ADMIN,
    interests: ["administration", "security"],
    isVerified: true,
  };

  const existingSuperAdmin = await UserModel.findOne({ email: payload.email });
  if (existingSuperAdmin) return;
  if (!payload.password) return;

  await UserModel.create({
    ...payload,
    password: await hashPassword(payload.password),
  });

  console.log("Super Admin initialized successfully");
};
