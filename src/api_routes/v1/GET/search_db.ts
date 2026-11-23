import type { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/search_db/:variable',
  method: 'GET',
  code: `
  $!apiAuth[$getHeader[authorization];inspect.read]
  $let[var;$getParameter[0]]
  $let[id;$getQuery[id]]
  $jsonLoad[result;$searchDB[$get[var];$get[id]]]

  $sendJson[$env[result]]
  `
}

export = route;
