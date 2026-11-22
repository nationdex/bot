import type { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/nations/:id/delete',
  method: 'POST',
  code: `
  $let[actor;$apiAuth[$getHeader[authorization];nations.edit]]
  $let[body;$apiBody[65536]]
  $try[$apiRespond[$nationDelete[$getParameter[0];$get[body]];$get[actor];nations.delete;$getParameter[0]];$apiRespond[{"status":500,"error":"Something went wrong."}]]
  `,
};

export = route;
