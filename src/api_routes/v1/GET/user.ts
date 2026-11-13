import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/user',
  method: 'GET',
  code: `
  $let[user;$getQuery[id]]

  $ifx[
    $if[$and[$get[user]!=;$userExists[$get[user]]];
      $let[trusted;$apiTrusted[$getHeader[authorization];inspect.read]]
      $let[inventory;$getUserVar[userCollectibles;$get[user]]]
      $let[auction;$getUserVar[auction;$get[user]]]
      $let[settings;$getUserVar[settings;$get[user]]]
      $jsonLoad[prefs;$default[$get[settings];{}]]
      $jsonLoad[out;{}]
      $jsonLoad[hide;{"private":true}]
      $!jsonSet[out;collectiblesData;$if[$or[$get[trusted]==true;$env[prefs;inventory_privacy]!=private];$get[inventory];$env[hide]]]
      $!jsonSet[out;auctionData;$if[$or[$get[trusted]==true;$env[prefs;profile_privacy]!=private];$get[auction];$env[hide]]]
      $!jsonSet[out;settings;$env[prefs]]
      $sendJson[$env[out]]
    ]
    $else[
      $writeStatus[404;Not Found]
      $sendJson[{"error": "User Not Found"}]
    ]
  ]
  `
};

export = route;
