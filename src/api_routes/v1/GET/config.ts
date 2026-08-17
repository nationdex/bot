import { RouteDefinition } from '@quoriel/api';

const route: RouteDefinition = {
  url: 'v1/config',
  method: 'GET',
  code: `
  $sendJson[$getGlobalVar[config]]
  `
};

export = route;
