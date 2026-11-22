import type { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/categories',
  method: 'POST',
  code: `
  $let[actor;$apiAuth[$getHeader[authorization];cards.edit]]
  $let[body;$apiBody[65536]]
  $try[$apiRespond[$catalogEdit[categoryAdd;;$get[body]];$get[actor];categories.add;];$apiRespond[{"status":500,"error":"Something went wrong."}]]
  `,
};

export = route;
