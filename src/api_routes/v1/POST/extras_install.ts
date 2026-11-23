import type { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/extras/install',
  method: 'POST',
  code: `
  $let[actor;$apiAuth[$getHeader[authorization];extras.manage]]
  $if[$startsWith[$getHeader[content-type];application/json]==false;
    $apiRespond[{"status":415,"error":"Expected application/json."}]
    $stop
  ]
  $let[result;$extrasOperation[install]]
  $apiRespond[$get[result];$get[actor];extras.install;]
  `,
};

export = route;
