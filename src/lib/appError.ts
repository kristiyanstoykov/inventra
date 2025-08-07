export class AppError extends Error {
  public code: string;
  public context?: unknown;

  constructor(message: string, code: string = 'UNKNOWN', context?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
    };
  }

  toString() {
    return `${this.message} (Code: ${this.code})`;
  }
}
