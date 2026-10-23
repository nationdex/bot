import fs from 'fs';
import path from 'path';
import { RouteDefinition } from '@nationdex/api';

// One OPTIONS route per GET and POST URL, so a browser can send its CORS preflight before the real request.
// The answer only carries CORS headers for origins listed in config api.allowedOrigins.
const urls = new Set<string>();
for (const method of ['GET', 'POST']) {
  const folder = path.join(__dirname, '..', method);
  for (const file of fs.readdirSync(folder)) {
    if (!file.endsWith('.js')) continue;
    const mod = require(path.join(folder, file));
    const route = mod.default ?? mod;
    if (route?.url) urls.add(route.url);
  }
}

const routes: RouteDefinition[] = Array.from(urls).map((url) => ({
  url,
  method: 'OPTIONS',
  code: `
  $!apiCors[preflight]
  $writeStatus[204;No Content]
  $sendText[ ]
  `,
}));

export = routes;
