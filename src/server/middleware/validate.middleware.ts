import { Request, Response, NextFunction } from "express";
import { z } from "zod";

/**
 * Validation middleware factory
 * Creates a middleware that validates request body against a Zod schema
 */
export const validate = (schema: z.ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Parse and validate request body 
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // Format Zod errors for response
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    // Replace body with validated data (includes transformations)
    req.body = result.data;

    return next();
  };
};
export const validateRefreshToken = (schema: z.ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Parse and validate request body 
    const result = schema.safeParse(req.cookies);

    if (!result.success) {
      // Format Zod errors for response
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    // Replace body with validated data (includes transformations)
    req.body = result.data;

    return next();
  };
};
