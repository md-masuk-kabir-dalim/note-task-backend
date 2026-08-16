import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";

type RequestPart = "body" | "query" | "params";

const validateRequest =
  (schema: ZodTypeAny, part: RequestPart | "all" = "body") =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (part === "all") {
        await schema.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
        });
      } else if (part === "body") {
        req.body = await schema.parseAsync(req.body);
      } else {
        await schema.parseAsync(req[part]);
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };

export default validateRequest;
