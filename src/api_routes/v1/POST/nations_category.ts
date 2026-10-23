import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/nations/:id/category',
  method: 'POST',
  code: `
  $let[actor;$apiAuth[$getHeader[authorization];nations.edit]]
  $let[body;$apiBody[65536]]
  $try[$apiRespond[$catalogEdit[nationCategory;$getParameter[0];$get[body]];$get[actor];nations.category;$getParameter[0]];$apiRespond[{"status":500,"error":"Something went wrong."}]]
  `,
};

export = route;
