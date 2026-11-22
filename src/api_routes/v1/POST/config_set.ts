import type { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/config',
  method: 'POST',
  code: `
  $let[actor;$apiAuth[$getHeader[authorization];config.edit]]
  $let[body;$apiBody[65536]]
  $try[$apiRespond[$configEdit[set;$get[body]];$get[actor];config.set;];$apiRespond[{"status":500,"error":"Something went wrong."}]]
  `,
};

export = route;
