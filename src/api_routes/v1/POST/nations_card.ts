import type { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/nations/:id/card',
  method: 'POST',
  code: `
  $let[actor;$apiAuth[$getHeader[authorization];cards.edit]]
  $let[body;$apiBody[65536]]
  $try[$apiRespond[$catalogEdit[nationCard;$getParameter[0];$get[body]];$get[actor];nations.card;$getParameter[0]];$apiRespond[{"status":500,"error":"Something went wrong."}]]
  `,
};

export = route;
