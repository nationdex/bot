import type { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/cards/backgrounds/:name/replace',
  method: 'POST',
  code: `
  $let[actor;$apiAuth[$getHeader[authorization];cards.edit]]
  $let[body;$apiBody[20971520]]
  $try[$apiRespond[$catalogEdit[backgroundReplace;$getParameter[0];$get[body]];$get[actor];cards.backgrounds.replace;$getParameter[0]];$apiRespond[{"status":500,"error":"Something went wrong."}]]
  `,
};

export = route;
