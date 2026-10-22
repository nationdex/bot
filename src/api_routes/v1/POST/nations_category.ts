import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/nations/:id/category',
  method: 'POST',
  code: `
  $let[user;$apiAuth[$getHeader[authorization]]]
  $let[body;$if[$get[user]==;;$getBody]]
  $jsonLoad[r;$apiNationCategory[$get[user];$getParameter[0];$get[body]]]
  $writeStatus[$env[r;status];$env[r;statusText]]
  $sendJson[$env[r]]
  `,
};

export = route;
