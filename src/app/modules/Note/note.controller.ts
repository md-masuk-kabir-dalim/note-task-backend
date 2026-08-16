import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { NoteService } from "./note.service";

const actorFrom = (req: Request) => ({
  id: req.user.id,
  role: req.user.role,
});

const createNote = catchAsync(async (req: Request, res: Response) => {
  const note = await NoteService.createNote(actorFrom(req), {
    title: req.body.title,
    content: req.body.content,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Note created successfully",
    data: note,
  });
});

const listNotes = catchAsync(async (req: Request, res: Response) => {
  const result = await NoteService.listNotes(actorFrom(req), {
    page: Number(req.query.page) || undefined,
    limit: Number(req.query.limit) || undefined,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notes retrieved successfully",
    data: result.data,
    pagination: result.pagination,
  });
});

const getNoteById = catchAsync(async (req: Request, res: Response) => {
  const note = await NoteService.getNoteById(actorFrom(req), req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Note retrieved successfully",
    data: note,
  });
});

const updateNote = catchAsync(async (req: Request, res: Response) => {
  const note = await NoteService.updateNote(actorFrom(req), req.params.id, {
    title: req.body.title,
    content: req.body.content,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Note updated successfully",
    data: note,
  });
});

const deleteNote = catchAsync(async (req: Request, res: Response) => {
  await NoteService.deleteNote(actorFrom(req), req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Note deleted successfully",
    data: null,
  });
});

export const NoteController = {
  createNote,
  listNotes,
  getNoteById,
  updateNote,
  deleteNote,
};
