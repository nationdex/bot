import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/nations/:id',
  method: 'POST',
  code: `
  $let[actor;$apiAuth[$getHeader[authorization];nations.edit]]
  $let[body;$apiBody[65536]]
  $try[$apiRespond[$catalogEdit[nationEdit;$getParameter[0];$get[body]];$get[actor];nations.edit;$getParameter[0]];$apiRespond[{"status":500,"error":"Something went wrong."}]]
  `,
};

export = route;
