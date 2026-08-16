import httpStatus from "http-status";
import { UserModel } from "../User/user.model";
import { PostModel } from "./post.model";
import ApiError from "../../../errors/ApiErrors";
import { toObjectId } from "../../../utils/objectId";
const createPost = async (
  userId: string,
  payload: { title: string; content: string }
) => {
  return PostModel.create({
    title: payload.title,
    content: payload.content,
    userId: toObjectId(userId),
  });
};

const getUserPostsByLookup = async (userId: string) => {
  const objectId = toObjectId(userId);

  const result = await UserModel.aggregate([
    { $match: { _id: objectId } },
    {
      $lookup: {
        from: "posts",
        localField: "_id",
        foreignField: "userId",
        as: "posts",
      },
    },
    {
      $project: {
        password: 0,
        tokenVersion: 0,
      },
    },
  ]);

  if (!result.length) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  return result[0];
};

export const PostService = {
  createPost,
  getUserPostsByLookup,
};
