import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/guilds/:id/edit',
  method: 'POST',
  code: `
  $let[actor;$apiAuth[$getHeader[authorization];guilds.edit]]
  $let[body;$apiBody[65536]]
  $try[$apiRespond[$guildEdit[$getParameter[0];$get[body]];$get[actor];guilds.edit;$getParameter[0]];$apiRespond[{"status":500,"error":"Something went wrong."}]]
  `,
};

export = route;
