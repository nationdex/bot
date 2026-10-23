import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/users/:id/nations/give',
  method: 'POST',
  code: `
  $let[actor;$apiAuth[$getHeader[authorization];users.edit]]
  $let[body;$apiBody[65536]]
  $try[$apiRespond[$userEdit[give;$getParameter[0];$get[body]];$get[actor];users.nations.give;$getParameter[0]];$apiRespond[{"status":500,"error":"Something went wrong."}]]
  `,
};

export = route;
