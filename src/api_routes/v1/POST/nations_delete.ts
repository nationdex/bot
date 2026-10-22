import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/nations/:id/delete',
  method: 'POST',
  code: `
  $!apiAuth[$getHeader[authorization];nations.edit]
  $let[body;$getBody]
  $try[$apiRespond[$nationDelete[$getParameter[0];$get[body]]];$apiRespond[{"status":500,"error":"Something went wrong."}]]
  `,
};

export = route;
