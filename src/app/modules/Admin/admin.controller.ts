import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { UserController } from "../User/user.controller";
import { NoteService } from "../Note/note.service";

const listAllNotes = catchAsync(async (req: Request, res: Response) => {
  const result = await NoteService.listAllNotes({
    page: Number(req.query.page) || undefined,
    limit: Number(req.query.limit) || undefined,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All notes retrieved successfully",
    data: result.data,
    pagination: result.pagination,
  });
});

export const AdminController = {
  getUsers: UserController.getUsers,
  createUser: UserController.createUser,
  getUserById: UserController.getUserById,
  updateUser: UserController.adminUpdateUser,
  deleteUser: UserController.deleteUser,
  groupUsersByInterests: UserController.groupUsersByInterests,
  listAllNotes,
};
