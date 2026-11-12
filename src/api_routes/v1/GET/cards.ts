import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/cards',
  method: 'GET',
  code: `
  $!apiCors
  $sendJson[$cardList]
  `
};

export = route;
