import { CustomError, type ErrorMessage } from './customError';

export class InternalServerError extends CustomError {
  statusCode = 500;

  constructor(message?: string, status?: number) {
    super(message || 'Something went wrong');
    this.statusCode = status || this.statusCode;
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }

  serializeError(): Array<ErrorMessage> {
    return [{ message: this.message }];
  }
}
