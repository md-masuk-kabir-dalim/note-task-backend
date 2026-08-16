import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { UserService } from "./user.service";
import { UserRole, UserStatus } from "./user.model";

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const updatedUser = await UserService.updateUser(req.user.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User updated successfully",
    data: updatedUser,
  });
});

const getUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getUsers(
    {
      page: Number(req.query.page) || undefined,
      limit: Number(req.query.limit) || undefined,
    },
    {
      role: req.query.role as UserRole | undefined,
      status: req.query.status as UserStatus | undefined,
      searchTerm: req.query.searchTerm as string | undefined,
    }
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users fetched successfully",
    data: result.data,
    pagination: result.pagination,
    meta: result.meta,
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getUserById(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User fetched successfully",
    data: result,
  });
});

const createUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.createUser(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "User created successfully",
    data: result,
  });
});

const adminUpdateUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.adminUpdateUser(req.params.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User updated successfully",
    data: result,
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  await UserService.deleteUser(req.params.id, req.user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User account deleted successfully",
    data: null,
  });
});

const groupUsersByInterests = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.groupUsersByInterests();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users grouped by interests",
    data: result,
  });
});

export const UserController = {
  updateUser,
  getUsers,
  getUserById,
  createUser,
  adminUpdateUser,
  deleteUser,
  groupUsersByInterests,
};
