import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/users/:id/settings',
  method: 'POST',
  code: `
  $!apiAuth[$getHeader[authorization];users.edit]
  $let[body;$getBody]
  $try[$apiRespond[$userEdit[setting;$getParameter[0];$get[body]]];$apiRespond[{"status":500,"error":"Something went wrong."}]]
  `,
};

export = route;
