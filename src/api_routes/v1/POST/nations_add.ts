import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/nations',
  method: 'POST',
  code: `
  $let[actor;$apiAuth[$getHeader[authorization];nations.edit]]
  $let[body;$apiBody[65536]]
  $try[$apiRespond[$catalogEdit[nationAdd;;$get[body]];$get[actor];nations.add;];$apiRespond[{"status":500,"error":"Something went wrong."}]]
  `,
};

export = route;
