import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/cards',
  method: 'GET',
  code: `
  $sendJson[$cardList]
  `
};

export = route;
