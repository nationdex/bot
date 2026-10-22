import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/cards/backgrounds/:name/delete',
  method: 'POST',
  code: `
  $!apiAuth[$getHeader[authorization];cards.edit]
  $try[$apiRespond[$catalogEdit[backgroundDelete;$getParameter[0]]];$apiRespond[{"status":500,"error":"Something went wrong."}]]
  `,
};

export = route;
