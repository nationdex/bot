import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/config',
  method: 'POST',
  code: `
  $!apiAuth[$getHeader[authorization];config.edit]
  $let[body;$getBody]
  $try[$apiRespond[$configEdit[set;$get[body]]];$apiRespond[{"status":500,"error":"Something went wrong."}]]
  `,
};

export = route;
