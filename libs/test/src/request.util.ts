export class MockRequest extends Request {
  constructor(input: RequestInfo | URL, init: RequestInit & { json?: any }) {
    super(typeof input === 'string' && input.startsWith('/') ? `http://localhost${input}` : input, {
      ...init,
      headers: {
        ...(init.json ? { 'content-type': 'application/json' } : {}),
        ...init.headers,
      },
      body: init.json ? JSON.stringify(init.json) : init.body,
    });
  }
}
