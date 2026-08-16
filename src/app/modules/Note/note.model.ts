import { Schema, model } from "mongoose";
import { INote } from "./note.interface";

const noteSchema = new Schema<INote>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

noteSchema.index({ userId: 1, createdAt: -1 });
noteSchema.index({ createdAt: -1 });

export const NoteModel = model<INote>("Note", noteSchema);
