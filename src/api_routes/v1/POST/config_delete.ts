import type { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/config/delete',
  method: 'POST',
  code: `
  $let[actor;$apiAuth[$getHeader[authorization];config.edit]]
  $let[body;$apiBody[65536]]
  $try[$apiRespond[$configEdit[delete;$get[body]];$get[actor];config.delete;];$apiRespond[{"status":500,"error":"Something went wrong."}]]
  `,
};

export = route;
