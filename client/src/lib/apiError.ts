export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }

  isUnauthorized() {
    return this.status === 401;
  }

  isForbidden() {
    return this.status === 403;
  }

  isNotFound() {
    return this.status === 404;
  }

  isConflict() {
    return this.status === 409;
  }

  isValidation() {
    return this.status === 422;
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;