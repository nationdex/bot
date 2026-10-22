import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/config/add',
  method: 'POST',
  code: `
  $let[user;$apiAuth[$getHeader[authorization]]]
  $let[body;$if[$get[user]==;;$getBody]]
  $jsonLoad[r;$apiConfigAdd[$get[user];$get[body]]]
  $writeStatus[$env[r;status];$env[r;statusText]]
  $sendJson[$env[r]]
  `,
};

export = route;
