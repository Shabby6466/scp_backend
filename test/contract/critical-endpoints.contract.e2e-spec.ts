import * as fs from 'node:fs';
import * as path from 'node:path';

type Endpoint = {
  domain: string;
  method: string;
  pathNorm: string;
  frontend?: { file?: string; line?: number; snippet?: string };
  backend?: {
    status?: string;
    path?: string;
    httpMethod?: string;
    controllerFile?: string;
    handler?: string;
    serviceCall?: string | null;
  };
};

describe('Critical API endpoint contract integrity', () => {
  const backendRoot = path.resolve(__dirname, '..', '..');
  const repoRoot = path.resolve(backendRoot, '..');
  const inventoryPath = path.join(repoRoot, 'frontend', 'testing', 'critical-endpoints.json');
  const triagePath = path.join(repoRoot, 'testing', 'critical-not-found-triage.json');

  const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8')) as {
    endpoints: Endpoint[];
  };
  const endpoints = inventory.endpoints || [];

  it('has a frozen critical endpoint inventory', () => {
    expect(fs.existsSync(inventoryPath)).toBe(true);
    expect(endpoints.length).toBeGreaterThan(0);
  });

  it('keeps mapped backend controller references valid', () => {
    const mapped = endpoints.filter((e) => e.backend?.status === 'matched');
    expect(mapped.length).toBeGreaterThan(0);

    for (const endpoint of mapped) {
      const backend = endpoint.backend!;
      const controllerFile = backend.controllerFile;
      expect(controllerFile).toBeTruthy();
      const controllerPath = path.join(backendRoot, 'src', controllerFile!);
      expect(fs.existsSync(controllerPath)).toBe(true);

      const content = fs.readFileSync(controllerPath, 'utf8');
      const handler = backend.handler || '';
      if (handler && handler !== 'unknown') {
        expect(content.includes(`${handler}(`)).toBe(true);
      }
      expect(backend.path).toBeTruthy();
    }
  });

  it('enforces request-body handling on mutating mapped endpoints', () => {
    const mutating = new Set(['POST', 'PATCH', 'PUT']);
    const allowNoBody = new Set([
      '/invitations/:id/revoke',
      '/documents/:id/verify',
      '/document-types/:id/assign/:userId',
    ]);

    const mappedMutating = endpoints.filter(
      (e) => e.backend?.status === 'matched' && mutating.has(e.method),
    );
    expect(mappedMutating.length).toBeGreaterThan(0);

    for (const endpoint of mappedMutating) {
      const backend = endpoint.backend!;
      const controllerPath = path.join(backendRoot, 'src', backend.controllerFile!);
      const content = fs.readFileSync(controllerPath, 'utf8');
      const handler = backend.handler || '';
      if (!handler || handler === 'unknown') continue;
      if (allowNoBody.has(backend.path || '')) continue;

      const signatureMatch = content.match(
        new RegExp(`${handler}\\s*\\(([^)]*)\\)`, 'm'),
      );
      expect(signatureMatch).toBeTruthy();
      const signature = signatureMatch?.[1] || '';
      expect(signature.length).toBeGreaterThan(0);
    }
  });

  it('tracks unresolved not_found critical endpoints through triage', () => {
    expect(fs.existsSync(triagePath)).toBe(true);
    const triage = JSON.parse(fs.readFileSync(triagePath, 'utf8')) as {
      rows: Array<{ key: string; status: string }>;
    };
    const rows = triage.rows || [];
    const unresolved = endpoints.filter((e) => e.backend?.status === 'not_found');
    expect(rows.length).toBe(unresolved.length);

    const triageKeys = new Set(rows.map((r) => r.key));
    for (const endpoint of unresolved) {
      const key = `${endpoint.method} ${endpoint.pathNorm} ${endpoint.frontend?.file || ''}`;
      expect(triageKeys.has(key)).toBe(true);
    }
  });
});
