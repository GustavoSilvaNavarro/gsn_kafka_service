import { CustomError, type ErrorMessage } from './customError';

export class BadRequestError extends CustomError {
  statusCode = 400;

  constructor(message?: string) {
    super(message || 'Bad request');
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }

  serializeError(): Array<ErrorMessage> {
    return [{ message: this.message }];
  }
}
