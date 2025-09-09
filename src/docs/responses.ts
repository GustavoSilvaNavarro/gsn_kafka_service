import { generateErrorSchema } from './schemas';

export const unexpectedError = {
  description: 'Unexpected',
  content: {
    'application/json': {
      schema: { ...generateErrorSchema() },
    },
  },
};

export const badRequestError = {
  description: 'Bad Request',
  content: {
    'application/json': {
      schema: generateErrorSchema(400),
    },
  },
};
