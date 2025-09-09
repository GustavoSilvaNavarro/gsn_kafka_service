// NOTE: Common schemas for error to improve re-usability
export const generateErrorSchema = (statusCode = 500) => {
  return {
    type: 'object' as const,
    properties: {
      statusCode: { type: 'number' as const, description: 'HTTP status code', example: statusCode },
      error: {
        type: 'string' as const,
        description: 'Error type (e.g., "Service Unavailable")',
        example: 'Internal Server Error',
      },
      message: {
        type: 'string' as const,
        description: 'Detailed error message',
        example: 'An unexpected error occurred on the server',
      },
    },
    required: ['statusCode', 'error', 'message'],
  };
};
