import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import { NoteModel } from "./note.model";
import { UserRole } from "../User/user.model";
import { paginationHelpers } from "../../../utils/paginationHelper";
import { assertValidObjectId, toObjectId } from "../../../utils/objectId";

type Actor = {
  id: string;
  role: string;
};

const ownerFilter = (actor: Actor, noteId?: string): Record<string, unknown> => {
  const filter: Record<string, unknown> = {};

  if (noteId) {
    filter._id = toObjectId(noteId);
  }

  if (actor.role !== UserRole.ADMIN) {
    filter.userId = toObjectId(actor.id);
  }

  return filter;
};

const throwIfUnauthorizedOrMissing = async (actor: Actor, noteId: string) => {
  const exists = await NoteModel.exists({ _id: toObjectId(noteId) });
  if (exists && actor.role !== UserRole.ADMIN) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You are not authorized to access this note"
    );
  }

  throw new ApiError(httpStatus.NOT_FOUND, "Note not found");
};

const createNote = async (
  actor: Actor,
  payload: { title: string; content: string }
) => {
  return NoteModel.create({
    title: payload.title,
    content: payload.content,
    userId: toObjectId(actor.id),
  });
};

const listNotes = async (
  actor: Actor,
  query: { page?: number; limit?: number }
) => {
  const { page, limit, skip } = paginationHelpers.calculatePagination(query);
  const filter = { userId: toObjectId(actor.id) };

  const [data, total] = await Promise.all([
    NoteModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    NoteModel.countDocuments(filter),
  ]);

  return {
    data,
    pagination: paginationHelpers.buildPagination(page, limit, total),
  };
};

const getNoteById = async (actor: Actor, noteId: string) => {
  assertValidObjectId(noteId, "note ID");
  const note = await NoteModel.findOne(ownerFilter(actor, noteId));

  if (!note) {
    await throwIfUnauthorizedOrMissing(actor, noteId);
  }

  return note;
};

const updateNote = async (
  actor: Actor,
  noteId: string,
  payload: { title?: string; content?: string }
) => {
  assertValidObjectId(noteId, "note ID");

  const note = await NoteModel.findOneAndUpdate(
    ownerFilter(actor, noteId),
    {
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.content !== undefined ? { content: payload.content } : {}),
    },
    { new: true }
  );

  if (!note) {
    await throwIfUnauthorizedOrMissing(actor, noteId);
  }

  return note;
};

const deleteNote = async (actor: Actor, noteId: string) => {
  assertValidObjectId(noteId, "note ID");
  const note = await NoteModel.findOneAndDelete(ownerFilter(actor, noteId));

  if (!note) {
    await throwIfUnauthorizedOrMissing(actor, noteId);
  }

  return note;
};

const listAllNotes = async (query: { page?: number; limit?: number }) => {
  const { page, limit, skip } = paginationHelpers.calculatePagination(query);

  const [data, total] = await Promise.all([
    NoteModel.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name email role")
      .lean(),
    NoteModel.countDocuments({}),
  ]);

  return {
    data,
    pagination: paginationHelpers.buildPagination(page, limit, total),
  };
};

export const NoteService = {
  createNote,
  listNotes,
  getNoteById,
  updateNote,
  deleteNote,
  listAllNotes,
};
