import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/config',
  method: 'GET',
  code: `
  $!apiCors
  $sendJson[$getGlobalVar[config]]
  `
};

export = route;
