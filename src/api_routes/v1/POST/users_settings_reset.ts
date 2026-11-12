import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/users/:id/settings/reset',
  method: 'POST',
  code: `
  $let[actor;$apiAuth[$getHeader[authorization];users.edit]]
  $try[$apiRespond[$userEdit[settingsReset;$getParameter[0]];$get[actor];users.settings.reset;$getParameter[0]];$apiRespond[{"status":500,"error":"Something went wrong."}]]
  `,
};

export = route;
