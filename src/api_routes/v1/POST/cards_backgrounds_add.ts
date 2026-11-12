import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/cards/backgrounds',
  method: 'POST',
  code: `
  $let[actor;$apiAuth[$getHeader[authorization];cards.edit]]
  $let[body;$apiBody[20971520]]
  $try[$apiRespond[$catalogEdit[backgroundAdd;;$get[body]];$get[actor];cards.backgrounds.add;];$apiRespond[{"status":500,"error":"Something went wrong."}]]
  `,
};

export = route;
