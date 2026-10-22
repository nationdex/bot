import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/nations/:id',
  method: 'POST',
  code: `
  $!apiAuth[$getHeader[authorization];nations.edit]
  $let[body;$getBody]
  $try[$apiRespond[$catalogEdit[nationEdit;$getParameter[0];$get[body]]];$apiRespond[{"status":500,"error":"Something went wrong."}]]
  `,
};

export = route;
