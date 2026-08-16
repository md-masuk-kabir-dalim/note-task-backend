import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { PostService } from "./post.service";

const createPost = catchAsync(async (req: Request, res: Response) => {
  const post = await PostService.createPost(req.user.id, {
    title: req.body.title,
    content: req.body.content,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Post created successfully",
    data: post,
  });
});

const getUserPosts = catchAsync(async (req: Request, res: Response) => {
  const result = await PostService.getUserPostsByLookup(req.params.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User posts retrieved successfully",
    data: result,
  });
});

export const PostController = {
  createPost,
  getUserPosts,
};
