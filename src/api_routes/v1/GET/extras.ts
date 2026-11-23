import type { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/extras',
  method: 'GET',
  code: `
  $let[actor;$apiAuth[$getHeader[authorization];extras.manage]]
  $let[result;$extrasOperation[list]]
  $apiRespond[$get[result];$get[actor];extras.list;]
  `,
};

export = route;
