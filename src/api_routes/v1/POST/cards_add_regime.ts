import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/cards/add/regime',
  method: 'POST',
  code: `
  $let[actor;$apiAuth[$getHeader[authorization];cards.edit]]
  $let[body;$apiBody[20971520]]
  $try[$apiRespond[$catalogEdit[cardAddRegime;;$get[body]];$get[actor];cards.add.regime;];$apiRespond[{"status":500,"error":"Something went wrong."}]]
  `,
};

export = route;
