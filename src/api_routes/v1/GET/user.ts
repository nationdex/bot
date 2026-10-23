import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/user',
  method: 'GET',
  code: `
  $!apiCors
  $let[user;$getQuery[id]]

  $ifx[
    $if[$and[$get[user]!=;$userExists[$get[user]]];
      $let[trusted;$apiTrusted[$getHeader[authorization];inspect.read]]
      $let[inventory;$getUserVar[userCollectibles;$get[user]]]
      $let[auction;$getUserVar[auction;$get[user]]]
      $let[settings;$getUserVar[settings;$get[user]]]
      $sendJson[$js[
        const settings = JSON.parse(ctx.getKeyword('settings') || 'null') || {};
        const trusted = ctx.getKeyword('trusted') === 'true';
        const hide = new Object();
        Reflect.set(hide, 'private', true);
        JSON.stringify({
          collectiblesData: trusted || settings.inventory_privacy !== 'private' ? JSON.parse(ctx.getKeyword('inventory')) : hide,
          auctionData: trusted || settings.profile_privacy !== 'private' ? JSON.parse(ctx.getKeyword('auction')) : hide,
          settings: settings,
        })
      ]]
    ]
    $else[
      $writeStatus[404;Not Found]
      $sendJson[{"error": "User Not Found"}]
    ]
  ]
  `
};

export = route;
