import { Document, Types } from "mongoose";

export interface IPost extends Document {
  title: string;
  content: string;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
