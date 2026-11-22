import type { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/categories/:name/delete',
  method: 'POST',
  code: `
  $let[actor;$apiAuth[$getHeader[authorization];cards.edit]]
  $try[$apiRespond[$catalogEdit[categoryDelete;$getParameter[0]];$get[actor];categories.delete;$getParameter[0]];$apiRespond[{"status":500,"error":"Something went wrong."}]]
  `,
};

export = route;
