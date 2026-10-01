import { GraphQLError } from "graphql";
import { AppError } from "./app-error";

export function mapToGraphQLError(originalError: unknown): GraphQLError {
  const unwrapped =
    originalError instanceof GraphQLError && originalError.originalError
      ? originalError.originalError
      : originalError;

  if (unwrapped instanceof AppError) {
    return new GraphQLError(unwrapped.message, {
      extensions: {
        code: unwrapped.code,
        httpStatus: unwrapped.httpStatus,
        isOperational: unwrapped.isOperational,
        metadata: unwrapped.metadata,
      },
    });
  }

  // Fallback for unexpected errors
  return new GraphQLError("Internal Server Error", {
    extensions: {
      code: "INTERNAL_SERVER_ERROR",
      httpStatus: 500,
      isOperational: false,
    },
  });
}
