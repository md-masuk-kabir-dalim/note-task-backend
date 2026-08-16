import { Schema, model } from "mongoose";
import { IPost } from "./post.interface";

const postSchema = new Schema<IPost>(
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


postSchema.index({ userId: 1 });

export const PostModel = model<IPost>("Post", postSchema);
