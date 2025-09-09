import { testServerSetup } from '@tests/helpers/setupTestServer';
import type { FastifyInstance } from 'fastify';
import supertest from 'supertest';

describe('Monitoring routes tests', () => {
  let app: FastifyInstance;
  let request: ReturnType<typeof supertest>;

  beforeAll(async () => {
    app = await testServerSetup(true);
    await app.ready();

    request = supertest(app.server);
  });

  afterAll(async () => {
    await app.close();
  });

  const HEALTHZ_URL = '/healthz';

  describe(`GET ${HEALTHZ_URL} tests`, () => {
    test('Should successfully return status code 204.', async () => {
      const resp = await request.get(HEALTHZ_URL);

      expect(resp.status).toBe(204);
      expect(resp.body).toEqual({});
      expect(resp.headers['x-api-provider']).toEqual('Powered by GSN');
    });
  });
});
