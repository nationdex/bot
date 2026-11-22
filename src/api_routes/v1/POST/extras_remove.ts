import type { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/extras/remove',
  method: 'POST',
  code: `
  $let[actor;$apiAuth[$getHeader[authorization];extras.manage]]
  $if[$startsWith[$getHeader[content-type];application/json]==false;
    $apiRespond[{"status":415,"error":"Expected application/json."}]
    $stop
  ]
  $let[result;$extrasOperation[remove]]
  $apiRespond[$get[result];$get[actor];extras.remove;]
  `,
};

export = route;
