import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/nations/:id/card',
  method: 'POST',
  code: `
  $!apiAuth[$getHeader[authorization];cards.edit]
  $let[body;$getBody]
  $try[$apiRespond[$catalogEdit[nationCard;$getParameter[0];$get[body]]];$apiRespond[{"status":500,"error":"Something went wrong."}]]
  `,
};

export = route;
