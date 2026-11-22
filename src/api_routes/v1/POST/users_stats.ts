import type { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/users/:id/stats',
  method: 'POST',
  code: `
  $let[actor;$apiAuth[$getHeader[authorization];users.edit]]
  $let[body;$apiBody[65536]]
  $try[$apiRespond[$userEdit[stat;$getParameter[0];$get[body]];$get[actor];users.stats;$getParameter[0]];$apiRespond[{"status":500,"error":"Something went wrong."}]]
  `,
};

export = route;
