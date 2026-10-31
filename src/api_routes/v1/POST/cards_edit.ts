import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/cards/:name/edit',
  method: 'POST',
  code: `
  $let[actor;$apiAuth[$getHeader[authorization];cards.edit]]
  $let[body;$apiBody[20971520]]
  $try[$apiRespond[$catalogEdit[cardEdit;$getParameter[0];$get[body]];$get[actor];cards.edit;$getParameter[0]];$apiRespond[{"status":500,"error":"Something went wrong."}]]
  `,
};

export = route;
