export class AppError extends Error {
  constructor(
    message: string,
    public statusCode = 500,
    public code = "INTERNAL_SERVER_ERROR",
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}
