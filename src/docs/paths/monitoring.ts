import { unexpectedError } from '../responses';

export const monitoringRoutes = {
  '/healthz': {
    get: {
      tags: ['Monitoring'],
      summary: 'API Health Check',
      description: 'Checks the health of the API server.',
      responses: {
        204: { description: 'Success' },
        500: unexpectedError,
      },
    },
  },
};
