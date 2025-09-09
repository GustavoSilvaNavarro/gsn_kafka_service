import { CustomError, type ErrorMessage } from './customError';

export class NotFoundError extends CustomError {
  statusCode = 404;

  constructor(message?: string) {
    super(message || 'Not found');
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }

  serializeError(): Array<ErrorMessage> {
    return [{ message: this.message }];
  }
}
