import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/nations/:id/category',
  method: 'POST',
  code: `
  $!apiAuth[$getHeader[authorization];nations.edit]
  $let[body;$getBody]
  $try[$apiRespond[$catalogEdit[nationCategory;$getParameter[0];$get[body]]];$apiRespond[{"status":500,"error":"Something went wrong."}]]
  `,
};

export = route;
