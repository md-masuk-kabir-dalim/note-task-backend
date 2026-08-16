import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import { IPaginationOptions } from "../../../interfaces/pagination";
import { IUser } from "./user.interface";
import { UserModel, UserRole, UserStatus } from "./user.model";
import { searchPaginate } from "../../../helpers/searchAndPaginate";
import { USER_PUBLIC_FIELDS } from "./user.constants";
import { hashPassword } from "../../../utils/passwordHelpers";
import { NoteModel } from "../Note/note.model";
import { PostModel } from "../Post/post.model";
import { toObjectId } from "../../../utils/objectId";
import { sanitizeUser } from "../../../utils/userSanitizer";

const updateUser = async (id: string, payload: Partial<IUser>) => {
  const updatedUser = await UserModel.findByIdAndUpdate(
    id,
    {
      ...(payload.name && { name: payload.name, fullName: payload.name }),
      ...(payload.interests && { interests: payload.interests }),
      ...(payload.phoneNo && { phoneNo: payload.phoneNo }),
      ...(payload.image && { image: payload.image }),
    },
    { new: true }
  ).select(USER_PUBLIC_FIELDS);

  if (!updatedUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  return updatedUser;
};

const getUsers = async (
  options: IPaginationOptions,
  filters: { role?: UserRole; status?: UserStatus; searchTerm?: string }
) => {
  const { page = 1, limit = 10 } = options;
  const { role, status, searchTerm } = filters;
  const appliedFilters: Record<string, unknown> = {};

  if (role) appliedFilters.role = role;
  if (status) appliedFilters.status = status;

  return searchPaginate<IUser>({
    model: UserModel,
    search: searchTerm || "",
    searchFields: ["name", "email"],
    filters: appliedFilters,
    page,
    limit,
    sortBy: "createdAt",
    sortOrder: "desc",
    select: USER_PUBLIC_FIELDS,
  });
};

const getUserById = async (id: string) => {
  const user = await UserModel.findById(id).select(USER_PUBLIC_FIELDS);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  return user;
};

const createUser = async (payload: {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  interests?: string[];
}) => {
  const existing = await UserModel.findOne({ email: payload.email });
  if (existing) {
    throw new ApiError(httpStatus.CONFLICT, "Email already in use");
  }

  const user = await UserModel.create({
    name: payload.name,
    fullName: payload.name,
    email: payload.email,
    password: await hashPassword(payload.password),
    role: payload.role || UserRole.USER,
    interests: payload.interests || [],
    isVerified: true,
  });

  return sanitizeUser(user);
};

const adminUpdateUser = async (
  id: string,
  payload: {
    name?: string;
    email?: string;
    password?: string;
    role?: UserRole;
    interests?: string[];
  }
) => {
  if (payload.email) {
    const duplicate = await UserModel.findOne({
      email: payload.email,
      _id: { $ne: toObjectId(id) },
    });
    if (duplicate) {
      throw new ApiError(httpStatus.CONFLICT, "Email already in use");
    }
  }

  const update: Record<string, unknown> = {};
  if (payload.name) {
    update.name = payload.name;
    update.fullName = payload.name;
  }
  if (payload.email) update.email = payload.email;
  if (payload.role) update.role = payload.role;
  if (payload.interests) update.interests = payload.interests;
  if (payload.password) update.password = await hashPassword(payload.password);

  const updatedUser = await UserModel.findByIdAndUpdate(id, update, {
    new: true,
  }).select(USER_PUBLIC_FIELDS);

  if (!updatedUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  return updatedUser;
};

const deleteUser = async (userId: string, actorId: string) => {
  if (userId === actorId) {
    throw new ApiError(httpStatus.FORBIDDEN, "You cannot delete your own account");
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  await Promise.all([
    NoteModel.deleteMany({ userId: user._id }),
    PostModel.deleteMany({ userId: user._id }),
    UserModel.deleteOne({ _id: user._id }),
  ]);
};

const groupUsersByInterests = async () => {
  return UserModel.aggregate([
    { $unwind: "$interests" },
    {
      $group: {
        _id: "$interests",
        users: {
          $push: {
            _id: "$_id",
            name: "$name",
            email: "$email",
            role: "$role",
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        interest: "$_id",
        users: 1,
      },
    },
    { $sort: { interest: 1 } },
  ]);
};

export const UserService = {
  updateUser,
  getUsers,
  getUserById,
  createUser,
  adminUpdateUser,
  deleteUser,
  groupUsersByInterests,
};
