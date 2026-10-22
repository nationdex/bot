import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/config/add',
  method: 'POST',
  code: `
  $!apiAuth[$getHeader[authorization];config.edit]
  $let[body;$getBody]
  $try[$apiRespond[$configEdit[add;$get[body]]];$apiRespond[{"status":500,"error":"Something went wrong."}]]
  `,
};

export = route;
