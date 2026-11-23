import type { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/discovery',
  method: 'GET',
  code: '$sendJson[{"product":"Project Nationdex 2026","protocol":{"extras":1},"capabilities":{"remote-extras":true}}]',
};

export = route;
