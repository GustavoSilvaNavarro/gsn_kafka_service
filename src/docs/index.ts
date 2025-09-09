import { API_URL } from '@config';

import { monitoringRoutes } from './paths';

export const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'GSN Expenses Tracker API Reference',
    version: '1.0.0',
    description: 'Expenses Tracker API service to help track daily expenses.',
  },
  servers: [{ url: API_URL, description: 'Base no version server' }],
  tags: [
    { name: 'Monitoring', description: 'API health checks.' },
    { name: 'Users', description: 'User management endpoints.' },
    { name: 'Households', description: 'Households management endpoints.' },
  ],
  paths: { ...monitoringRoutes },
};
