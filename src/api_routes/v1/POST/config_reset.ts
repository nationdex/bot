import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/config/reset',
  method: 'POST',
  code: `
  $let[actor;$apiAuth[$getHeader[authorization];config.edit]]
  $let[body;$apiBody[65536]]
  $try[$apiRespond[$configEdit[reset;$get[body]];$get[actor];config.reset;];$apiRespond[{"status":500,"error":"Something went wrong."}]]
  `,
};

export = route;
