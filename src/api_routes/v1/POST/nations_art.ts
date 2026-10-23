import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/nations/:id/art',
  method: 'POST',
  code: `
  $let[actor;$apiAuth[$getHeader[authorization];cards.edit]]
  $let[body;$apiBody[20971520]]
  $try[$apiRespond[$catalogEdit[nationArt;$getParameter[0];$get[body]];$get[actor];nations.art;$getParameter[0]];$apiRespond[{"status":500,"error":"Something went wrong."}]]
  `,
};

export = route;
