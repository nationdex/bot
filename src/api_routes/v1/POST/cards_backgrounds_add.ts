import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/cards/backgrounds',
  method: 'POST',
  code: `
  $!apiAuth[$getHeader[authorization];cards.edit]
  $let[body;$getBody]
  $try[$apiRespond[$catalogEdit[backgroundAdd;;$get[body]]];$apiRespond[{"status":500,"error":"Something went wrong."}]]
  `,
};

export = route;
